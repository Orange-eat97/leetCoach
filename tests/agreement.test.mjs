import test from 'node:test';import assert from 'node:assert/strict';
import {agreement,compare} from '../testing/agreement.mjs';
test('perfect balanced agreement yields kappa 1',()=>{
 const result=agreement([{human:'PASS',judge:'PASS'},{human:'FAIL',judge:'FAIL'}]);
 assert.equal(result.agreement,1);assert.equal(result.kappa,1);
});
test('chance-level agreement yields kappa zero',()=>{
 const r=agreement([{human:'PASS',judge:'PASS'},{human:'PASS',judge:'FAIL'},{human:'FAIL',judge:'PASS'},{human:'FAIL',judge:'FAIL'}]);
 assert.equal(r.agreement,0.5);assert.equal(r.kappa,0);
});
test('one-class data reports undefined kappa rather than inventing agreement',()=>{
 const r=agreement([{human:'PASS',judge:'PASS'},{human:'PASS',judge:'PASS'}]);
 assert.equal(r.agreement,1);assert.equal(r.kappa,null);
});
test('only true paired manual labels enter comparison',()=>{
 const r=compare({'c1':{reasoning_alignment:{verdict:'PASS'}}},[
  {conversation_id:'c1',criterion_id:'reasoning_alignment',verdict:'FAIL'},
  {conversation_id:'c2',criterion_id:'reasoning_alignment',verdict:'PASS'}]);
 assert.equal(r.matched_count,1);assert.equal(r.skipped_count,1);assert.equal(r.disagreements.length,1);
});
