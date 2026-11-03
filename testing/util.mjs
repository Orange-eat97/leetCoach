import fs from 'node:fs';import path from 'node:path';
export const argv = Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const [k,...v]=x.slice(2).split('=');return [k,v.length?v.join('='):true]}));
export function ensure(file){fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});}
export function writeJSON(file,value){ensure(file);fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
export function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
export function readCollection(file){const data=readJSON(file);if(Array.isArray(data))return data;if(Array.isArray(data.conversations))return data.conversations;if(Array.isArray(data.cases))return data.cases;return [data];}
export function intArg(key,def){const n=Number(argv[key]);return Number.isInteger(n)&&n>0?n:def;}
export async function requestJson(url,opts={}){const result=await fetch(url,{...opts,headers:{'Content-Type':'application/json',...opts.headers}});const data=await result.json();if(!result.ok)throw new Error(`${result.status} ${data.error||JSON.stringify(data)}`);return data;}
export function visualDescription(id){return id==='offset'?'The displayed offset comparison shows BABC starts at different indices in ABABC and BABCA.':id==='dp'?'The displayed DP table shows the lengths of shared contiguous runs ending at each pair of positions.':'None';}
export function visibleTranscript(session){return (session.transcript||[]).map((turn,i)=>`${i+1}. ${turn.role==='coach'?'TUTOR':'LEARNER'}${turn.role==='coach'&&turn.action?` (${turn.action})`:''}: ${turn.text}${turn.visual?`\n[VISIBLE VISUAL: ${visualDescription(turn.visual)}]`:''}`).join('\n\n');}
export async function completion(system,user,{temperature=0,model=process.env.OPENAI_MODEL||'gpt-4o-mini'}={}){
 if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required for real model-based test generation and judging');
 const base=(process.env.OPENAI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,'');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
 try {const res=await fetch(`${base}/chat/completions`,{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,temperature,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:user}]})});
 if(!res.ok)throw new Error(`Model call failed ${res.status}: ${(await res.text()).slice(0,300)}`);
 const body=await res.json();return JSON.parse(body.choices?.[0]?.message?.content||'{}');
 }finally{clearTimeout(timeout)}
}
export function completedEnough(session){return session.turn>=4 && session.transcript.some(t=>t.role==='coach'&&t.action==='ASK_TRANSFER')}
