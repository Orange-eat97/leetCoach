import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawn} from 'node:child_process'

const repo=process.cwd()
const appUrl=process.argv[2]||'http://127.0.0.1:5173/'
const debugPort=process.argv[3]||'9333'
const edgeCandidates=[
 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const edge=edgeCandidates.find(fs.existsSync)
if(!edge)throw new Error('Microsoft Edge executable was not found')

const dataset=path.join(repo,'llm_judge','a2_selected_20.json')
const labels=path.join(repo,'llm_judge','human_labels.json')
const judge=path.join(repo,'llm_judge','judge_results','a2_v3_c1_results.json')
for(const file of [dataset,labels,judge])if(!fs.existsSync(file))throw new Error(`Required artifact missing: ${file}`)
const judgeData=JSON.parse(fs.readFileSync(judge,'utf8'))
if(judgeData.prompt_version!=='a2_v3'||judgeData.results?.length!==20)throw new Error('The preserved v3 C1 result file failed provenance checks')

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'algocoach-edge-v3-'))
const edgeProcess=spawn(edge,[
 '--headless=new',
 `--remote-debugging-port=${debugPort}`,
 `--user-data-dir=${profile}`,
 '--no-first-run',
 '--disable-extensions',
 '--disable-background-networking',
 '--hide-scrollbars',
 'about:blank',
],{stdio:'ignore',windowsHide:true})

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const waitFor=async(fn,label,timeout=20000)=>{
 const started=Date.now()
 while(Date.now()-started<timeout){
  try{const value=await fn();if(value)return value}catch{}
  await delay(150)
 }
 throw new Error(`Timed out waiting for ${label}`)
}

let socket
let sequence=0
const pending=new Map()
const eventWaiters=new Map()
const connect=url=>new Promise((resolve,reject)=>{
 socket=new WebSocket(url)
 socket.addEventListener('open',resolve,{once:true})
 socket.addEventListener('error',reject,{once:true})
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data)
  if(message.id&&pending.has(message.id)){
   const {resolve:done,reject:fail}=pending.get(message.id);pending.delete(message.id)
   if(message.error)fail(new Error(`${message.error.message}: ${JSON.stringify(message.error.data||{})}`))
   else done(message.result||{})
  }else if(message.method&&eventWaiters.has(message.method)){
   for(const done of eventWaiters.get(message.method))done(message.params||{})
   eventWaiters.delete(message.method)
  }
 })
})
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))
})
const event=(method,timeout=15000)=>new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error(`Timed out waiting for CDP event ${method}`)),timeout)
 const done=value=>{clearTimeout(timer);resolve(value)}
 const list=eventWaiters.get(method)||[];list.push(done);eventWaiters.set(method,list)
})
const evaluate=async(expression)=>{
 const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})
 if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Page evaluation failed')
 return result.result?.value
}
const pollPage=async(expression,label)=>waitFor(()=>evaluate(expression),label)

