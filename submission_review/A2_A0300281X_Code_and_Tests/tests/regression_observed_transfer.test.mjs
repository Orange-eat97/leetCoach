import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSession,transition,attachReply,validateReply} from '../server/engine.mjs';
import {normalizeInterpretation,strongTransferEvidence,generate,interpret} from '../server/models.mjs';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/live_transfer_false_negative.json',import.meta.url),'utf8'));
const ev=(kind,quote)=>({kind,supported:true,quote,rationale:'Grounded checkable explanation that supports this exact milestone.'});
const advance=(s,kind,text)=>transition(s,text,{intent:'reasoning',status:'progressing',ambiguous:false,evidence:[ev(kind,text)]}).state;
function readyForTransfer(){
  let s=newSession('regression-session');
  s=advance(s,'approach_explained','I compare the two strings by advancing both pointers together and resetting a match after a mismatch.');
  s=advance(s,'limitation_explained','A lockstep comparison misses substrings starting at different offsets, such as BABC at shifted starting indices.');
  s=advance(s,'correct_method','I compare every pair of ending positions. Matching characters extend a diagonal DP run, a mismatch resets that run to zero, and I keep the largest, covering shifted alignments.');
  s=advance(s,'principle_explained','The reusable principle is that comparing two sequences can track a contiguous run by ending positions: extend matching pairs along the diagonal and reset at mismatches.');
  assert.equal(s.phase,'transfer');
  return s;
}

test('reproduces real failure and recovers exact learner explanation under misclassified request_answer',()=>{
  const s=readyForTransfer();
  const interpretation=normalizeInterpretation(s,fixture.learnerText,fixture.observedInterpretation);
  assert.equal(interpretation.requestsFullAnswer,false);
  const e=interpretation.evidence.find(x=>x.kind===fixture.expectedEvidenceKind);
  assert.ok(e);assert.equal(e.assessmentOrigin,'phase-rubric-recovery');
  const r=transition(s,fixture.learnerText,interpretation);
  assert.equal(r.state.phase,'complete'); assert.equal(r.state.complete,true);
  assert.equal(r.decision.action,'COMPLETE');
  assert.equal(r.state.evidence.at(-1).assessmentOrigin,'phase-rubric-recovery');
});

test('controller credits independently supplied evidence despite a wrong request_answer intent',()=>{
  const s=readyForTransfer();const t=fixture.learnerText;
  const r=transition(s,t,{intent:'request_answer',status:'progressing',ambiguous:false,evidence:[ev('transfer_applied',t)]});
  assert.equal(r.state.complete,true);assert.equal(r.decision.action,'COMPLETE');
});

test('a genuine answer request without reasoning is not rewarded',()=>{
  const s=readyForTransfer();
  const t='Please give me the full solution code.';
  const interpretation=normalizeInterpretation(s,t,{intent:'request_answer',status:'unknown',ambiguous:false,evidence:[]});
  assert.equal(interpretation.requestsFullAnswer,true);
  const r=transition(s,t,interpretation);
  assert.equal(r.state.phase,'transfer');assert.equal(r.decision.action,'HINT');
});

test('transfer recovery does not accept a vague or reversed recurrence',()=>{
  const s=readyForTransfer();
  const vague='The same DP should work for integer arrays. I know it is correct.';
  assert.equal(strongTransferEvidence(vague),null);
  assert.equal(transition(s,vague,normalizeInterpretation(s,vague,{intent:'reasoning',status:'progressing',ambiguous:false,evidence:[]})).state.phase,'transfer');
  const reversed='For two integer arrays I use dp[i][j] ending at the indices, equal elements reset the value to zero and unequal elements extend the diagonal by one. I track the largest value.';
  assert.equal(strongTransferEvidence(reversed),null);
});

test('abstraction prompt is controller-owned and does not mention arrays or a new problem',async()=>{
  let s=newSession();
  s=advance(s,'approach_explained','I compare the two strings by advancing two pointers together and reset on mismatch.');
  s=advance(s,'limitation_explained','A lockstep scan skips matches that start at shifted offsets, so I need multiple alignments.');
  const t='I use a DP table tracking matching contiguous suffix lengths at every ending pair; matching extends the diagonal and mismatch resets to zero, tracking the best.';
  const r=transition(s,t,{intent:'reasoning',ambiguous:false,evidence:[ev('correct_method',t)]});
  const reply=await generate(r.state,r.decision,{});
  assert.equal(reply.source,'policy-template');
  assert.equal(r.decision.action,'ASK_ABSTRACTION');
  assert.match(reply.text,/principle|invariant/i);assert.doesNotMatch(reply.text,/integer arrays|repeated subarray/i);
});

