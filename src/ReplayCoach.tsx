import {type ChangeEvent,useMemo,useState} from 'react'
import {type CoachSession} from './coachClient'
import {Visual} from './LiveCoach'
import './liveCoach.css'

type RecordedConversation={
 id:string
 source_version?:string
 mode?:string
 generated_at?:string
 generator?:string
 persona?:{name?:string;behavior?:string}
 session:CoachSession
}

const labels:Record<string,string>={approach:'Establish approach',gap:'Explore reasoning gap',solution:'Justify algorithm',abstraction:'Abstract principle',transfer:'Apply transfer',complete:'Complete'}
const phases=Object.keys(labels)

function parseConversation(value:unknown):RecordedConversation|null{
 if(!value||typeof value!=='object')return null
 const item=value as Record<string,unknown>
 const raw=(item.session&&typeof item.session==='object'?item.session:item) as Partial<CoachSession>
 if(!Array.isArray(raw.transcript)||!raw.transcript.every(turn=>turn&&typeof turn.text==='string'&&(turn.role==='coach'||turn.role==='learner')))return null
 const session={
  id:String(raw.id||item.id||'recorded-session'),
  problem:String(raw.problem||item.problem||'zero-one-knapsack'),
  phase:(raw.phase||'approach') as CoachSession['phase'],
  evidence:Array.isArray(raw.evidence)?raw.evidence:[],
  transcript:raw.transcript,
  events:Array.isArray(raw.events)?raw.events:[],
  turn:Number(raw.turn||raw.transcript.filter(turn=>turn.role==='learner').length),
  complete:Boolean(raw.complete),
 } satisfies CoachSession
 return {
  id:String(item.id||session.id),
  source_version:typeof item.source_version==='string'?item.source_version:undefined,
  mode:typeof item.mode==='string'?item.mode:undefined,
  generated_at:typeof item.generated_at==='string'?item.generated_at:undefined,
  generator:typeof item.generator==='string'?item.generator:undefined,
  persona:item.persona&&typeof item.persona==='object'?item.persona as RecordedConversation['persona']:undefined,
  session,
 }
}

export default function ReplayCoach(){
 const [record,setRecord]=useState<RecordedConversation|null>(null)
 const [error,setError]=useState('')
 const [diagnosticsOpen,setDiagnosticsOpen]=useState(false)
 const modelEvents=useMemo(()=>(record?.session.events||[]).filter(event=>event.kind==='model_request'||event.kind==='turn_failed'),[record])
 const load=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0]
  if(!file)return
  setError('')
  try{
   const parsed=parseConversation(JSON.parse(await file.text()))
   if(!parsed)throw new Error('The selected JSON does not contain a recorded AlgoCoach transcript.')
   setRecord(parsed)
  }catch(reason){setRecord(null);setError(reason instanceof Error?reason.message:String(reason))}
 }
 const session=record?.session
 return <div className="lc-shell lc-replay">
  <header className="lc-header"><div><b>AlgoCoach</b><small>Assignment 2 · Recorded-session replay</small></div><div className="lc-replay-import"><label htmlFor="lc-replay-file">Import recorded session</label><input id="lc-replay-file" type="file" accept=".json,application/json" onChange={event=>void load(event)}/></div></header>
  {!record||!session?<main className="lc-replay-empty"><h1>Replay a recorded coaching session</h1><p>The replay uses the same conversation, milestone, evidence, and diagnostics layout as the Live Tutor while preserving the record’s provenance.</p>{error&&<p role="alert">{error}</p>}</main>:<div className="lc-columns">
   <aside className="lc-sidebar"><h2>0/1 Knapsack</h2><p>Choose each item <b>at most once</b> to maximise total value with capacity 50.</p><code>A (10,60) · B (20,100) · C (30,120)</code><p className="lc-subtle">Numbers are (weight, value). Transfer: Partition Equal Subset Sum.</p><h3>Learning milestones</h3>{phases.map((phase,index)=><div className={`lc-milestone ${session?.phase===phase?'current':''}`} key={phase}><span>{session&&phases.indexOf(session.phase)>index?'✓':index+1}</span>{labels[phase]}</div>)}<h3>Grounded evidence</h3><p className="lc-subtle">Recorded learner-authored evidence from this execution. This is not a mastery score.</p><div className="lc-evidence">{session?.evidence.map((e,index)=><details key={index}><summary>{e.kind.replaceAll('_',' ')}</summary><blockquote>{e.quote}</blockquote><small>{e.rationale}</small></details>)}</div><h3>Session provenance</h3><dl className="lc-provenance"><dt>Case</dt><dd>{record.id}</dd><dt>Session</dt><dd>{session.id}</dd><dt>Source</dt><dd>{record.source_version||'not recorded'}</dd><dt>Mode</dt><dd>{record.mode||'not recorded'}</dd><dt>Learner</dt><dd>{record.generator||'not recorded'}</dd><dt>Recorded</dt><dd>{record.generated_at||'not recorded'}</dd></dl></aside>
   <main className="lc-chat"><div className="lc-chathead"><div><strong>Recorded coaching session</strong><small>Recorded replay · {session.transcript.length} messages</small></div><div className="lc-chattools"><button onClick={()=>setDiagnosticsOpen(open=>!open)} aria-expanded={diagnosticsOpen}>Diagnostics ({modelEvents.length})</button></div></div>{diagnosticsOpen&&<section className="lc-diagnostics" aria-label="Recorded model request diagnostics"><div><strong>Recorded model request diagnostics</strong><small>Safe metadata from the saved execution—no API key, hidden prompt, or model response.</small></div>{modelEvents.length===0?<p>No model requests were recorded.</p>:<ol>{[...modelEvents].reverse().map((event,index)=><li key={index} className={`is-${String(event.outcome||'info')}`}><div><b>{String(event.stage||event.kind)}</b><span>{String(event.outcome||'recorded')}</span><time>{typeof event.durationMs==='number'?`${event.durationMs} ms`:String(event.at||'')}</time></div><small>{[event.provider,event.model,event.httpStatus&&`HTTP ${event.httpStatus}`,event.requestId&&`request ${event.requestId}`].filter(Boolean).map(String).join(' · ')}</small>{Boolean(event.error)&&<code>{String(event.error)}</code>}</li>)}</ol>}</section>}<div className="lc-scroll">{session.transcript.map((message,index)=><article key={index} className={`lc-message ${message.role}`}><small>{message.role==='coach'?`Coach${message.action?` · ${message.action}`:''}`:'Learner'}</small><p>{message.text}</p>{message.visual&&<Visual type={message.visual}/>}</article>)}{session.complete&&<p className="lc-done">Interaction complete. Transfer evidence was recorded; long-term understanding is not assumed.</p>}</div><div className="lc-composer lc-replay-composer"><textarea aria-label="Recorded conversation input" value="" placeholder="Recorded conversation — input disabled." disabled/><button disabled>Send</button></div></main>
  </div>}
 </div>
}
