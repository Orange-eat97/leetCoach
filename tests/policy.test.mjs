import test from 'node:test';import assert from 'node:assert/strict';
import {newSession,transition} from '../server/engine.mjs';
const ev=(kind,text)=>({kind,supported:true,quote:text,rationale:'Concrete statement relevant to the named milestone'});
const run=(s,text,evidence=[],extra={})=>transition(s,text,{intent:'reasoning',status:'progressing',ambiguous:false,evidence,...extra});
test('ambiguous evidence is not persisted and cannot advance next turn',()=>{
 let s=newSession();let t='I compare each pair with two pointers that advance after each comparison.';
 s=run(s,t,[ev('approach_explained',t)],{ambiguous:true}).state;
 assert.equal(s.phase,'approach');assert.equal(s.evidence.length,0);
 s=run(s,'Okay, I understand.').state;assert.equal(s.phase,'approach');assert.equal(s.evidence.length,0);
});
test('prior accepted evidence is never reused to cross a later checkpoint',()=>{
 let s=newSession();let t='I compare all characters by moving both pointers together and resetting after mismatches.';
 s=run(s,t,[ev('approach_explained',t)]).state;assert.equal(s.phase,'gap');
 const noEvidence=run(s,'Yes, that is correct, I understand everything now.').state;
 assert.equal(noEvidence.phase,'gap');
});
test('stagnation escalates hints and offers a learner choice without advancing',()=>{
 let s=newSession();let t='I compare characters with two pointers and move both after mismatch.';
 s=run(s,t,[ev('approach_explained',t)]).state;
 const actions=[];for(let k=0;k<5;k++){const res=run(s,'I am unsure how to check this particular offset.',[],{status:'stuck'});s=res.state;actions.push(res.decision.action)}
 assert.equal(s.phase,'gap');assert.ok(actions.includes('VISUALISE'));assert.equal(actions.at(-1),'OFFER_CHOICE');
});
test('explicit contradiction disputes earlier evidence and opens focused repair',()=>{
 let s=newSession();let t='My method moves both pointers after each check to find matching characters.';
 s=run(s,t,[ev('approach_explained',t)]).state;
 t='The lockstep method skips matches beginning at shifted offsets, so it can miss the optimal substring.';
 s=run(s,t,[ev('limitation_explained',t)]).state;assert.equal(s.phase,'solution');
 t='Actually my lockstep method checks every starting pair and cannot miss anything.';
 const res=run(s,t,[],{contradictions:[ev('limitation_explained',t)]});
 assert.equal(res.state.phase,'solution');assert.equal(res.decision.action,'REPAIR');
 assert.equal(res.state.learnerState.repairFocus,'limitation_explained');
 assert.equal(res.state.evidence.find(e=>e.kind==='limitation_explained').status,'disputed');
 t='The lockstep scan checks just one diagonal of alignments so it can miss matches at shifted starts.';
 const repair=run(res.state,t,[ev('limitation_explained',t)]);
 assert.equal(repair.state.phase,'solution');assert.equal(repair.state.learnerState.repairFocus,null);
});
test('cannot skip to solution with phase-inapplicable evidence',()=>{
 const s=newSession();const t='I used a DP table and know the full algorithm is correct and can transfer to arrays.';
 const r=run(s,t,[ev('correct_method',t),ev('transfer_applied',t)]);
 assert.equal(r.state.phase,'approach');assert.equal(r.state.evidence.length,0);
});
test('no scalar mastery score is stored',()=>{const s=newSession();assert.equal('confidence' in s,false);assert.equal('mastery' in s.learnerState,false)});
test('answer-request intent never advances even with evidence attached',()=>{
 const s=newSession();const t='Please give full code. I would compare both strings with two pointers and advance both.';
 const r=run(s,t,[ev('approach_explained',t)],{intent:'request_answer'});
 assert.equal(r.state.phase,'approach');assert.equal(r.state.evidence.length,0);
});
test('after offering a choice, a visual request receives an actual visual action',()=>{
 let s=newSession();const t='I compare two strings with pointers and advance both after each comparison.';
 s=run(s,t,[ev('approach_explained',t)]).state;
 for(let i=0;i<5;i++)s=run(s,'I am stuck on this alignment.',[],{status:'stuck'}).state;
 assert.equal(s.lastAction,'OFFER_CHOICE');
 const r=run(s,'Please show me a visual diagram.',[],{status:'stuck'});
 assert.equal(r.decision.action,'VISUALISE');assert.equal(r.state.phase,'gap');
});