test('transfer prompt is controller-owned and completion is terminal with no hint',async()=>{
  const s=readyForTransfer();
  const intro=await generate(s,{action:'ASK_TRANSFER',from:'abstraction',to:'transfer',evidence:[],reason:'extracted principle'},{});
  assert.equal(intro.source,'policy-template'); assert.match(intro.text,/integer arrays/i);
  const t=fixture.learnerText;
  const obs=normalizeInterpretation(s,t,fixture.observedInterpretation);
  const r=transition(s,t,obs);
  const reply=await generate(r.state,r.decision,obs);
  const committed=attachReply(r.state,reply);
  assert.equal(reply.source,'policy-template');assert.match(reply.text,/complete/i);
  assert.doesNotMatch(reply.text,/\?$/);
  assert.equal(committed.transcript.at(-1).action,'COMPLETE');
  assert.equal(committed.events.at(-1).source,'policy-template');
  assert.throws(()=>transition(committed,'Any more questions?',obs),/Session is complete/);
});

test('transfer generator rejects an unrelated extension and uses a focused hint instead',()=>{
  assert.equal(validateReply({text:'What happens if the arrays include negative numbers or zeros?',visual:null},
    {action:'HINT',to:'transfer'}),false);
  assert.equal(validateReply({text:'How do equal and unequal array elements affect the contiguous run?',visual:null},
    {action:'HINT',to:'transfer'}),true);
});

test('live-compatible model response processing recovers old false negative',async()=>{
  const originalFetch=globalThis.fetch;
  const originalOpenAiKey=process.env.OPENAI_API_KEY;
  const originalSoclaasKey=process.env.SOCLAAS_API_KEY;
  globalThis.fetch=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify(fixture.observedInterpretation)}}]})});
  process.env.OPENAI_API_KEY='unit-test-only';
  delete process.env.SOCLAAS_API_KEY;
  try{
    const s=readyForTransfer();
    const obs=await interpret(s,fixture.learnerText);
    assert.equal(obs.evidence.some(e=>e.kind==='transfer_applied'),true);
    assert.equal(transition(s,fixture.learnerText,obs).state.complete,true);
  }finally{
    globalThis.fetch=originalFetch;
    if(originalOpenAiKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalOpenAiKey;
    if(originalSoclaasKey===undefined)delete process.env.SOCLAAS_API_KEY;else process.env.SOCLAAS_API_KEY=originalSoclaasKey;
  }
});

test('a correct explanation and an explicit code request can coexist without erasing the explanation',()=>{
  const s=readyForTransfer();
  const t=`${fixture.learnerText} Please give me the full code.`;
  const o=normalizeInterpretation(s,t,{intent:'request_answer',status:'progressing',ambiguous:false,evidence:[ev('transfer_applied',fixture.learnerText)]});
  assert.equal(o.requestsFullAnswer,true);
  const r=transition(s,t,o);
  assert.equal(r.state.phase,'complete');assert.equal(r.decision.action,'COMPLETE');
});

test('two unproductive abstraction turns switch from repeating the template to a targeted hint',()=>{
  let s=newSession();
  s=advance(s,'approach_explained','I would compare the strings with two moving pointers and reset after a mismatch.');
  s=advance(s,'limitation_explained','This skips substring matches that begin at different offsets because only one alignment is tried.');
  s=advance(s,'correct_method','I compute all ending-position pairs; matches extend diagonally, mismatches reset contiguous runs, and I track the maximum for all alignments.');
  assert.equal(s.phase,'abstraction');
  s=transition(s,'I do not know how to explain a principle.',{intent:'reasoning',status:'stuck',ambiguous:false,evidence:[]}).state;
  const result=transition(s,'Still stuck on that explanation.',{intent:'reasoning',status:'stuck',ambiguous:false,evidence:[]});
  assert.equal(result.state.phase,'abstraction');assert.equal(result.decision.action,'HINT');
});
