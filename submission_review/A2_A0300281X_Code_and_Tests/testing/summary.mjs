import {argv,readJSON,writeJSON} from './util.mjs';
const file=String(argv.judge||'llm_judge/judge_results/v1_results.json');const rows=readJSON(file).results;
const manualArg=argv.human?readJSON(String(argv.human)):null;
const manual=manualArg?.labels||manualArg||{};
const grouped={};for(const r of rows){const key=`${r.source_version} / ${r.criterion_id}`;grouped[key]??={count:0,judge_passes:0,human_count:0,human_passes:0};const g=grouped[key];if(!['PASS','FAIL'].includes(r.verdict))continue;g.count++;if(r.verdict==='PASS')g.judge_passes++;const h=manual[r.conversation_id]?.[r.criterion_id]?.verdict;if(h==='PASS'||h==='FAIL'){g.human_count++;if(h==='PASS')g.human_passes++}}
const summary=Object.fromEntries(Object.entries(grouped).map(([key,g])=>[key,{...g,judge_pass_rate:g.count?g.judge_passes/g.count:null,human_pass_rate:g.human_count?g.human_passes/g.human_count:null}]));
writeJSON(String(argv.output||'llm_judge/judge_results/pass_rates.json'),{prompt_version:readJSON(file).prompt_version,summary});console.log(JSON.stringify(summary,null,2));