try{
 const version=await waitFor(async()=>{
  const response=await fetch(`http://127.0.0.1:${debugPort}/json/version`)
  return response.ok?response.json():null
 },'Edge DevTools endpoint')
 if(!version.webSocketDebuggerUrl)throw new Error('Edge DevTools did not expose a browser socket')
 const createdResponse=await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'})
 if(!createdResponse.ok)throw new Error(`Could not create Edge target: HTTP ${createdResponse.status}`)
 const target=await createdResponse.json()
 await connect(target.webSocketDebuggerUrl)
 await send('Page.enable')
 await send('Runtime.enable')
 await send('DOM.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1560,height:1020,deviceScaleFactor:1,mobile:false})
 const loaded=event('Page.loadEventFired')
 await send('Page.navigate',{url:appUrl})
 await loaded
 await pollPage(`document.readyState==='complete'||document.readyState==='interactive'`,'page readiness')
 const pageState=await evaluate(`({url:location.href,title:document.title,body:(document.body?.innerText||'').slice(0,300)})`)
 console.log('Loaded page:',JSON.stringify(pageState))
 await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Evaluation/i.test(x.textContent||''));if(b)b.click();return true})()`)
 await pollPage(`Boolean(document.querySelector('.ev-shell'))`,'Evaluation interface')

 const {root}=await send('DOM.getDocument',{depth:-1,pierce:true})
 const {nodeIds}=await send('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'.ev-toolbar input[type="file"]'})
 if(nodeIds.length<3)throw new Error(`Expected three Evaluation file inputs, found ${nodeIds.length}`)
 await send('DOM.setFileInputFiles',{nodeId:nodeIds[0],files:[dataset]})
 await pollPage(`document.querySelectorAll('.ev-case').length===20`,'20 imported conversations')
 await send('DOM.setFileInputFiles',{nodeId:nodeIds[1],files:[labels]})
 await pollPage(`document.querySelector('.ev-counter')?.textContent?.includes('20/20')`,'20 complete human labels')
 await send('DOM.setFileInputFiles',{nodeId:nodeIds[2],files:[judge]})
 await pollPage(`Boolean([...document.querySelectorAll('button')].find(x=>/Reveal judge results/i.test(x.textContent||'')&&!x.disabled))`,'enabled Reveal judge results button')
 await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Reveal judge results/i.test(x.textContent||''));b.click();return true})()`)
 await pollPage(`document.querySelectorAll('.ev-judge').length>0`,'visible judge result')
 await evaluate(`(()=>{const b=[...document.querySelectorAll('.ev-case')].find(x=>(x.textContent||'').includes('final-knapsack-05'));if(!b)return false;b.click();return true})()`)
 await pollPage(`document.querySelector('.ev-meta strong')?.textContent==='final-knapsack-05'`,'selected v3 disagreement case')
 await pollPage(`document.querySelector('.ev-judge')?.textContent?.includes('DISAGREEMENT')`,'visible v3 disagreement')

 const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true})
 const outDir=path.join(repo,'a2_evidence','screenshots')
 fs.mkdirSync(outDir,{recursive:true})
 const pngName='UI_JUDGE_a2_v3.png'
 fs.writeFileSync(path.join(outDir,pngName),Buffer.from(screenshot.data,'base64'))

 const manifestPath=path.join(outDir,'capture_manifest.json')
 const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{captures:[]}
 manifest.captures=(manifest.captures||[]).filter(item=>item.png!==pngName)
 manifest.captures.push({
  png:pngName,
  caption:'Post-hoc capture of the running AlgoCoach Evaluation interface loading the preserved a2_v3 C1 judge results and independent human labels; selected case final-knapsack-05 shows the recorded disagreement. The aggregate result is 95% agreement and Cohen kappa 0.643 in a2_v3_c1_agreement.json.',
  capture_type:'actual_running_algocoach_evaluation_UI_replay_of_saved_results',
  url:appUrl,
  source_judge_results:'llm_judge/judge_results/a2_v3_c1_results.json',
  source_human_labels:'llm_judge/human_labels.json',
  source_agreement:'llm_judge/judge_results/a2_v3_c1_agreement.json',
  captured_at:new Date().toISOString(),
 })
 manifest.created_at=new Date().toISOString()
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8')
 const indexPath=path.join(outDir,'appendix_screenshot_index.md')
 fs.writeFileSync(indexPath,'# Screenshot evidence index\n\n'+manifest.captures.map(item=>`- \`screenshots/${item.png}\` — ${item.caption}`).join('\n')+'\n','utf8')
 console.log(`Saved ${path.join(outDir,pngName)}`)
 console.log(`Updated ${manifestPath}`)
 console.log(`Updated ${indexPath}`)
}finally{
 try{socket?.close()}catch{}
 try{edgeProcess.kill()}catch{}
 await delay(250)
 try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
