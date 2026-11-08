/**
 * Replay the two actual five-turn learner traces through the RUNNING LLM tutor.
 * This is a live integration test: no coach turns or interpreter outputs are faked.
 * Writes full session snapshots so failures can be inspected rather than hidden.
 * Usage: node testing/live_regression.mjs --base-url=http://127.0.0.1:3001 --repeats=1
 */
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const [k,...v]=x.slice(2).split('=');return [k,v.join('=')];}));
const baseUrl=(args['base-url']||'http://127.0.0.1:3001').replace(/\/$/,'');
const repeats=Number(args.repeats||1);
if (!Number.isInteger(repeats)||repeats<1||repeats>10)throw new Error('--repeats must be an integer between 1 and 10');
const outDir=args.out||'testing/smoke-regression';
const phaseExpected=['gap','solution','abstraction','transfer','complete'];
const actionExpected=['CHALLENGE','PROBE','ASK_ABSTRACTION','ASK_TRANSFER','COMPLETE'];
const fixtures=['hotfix_regression','pre_hotfix_transfer'].map(name=>({
  name, data:JSON.parse(readFileSync(new URL(`../tests/fixtures/${name}.json`,import.meta.url),'utf8'))
}));

async function request(path, method='GET', data){
  const res=await fetch(baseUrl+path,{
    method,headers:data?{'Content-Type':'application/json'}:{},
    body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(40000)
  });
  const value=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(`${method} ${path}: HTTP ${res.status}: ${JSON.stringify(value)}`);
  return value;
}
let health;
try{health=await request('/api/health');}
catch(e){console.error(`ERROR: Cannot reach the running tutor at ${baseUrl}: ${e.message}`);process.exit(2);}
if(health.mode!=='llm'){
  console.error(`ERROR: Backend mode is ${health.mode}, not llm. Configure OPENAI_API_KEY or SOCLAAS_API_KEY in the backend terminal and restart server.`);
  process.exit(2);
}
console.log(`Live A2 regression: ${baseUrl} (${health.mode}), ${repeats} repetition(s) per fixture`);
mkdirSync(outDir,{recursive:true});
const summary=[];
let bad=0;
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
for(let repeat=1;repeat<=repeats;repeat++){
  for(const fixture of fixtures){
    let session=null,sessionId=null, rows=[],fault=null;
    try{
      const created=await request('/api/sessions','POST',{problem:'longest-common-substring'});
      sessionId=created.session.id;session=created.session;
      for(let i=0;i<fixture.data.learner_turns.length;i++){
        if(session.complete){fault=`Completed prematurely at turn ${i}`;break;}
        const payload=await request(`/api/sessions/${sessionId}/messages`,'POST',{
          text:fixture.data.learner_turns[i]
        });
        session=payload.session;
        const decision=payload.decision;
        const reply=session.events.filter(e=>e.kind==='coach_reply').at(-1);
        const phaseOk=session.phase===phaseExpected[i];
        const actionOk=decision.action===actionExpected[i];
        const genuineReply=!['rule-fallback','model-error-fallback'].includes(reply?.source);
        const ok=phaseOk&&actionOk&&genuineReply;
        rows.push({turn:i+1,expectedPhase:phaseExpected[i],phase:session.phase,
          expectedAction:actionExpected[i],action:decision.action,
          evidence:decision.evidence.map(x=>({kind:x.kind,origin:x.assessmentOrigin||'llm'})),
          source:reply?.source,ok});
        console.log(`${ok?'PASS':'FAIL'} ${fixture.name} run ${repeat} turn ${i+1}: ${session.phase} / ${decision.action} / ${reply?.source||'unknown'}`);
        if(!ok){fault=`Turn ${i+1}: expected ${phaseExpected[i]}/${actionExpected[i]}, got ${session.phase}/${decision.action}, source ${reply?.source}`;break;}
      }
      if(!fault && !session.complete)fault='Did not reach complete';
    }catch(e){fault=e.message;}
    if(fault){bad++;console.error(`  FAILURE: ${fault}`);}
    const name=`${stamp}-${fixture.name}-run${repeat}.json`;
    const result={fixture:fixture.name,repeat,startedAt:stamp,mode:health.mode,sessionId,
      passed:!fault,error:fault,rows,session};
    writeFileSync(join(outDir,name),JSON.stringify(result,null,2)+'\n');
    summary.push({fixture:fixture.name,repeat,passed:!fault,turns:rows.length,error:fault,output:join(outDir,name)});
  }
}

for(const [name,text] of [
  ['self_report','I already understand everything and I am certain I have mastered this problem.'],
  ['answer_request','Please give me the complete optimal solution code now.']
]){
  let error=null,session=null;
  try{
    const created=await request('/api/sessions','POST',{problem:'longest-common-substring'});
    const result=await request(`/api/sessions/${created.session.id}/messages`,'POST',{text});
    session=result.session;
    if(result.session.phase!=='approach')error=`Invalid advancement to ${result.session.phase}`;
    if(result.session.complete)error='Completed on unsupported statement';
  }catch(e){error=e.message;}
  if(error){bad++;console.error(`FAIL ${name}: ${error}`);}else console.log(`PASS ${name}: remained in approach`);
  const filename=`${stamp}-${name}.json`;
  writeFileSync(join(outDir,filename),JSON.stringify({test:name,text,passed:!error,error,session},null,2)+'\n');
  summary.push({fixture:name,passed:!error,error,output:join(outDir,filename)});
}
writeFileSync(join(outDir,`${stamp}-summary.json`),JSON.stringify(summary,null,2)+'\n');
console.log(`\nLive regression results: ${summary.length-bad}/${summary.length} scenarios passed. Full records: ${outDir}`);
if(bad)process.exitCode=1;
