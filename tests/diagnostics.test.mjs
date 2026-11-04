import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession} from '../server/engine.mjs';
import {interpret} from '../server/models.mjs';

async function withFakeModel(response,run){
  const previousFetch=globalThis.fetch;
  const previousKey=process.env.SOCLAAS_API_KEY;
  const previousModel=process.env.SOCLAAS_MODEL;
  globalThis.fetch=async()=>response;
  process.env.SOCLAAS_API_KEY='test-key';
  process.env.SOCLAAS_MODEL='test-model';
  try{return await run();}finally{
    globalThis.fetch=previousFetch;
    if(previousKey===undefined)delete process.env.SOCLAAS_API_KEY;else process.env.SOCLAAS_API_KEY=previousKey;
    if(previousModel===undefined)delete process.env.SOCLAAS_MODEL;else process.env.SOCLAAS_MODEL=previousModel;
  }
}

test('successful interpretation records safe request diagnostics',async()=>{
  const body={choices:[{message:{content:JSON.stringify({intent:'reasoning',status:'progressing',ambiguous:false,evidence:[],contradictions:[]})}}],usage:{prompt_tokens:12,completion_tokens:8}};
  await withFakeModel(new Response(JSON.stringify(body),{status:200,headers:{'x-request-id':'req-test'}}),async()=>{
    const events=[];
    await interpret(newSession('diagnostic-test'),'I would compare the strings.',event=>events.push(event));
    assert.equal(events.length,1);
    assert.equal(events[0].stage,'interpret');
    assert.equal(events[0].outcome,'success');
    assert.equal(events[0].model,'test-model');
    assert.equal(events[0].requestId,'req-test');
    assert.equal('apiKey' in events[0],false);
  });
});

test('HTTP failures record status and stage before throwing',async()=>{
  await withFakeModel(new Response('{"error":"busy"}',{status:503}),async()=>{
    const events=[];
    await assert.rejects(()=>interpret(newSession('diagnostic-error'),'I would compare the strings.',event=>events.push(event)),/503/);
    assert.equal(events.length,1);
    assert.equal(events[0].stage,'interpret');
    assert.equal(events[0].outcome,'http_error');
    assert.equal(events[0].httpStatus,503);
  });
});
