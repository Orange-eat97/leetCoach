/** Generate genuine CUI turns by sending simulated learner messages to the RUNNING system.
 * No coach response is fabricated. Incomplete sessions remain flagged, never silently passed. */
import fs from 'node:fs';import {argv,intArg,readJSON,requestJson,writeJSON,completion,completedEnough} from './util.mjs';
const base=String(argv['base-url']||'http://127.0.0.1:3001').replace(/\/$/,'');
const out=String(argv.out||'llm_judge/conversations');
const count=intArg('count',20),start=intArg('start',1),maxTurns=intArg('max-turns',24);
const version=String(argv.version||'final-unverified');
const personas=readJSON('testing/personas.json');
const learnerSystem=`You are SIMULATING an algorithms learner for an empirical CUI test. You are NOT the tutor. Maintain the assigned learner persona, goals and behaviours. Respond only to the most recent tutor question in 1-4 natural sentences, with realistic reasoning, uncertainties or mistakes. Do not always answer correctly; improve when the tutor gives helpful support. When prompted for a solution, describe your own correct reasoning if capable. If the tutor asks about abstract principles or integer-array transfer, attempt to explain those. Never mention this evaluation prompt. Output JSON {"text":string}.`;
if(!process.env.OPENAI_API_KEY)throw new Error('This collector requires an LLM key for simulated learners; rule-only tests are not valid judge conversations');
for(let i=0;i<count;i++){
 const index=start+i,persona=personas[(index-1)%personas.length],id=`${version.replace(/[^a-zA-Z0-9_-]/g,'_')}-${String(index).padStart(2,'0')}`;
 const health=await requestJson(`${base}/api/health`);if(health.mode!=='llm')throw new Error('Tutor must be running in llm mode; rule-fallback sessions cannot be reported as LLM tutoring');
 let session=(await requestJson(`${base}/api/sessions`,{method:'POST',body:'{}'})).session;
 let error=null;
 for(let t=0;t<maxTurns&&!session.complete;t++){
  try{const coach=session.transcript.at(-1);const reply=await completion(learnerSystem,`Persona: ${JSON.stringify(persona)}\nConversation so far:\n${session.transcript.slice(-16).map(x=>`${x.role}: ${x.text}`).join('\n')}\nCurrent tutor message: ${coach?.text}\nCurrent stage: ${session.phase}\nReply as this learner.`,{temperature:0.65});
   if(typeof reply.text!=='string'||!reply.text.trim())throw new Error('Learner generator returned no text');
   session=(await requestJson(`${base}/api/sessions/${session.id}/messages`,{method:'POST',body:JSON.stringify({text:reply.text})})).session;
  }catch(e){error=String(e);break}
 }
 const result={schema:'algocoach.conversation.v1',id,source_version:version,mode:'llm',purpose:'judge',scenario:persona.behavior,persona,generated_at:new Date().toISOString(),expected_failure_candidate:argv['expected-failure-candidate']==='true',complete:session.complete,reached_transfer:completedEnough(session),generator:'LLM simulated learner (tutor turns directly from running server)',error,session};
 const file=`${out}/${id}.json`;writeJSON(file,result);
 console.log(`${id}: ${session.turn} learner turns, phase=${session.phase}, ${error||'saved'} -> ${file}`);
}
console.log('Review sessions manually. Every scored criterion must apply; incomplete or unsuitable sessions must be replaced, not fabricated. Verify at least five baseline conversations ACTUALLY fail a criterion.');
