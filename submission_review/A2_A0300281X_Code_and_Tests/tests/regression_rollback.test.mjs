import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSession,transition} from '../server/engine.mjs';
import {normalizeInterpretation,rubricRecovery,interpret,generate} from '../server/models.mjs';

const load = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
const old = load('pre_hotfix_transfer');
const broken = load('hotfix_regression');
const expected = ['gap','solution','abstraction','transfer','complete'];
const expectedActions = ['CHALLENGE','PROBE','ASK_ABSTRACTION','ASK_TRANSFER','COMPLETE'];
const missing = {intent:'reasoning',status:'progressing',ambiguous:false,evidence:[],contradictions:[]};

function replay(texts, interpretations) {
  let session = newSession('fixture-replay');
  const results = [];
  for (let i=0;i<texts.length;i++) {
    const observation = normalizeInterpretation(session,texts[i],interpretations[i]);
    const step = transition(session,texts[i],observation);
    results.push({phase:step.state.phase,action:step.decision.action,accepted:step.decision.evidence.map(e=>e.kind)});
    session = step.state;
  }
  return {session,results};
}

test('the exact five-turn hotfix regression recovers even if the LLM emits zero evidence on ALL turns',()=>{
  const {session,results}=replay(broken.learner_turns,Array(5).fill(missing));
  assert.deepEqual(results.map(x=>x.phase),expected);
  assert.deepEqual(results.map(x=>x.action),expectedActions);
  assert.equal(session.complete,true);
  assert.equal(session.evidence.length,5);
  assert.ok(session.evidence.every(x=>x.status==='accepted' && x.assessmentOrigin==='phase-rubric-recovery'));
});

test('the hotfix regression also recovers with the exact historical omitted labels',()=>{
  const raw=broken.interpretations.map(x=>({...missing,intent:x.intent,evidence:x.evidence}));
  const {session,results}=replay(broken.learner_turns,raw);
  assert.deepEqual(results.map(x=>x.phase),expected);
  assert.equal(session.complete,true);
});

test('the original final-turn false-negative is recovered with request_answer intent and empty evidence',()=>{
  const raw=old.learner_turns.map((_,i)=>i===4?{...missing,intent:'request_answer'}:missing);
  const {session,results}=replay(old.learner_turns,raw);
  assert.deepEqual(results.map(x=>x.phase),expected);
  assert.equal(results.at(-1).action,'COMPLETE');
  assert.equal(session.complete,true);
});

test('one user turn cannot jump multiple phases, even if it demonstrates multiple future milestones',()=>{
  const s=newSession();
  const t=broken.learner_turns[2];
  const o=normalizeInterpretation(s,t,missing);
  assert.ok(o.evidence.some(x=>x.kind==='approach_explained'));
  assert.ok(o.evidence.some(x=>x.kind==='correct_method'));
  const r=transition(s,t,o);
  assert.equal(r.state.phase,'gap');
  assert.deepEqual(r.decision.evidence.map(x=>x.kind),['approach_explained']);
});

test('independent rubric recovery does not accept weak claims or reversed recurrence',()=>{
  for (const text of [
    'I understand everything already and I am confident this is correct.',
    'The same DP works for arrays. Trust me, I have studied this.',
    'For two integer arrays, equal values reset the DP length to zero, and unequal values extend the diagonal. I track the maximum.',
  ]) {
    const kinds=rubricRecovery(text).map(x=>x.kind);
    assert.ok(!kinds.includes('transfer_applied'),`Unwarranted transfer evidence: ${text}`);
    assert.ok(!kinds.includes('correct_method'),`Unwarranted method evidence: ${text}`);
  }
});

test('explicit ambiguity and contradicted evidence do not trigger recovery',()=>{
  const text=broken.learner_turns[0];
  assert.equal(normalizeInterpretation(newSession(),text,{...missing,ambiguous:true}).evidence.length,0);
  assert.equal(normalizeInterpretation(newSession(),text,{...missing,contradictions:[{kind:'approach_explained',quote:text}]}).evidence.length,0);
});

