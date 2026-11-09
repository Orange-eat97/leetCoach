import {argv,readJSON,writeJSON} from './util.mjs';
export function agreement(rows){
 if(!rows.length)return {n:0,agreement:null,kappa:null,confusion:{PP:0,PF:0,FP:0,FF:0}};
 const n=rows.length,PP=rows.filter(r=>r.human==='PASS'&&r.judge==='PASS').length,PF=rows.filter(r=>r.human==='PASS'&&r.judge==='FAIL').length,FP=rows.filter(r=>r.human==='FAIL'&&r.judge==='PASS').length,FF=rows.filter(r=>r.human==='FAIL'&&r.judge==='FAIL').length;
 const observed=(PP+FF)/n;const expected=((PP+PF)*(PP+FP)+(FP+FF)*(PF+FF))/(n*n);
 return {n,agreement:observed,agreement_percent:100*observed,kappa:expected===1?null:(observed-expected)/(1-expected),expected_agreement:expected,confusion:{PP,PF,FP,FF}};
}
export function compare(labels,judgeResults){const results=[];for(const j of judgeResults){const human=labels[j.conversation_id]?.[j.criterion_id]?.verdict;if(!human||!['PASS','FAIL'].includes(j.verdict))continue;results.push({...j,human,agree:human===j.verdict});}const summary={};for(const c of new Set(results.map(x=>x.criterion_id))){const subset=results.filter(x=>x.criterion_id===c);summary[c]=agreement(subset.map(x=>({human:x.human,judge:x.verdict})));}return {summary,disagreements:results.filter(r=>!r.agree),matched_count:results.length,skipped_count:judgeResults.length-results.length};}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
 const humanFile=String(argv.human||'llm_judge/human_labels.json'),judgeFile=String(argv.judge||'llm_judge/judge_results/v1_results.json');
 const labels=readJSON(humanFile).labels||readJSON(humanFile);const results=readJSON(judgeFile).results;
 const output=compare(labels,results);writeJSON(String(argv.output||'llm_judge/judge_results/agreement.json'),output);
 console.log(JSON.stringify(output.summary,null,2));console.log('Disagreements:',output.disagreements.map(x=>`${x.conversation_id}/${x.criterion_id}`).join(', ')||'none');
 if(output.skipped_count)console.warn(`WARNING: ${output.skipped_count} verdicts were missing labels or invalid; do not report as fully labeled.`);
}
