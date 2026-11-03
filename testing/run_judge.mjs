import fs from 'node:fs';import path from 'node:path';import {argv,completion,readCollection,writeJSON,visibleTranscript} from './util.mjs';
const source=String(argv.input||'llm_judge/conversations');
const promptVersion=String(argv['prompt-version']||'v1');
const promptDir=path.join('llm_judge/prompts',promptVersion);
const files=fs.statSync(source).isDirectory()?fs.readdirSync(source).filter(f=>f.endsWith('.json')).map(f=>path.join(source,f)): [source];
const criteria=String(argv.criteria||'reasoning_alignment,evidence_gating').split(',').map(x=>x.trim()).filter(Boolean);
const conversations=files.flatMap(readCollection);
if(!conversations.length)throw new Error('No transcripts found');
const results=[];
for(const c of conversations){
 if(c.mode!=='llm')throw new Error(`${c.id} was not produced in the live LLM mode; do not judge it as an LLM tutoring test`);
 if(!c.session?.transcript?.length)throw new Error(`Missing visible transcript: ${c.id}`);
 for(const criterion of criteria){const prompt=fs.readFileSync(path.join(promptDir,`${criterion}.md`),'utf8');
  let verdict='ERROR',reason='';
  try{const answer=await completion(prompt,`Conversation ${c.id} (version ${c.source_version}):\n\n${visibleTranscript(c.session)}`);
    verdict=answer.verdict==='PASS'||answer.verdict==='FAIL'?answer.verdict:'ERROR';reason=String(answer.reason||'Invalid judge response');
  }catch(e){reason=String(e)}
  const row={conversation_id:c.id,source_version:c.source_version,criterion_id:criterion,verdict,reason,prompt_version:promptVersion};results.push(row);
  console.log(`${c.id} ${criterion}: ${verdict}`);
 }
}
const output=String(argv.output||`llm_judge/judge_results/${promptVersion}_results.json`);
writeJSON(output,{schema:'algocoach.judge-results.v1',model:process.env.OPENAI_MODEL||'gpt-4o-mini',prompt_version:promptVersion,created_at:new Date().toISOString(),results});console.log(`Saved ${output}`);