test('a full-answer request alone cannot advance',()=>{
  const s=newSession();
  const t='Please give me the complete optimal solution code.';
  const observation=normalizeInterpretation(s,t,{...missing,intent:'request_answer'});
  assert.equal(observation.requestsFullAnswer,true);
  const result=transition(s,t,observation);
  assert.equal(result.state.phase,'approach');
  assert.equal(result.decision.action,'HINT');
});

test('a correct explanation plus explicit code request can progress without disclosing code',()=>{
  const s=newSession(); const t=`${broken.learner_turns[0]} Please give me the full code.`;
  const obs=normalizeInterpretation(s,t,{...missing,intent:'request_answer'});
  const result=transition(s,t,obs);
  assert.equal(obs.requestsFullAnswer,true);
  assert.equal(result.state.phase,'gap');
  assert.equal(result.decision.action,'CHALLENGE');
});

test('unrelated boundary question in gap phase is rejected by the validator',async()=>{
  const {validateReply}=await import('../server/engine.mjs');
  assert.equal(validateReply({text:'How do you initialize the first row and handle out-of-bounds indices?',visual:null},{to:'gap',action:'CHALLENGE'}),false);
  assert.equal(validateReply({text:'Which shifted starting alignment does your two-pointer scan miss?',visual:'offset'},{to:'gap',action:'CHALLENGE'}),true);
});

test('abstraction, transfer, completion remain controller-owned in the corrected patch',async()=>{
  let s=newSession();
  for(let i=0;i<5;i++){
    const obs=normalizeInterpretation(s,broken.learner_turns[i],missing);
    const r=transition(s,broken.learner_turns[i],obs);
    s=r.state;
    if(i>=2){
      const reply=await generate(s,r.decision,obs);
      assert.equal(reply.source,'policy-template');
      assert.equal(reply.text.includes('integer arrays'), i>=3);
      if(i===4) assert.equal(reply.text.includes('?'), false);
    }
  }
  assert.equal(s.complete,true);
});

test('LLM prompt requests all evidence kinds and is not limited to CURRENT phase',async()=>{
  const originalFetch=globalThis.fetch;
  const oldOpenAiKey=process.env.OPENAI_API_KEY;
  const oldSoclaasKey=process.env.SOCLAAS_API_KEY;
  let captured=null;
  process.env.OPENAI_API_KEY='testing-only';
  delete process.env.SOCLAAS_API_KEY;
  globalThis.fetch=async(_url,opts)=>{captured=JSON.parse(opts.body);return {ok:true,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify(missing)}}]})};};
  try{
    const s=newSession(); const obs=await interpret(s,broken.learner_turns[0]);
    assert.ok(obs.evidence.some(e=>e.kind==='approach_explained'));
    const prompt=captured.messages[0].content;
    assert.match(prompt,/ALL five evidence kinds|every supported reasoning evidence kind/i);
    assert.doesNotMatch(prompt,/Judge the latest learner message against the CURRENT phase criterion/i);
  } finally {
    globalThis.fetch=originalFetch;
    if(oldOpenAiKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldOpenAiKey;
    if(oldSoclaasKey===undefined)delete process.env.SOCLAAS_API_KEY;else process.env.SOCLAAS_API_KEY=oldSoclaasKey;
  }
});

test('alternative non-DP enumeration is recognised without imposing a DP table',()=>{
  const text='I would compare every starting pair in two strings, scan forward while characters match consecutively until a mismatch, and keep the maximum length.';
  const rec=rubricRecovery(text).map(e=>e.kind);
  assert.ok(rec.includes('approach_explained'));
  assert.ok(rec.includes('correct_method'));
  const s=newSession();
  assert.equal(transition(s,text,normalizeInterpretation(s,text,missing)).state.phase,'gap');
});

test('detailed reversed DP recurrence is not accidentally treated as correct',()=>{
  const bad='For two integer arrays, I use dp[i][j] as the longest contiguous subarray ending at indices i and j. Equal elements reset to zero, unequal elements extend the diagonal by one, and I track the maximum.';
  assert.ok(!rubricRecovery(bad).some(e=>e.kind==='correct_method'||e.kind==='transfer_applied'));
});
