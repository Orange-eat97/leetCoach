import test from 'node:test';
import assert from 'node:assert/strict';
import {providerConfig} from '../server/provider.mjs';

test('SoCLaaS key selects its gateway and model',()=>{
  const config=providerConfig({SOCLAAS_API_KEY:'soc-key',SOCLAAS_MODEL:'chat-model'});
  assert.equal(config.apiKey,'soc-key');
  assert.equal(config.baseUrl,'https://soclaas-api.comp.nus.edu.sg/v1');
  assert.equal(config.model,'chat-model');
  assert.equal(config.provider,'soclaas');
});

test('explicit OpenAI-compatible settings remain supported',()=>{
  const config=providerConfig({OPENAI_API_KEY:'key',OPENAI_BASE_URL:'https://example.test/v1/',OPENAI_MODEL:'custom-model'});
  assert.equal(config.apiKey,'key');
  assert.equal(config.baseUrl,'https://example.test/v1');
  assert.equal(config.model,'custom-model');
});
