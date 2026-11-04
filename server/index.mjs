import http from 'node:http';
import {newSession,transition,attachReply,publicState} from './engine.mjs';
import {interpret,generate,mode} from './models.mjs';
import {providerConfig} from './provider.mjs';
const sessions=new Map();
const port=Number(process.env.PORT||3001);
const frontendUrl=process.env.FRONTEND_URL||'http://127.0.0.1:5173/';
const readJson=async req=>{let s='';for await(const chunk of req){s+=chunk;if(s.length>15000)throw new Error('Request too large');}return JSON.parse(s||'{}');};
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/'){
    res.writeHead(302,{Location:frontendUrl,'Cache-Control':'no-store'});
    return res.end();
  }
  if(req.method==='GET'&&url.pathname==='/api/health'){
    const config=providerConfig();
    return send(res,200,{status:'ok',mode:mode(),provider:config.provider,model:config.model});
  }
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
      // Model diagnostics are safe metadata only: never prompts, completions, or credentials.
      const diagnostics=[];const onDiagnostic=event=>{
        const recorded={...event,turn:state.turn+1};diagnostics.push(recorded);
        console.log(`[model] turn=${recorded.turn} stage=${recorded.stage} outcome=${recorded.outcome} duration=${recorded.durationMs}ms model=${recorded.model}${recorded.httpStatus?` status=${recorded.httpStatus}`:''}${recorded.requestId?` request=${recorded.requestId}`:''}`);
      };
      try {
        // Do not commit the learner turn until interpretation, policy, and dialogue generation finish.
        const observation=await interpret(state,body.text,onDiagnostic);
        const observed=structuredClone(state);observed.events.push(...diagnostics);
        const interpreterEventCount=diagnostics.length;
        const {state:next,decision}=transition(observed,body.text,observation);
        const response=await generate(next,decision,observation,onDiagnostic);
        const generated=structuredClone(next);generated.events.push(...diagnostics.slice(interpreterEventCount));
        const committed=attachReply(generated,response);sessions.set(id,committed);
        return send(res,200,{session:publicState(committed),decision,mode:mode()});
      } catch(error) {
        const failed=structuredClone(state);const latest=diagnostics.at(-1);
        failed.events.push(...diagnostics,{kind:'turn_failed',turn:state.turn+1,stage:latest?.stage||'server',
          outcome:latest?.outcome||'error',at:new Date().toISOString(),
          error:error instanceof Error?error.message:'Unknown error',learnerText:body.text});
        sessions.set(id,failed);
        const status=latest?.outcome==='timeout'?504:502;
        return send(res,status,{error:error instanceof Error?error.message:'Unknown error',
          session:publicState(failed),diagnostic:latest||null,mode:mode()});
      }
    }
  }
  return send(res,404,{error:'Not found'});
 }catch(e){return send(res,500,{error:e instanceof Error?e.message:'Unknown error'});}
});
server.listen(port,'127.0.0.1',()=>{
 console.log(`AlgoCoach API on http://127.0.0.1:${port} (${mode()})`);
 console.log(`Frontend: ${frontendUrl} (run \`npm.cmd run dev\` in a second terminal)`);
});
