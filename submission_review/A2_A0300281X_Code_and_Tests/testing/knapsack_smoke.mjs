/** Against the running API; rule-only mode tests plumbing, LLM mode tests genuine model judgement. */
import {writeJSON} from './util.mjs';

const base=process.env.COACH_BASE_URL||'http://127.0.0.1:3001';
const input=[
 'I sort items by value-to-weight ratio and select each one if it still fits the bag capacity.',
 'Greedy ratio fails: it chooses A and B worth 160, but B and C worth 220 is better. Greedy makes locally optimal picks but misses other feasible combinations.',
 'I use dp[i][w] as the maximum value from the first i items within capacity w. For each item I compare skip dp[i-1][w] with take v_i+dp[i-1][w-weight_i] if it fits; using previous row means each item is used once. Take the maximum.',
 'The reusable principle is to model each item as an include-or-skip decision, with a state tracking processed items and remaining capacity. This prevents reusing an item and represents all viable choices.',
 'For equal subset partition, total sum must be even and target is half the total sum. Use a boolean reachable state for the first i numbers and target sum, with include or skip transitions using each number at most once; check if the target can be reached.'
];
const expected=['gap','solution','abstraction','transfer','complete'];
const request=async(path,body)=>{const res=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await res.json();if(!res.ok)throw Error(`${res.status}: ${JSON.stringify(data)}`);return data;};
const health=await request('/api/health');
let session=(await request('/api/sessions',{problem:'zero-one-knapsack'})).session;
if(session.problem!=='zero-one-knapsack')throw Error('Knapsack selection not respected');
const rows=[];
for(let i=0;i<input.length;i++){
 const reply=await request(`/api/sessions/${session.id}/messages`,{text:input[i]});session=reply.session;
 const good=session.phase===expected[i];const source=session.events.filter(e=>e.kind==='coach_reply').at(-1)?.source||'unknown';
 rows.push({turn:i+1,expected:expected[i],actual:session.phase,source,good});
 console.log(`${good?'PASS':'FAIL'} turn ${i+1}: expected ${expected[i]}, actual ${session.phase}, source ${source}`);
}
const legacy=(await request('/api/sessions',{problem:'longest-common-substring'})).session;
const legacyOk=legacy.problem==='longest-common-substring'&&/substring/i.test(legacy.transcript[0].text);
console.log(`${legacyOk?'PASS':'FAIL'} legacy substring session available`);
const result={schema:'algocoach.knapsack-smoke.v1',timestamp:new Date().toISOString(),mode:health.mode,rows,legacyOk,session};
writeJSON('testing/knapsack-smoke-result.json',result);
if(rows.some(x=>!x.good)||!legacyOk)process.exitCode=1;
