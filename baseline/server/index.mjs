import http from 'node:http';
import {newSession,transition,attachReply,publicState} from './engine.mjs';
import {interpret,generate,mode} from './models.mjs';
const sessions=new Map();
const port=Number(process.env.PORT||3001);
const readJson=async req=>{let s='';for await(const chunk of req){s+=chunk;if(s.length>15000)throw new Error('Request too large');}return JSON.parse(s||'{}');};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{status:'ok',mode:mode()});
  if(req.method==='POST'&&url.pathname==='/api/sessions'){
    const state=newSession();sessions.set(state.id,state);return send(res,201,{session:publicState(state),mode:mode()});
  }
  const match=url.pathname.match(/^\/api\/sessions\/([\w-]+)(?:\/messages)?$/);
  if(match){
    const id=match[1],state=sessions.get(id);if(!state)return send(res,404,{error:'Session not found'});
    if(req.method==='GET'&&!url.pathname.endsWith('/messages'))return send(res,200,{session:publicState(state)});
    if(req.method==='POST'&&url.pathname.endsWith('/messages')) {
      const body=await readJson(req);if(typeof body.text!=='string'||!body.text.trim()||body.text.length>3000)return send(res,400,{error:'Invalid learner message'});
      if(state.complete)return send(res,409,{error:'Session is complete'});
      // Do not mutate the session until interpretation, policy, and dialogue generation all finish.
      const observation=await interpret(state,body.text);const {state:next,decision}=transition(state,body.text,observation);
      const response=await generate(next,decision,observation);const committed=attachReply(next,response);sessions.set(id,committed);
      return send(res,200,{session:publicState(committed),decision,mode:mode()});
    }
  }
  return send(res,404,{error:'Not found'});
 }catch(e){return send(res,500,{error:e instanceof Error?e.message:'Unknown error'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`AlgoCoach API on http://127.0.0.1:${port} (${mode()})`));
