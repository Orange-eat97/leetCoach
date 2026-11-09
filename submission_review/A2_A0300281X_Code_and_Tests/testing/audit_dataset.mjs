/** Inspect test-set coverage without inventing expected failures. */
import fs from 'node:fs';import path from 'node:path';
import {argv,readCollection,writeJSON,completedEnough} from './util.mjs';
const source=String(argv.input||'llm_judge/conversations');
const files=fs.statSync(source).isDirectory()?fs.readdirSync(source).filter(x=>x.endsWith('.json')).map(x=>path.join(source,x)):[source];
const cases=files.flatMap(readCollection),seen=new Set();const concerns=[];const versions={};
for(const c of cases){if(seen.has(c.id))concerns.push(`${c.id}: duplicate identifier`);seen.add(c.id);
 versions[c.source_version]=(versions[c.source_version]||0)+1;
 const turns=c.session?.transcript||[],learnerCount=turns.filter(t=>t.role==='learner').length;
 if(c.mode!=='llm')concerns.push(`${c.id}: non-LLM tutor`);
 if(learnerCount<3)concerns.push(`${c.id}: insufficient multi-turn learner interaction (${learnerCount})`);
 if(!completedEnough(c.session||{}))concerns.push(`${c.id}: did not reach transfer stage; verify chosen criteria apply`);
 if(c.error)concerns.push(`${c.id}: interrupted generation: ${c.error}`);
 if(c.expected_failure_candidate)concerns.push(`${c.id}: expected-failure CANDIDATE only; human must confirm an actual criterion failure`);
 const fallback=(c.session?.events||[]).filter(e=>e.kind==='coach_reply'&&e.source!=='llm');
 if(fallback.length)concerns.push(`${c.id}: ${fallback.length} tutor messages came from fallback/unknown source`);
}
if(cases.length<20)concerns.push(`Only ${cases.length} conversations found; need at least 20`);
const result={conversations:cases.length,source_versions:versions,expected_failure_candidates:cases.filter(c=>c.expected_failure_candidate).length,concerns};
writeJSON(String(argv.output||'llm_judge/dataset_audit.json'),result);
console.log(JSON.stringify(result,null,2));
if(concerns.some(c=>/Only \d+ conversations|non-LLM tutor|duplicate identifier/.test(c)))process.exitCode=1;
