const SOCLAAS_BASE_URL='https://soclaas-api.comp.nus.edu.sg/v1';
const OPENAI_BASE_URL='https://api.openai.com/v1';

export function providerConfig(env=process.env){
  const soclaasKey=env.SOCLAAS_API_KEY?.trim();
  const openaiKey=env.OPENAI_API_KEY?.trim();
  const isSoclaas=Boolean(soclaasKey);
  return {
    apiKey:soclaasKey||openaiKey||'',
    baseUrl:(env.OPENAI_BASE_URL?.trim()||(isSoclaas?SOCLAAS_BASE_URL:OPENAI_BASE_URL)).replace(/\/$/,''),
    model:env.SOCLAAS_MODEL?.trim()||env.OPENAI_MODEL?.trim()||(isSoclaas?'default':'gpt-4o-mini'),
    provider:isSoclaas?'soclaas':'openai-compatible'
  };
}
