import {useEffect, useMemo, useState, type ChangeEvent} from 'react'
import {Visual} from './LiveCoach'
import './evaluation.css'

type Turn={role:'coach'|'learner';text:string;action?:string;visual?:'offset'|'dp'|null}
type Session={id:string;phase?:string;transcript:Turn[];events?:unknown[];turn?:number}
type Conversation={id:string;source_version:string;mode:string;target_id?:string;target?:{pass_rule?:string;fail_rule?:string;must_never?:string};attack_type?:string;round?:string;persona?:{id?:string;name?:string;goal?:string;behavior?:string};scenario?:string;purpose?:string;session:Session;expected_failure_candidate?:boolean}
type HumanLabel={verdict?:'PASS'|'FAIL';note:string}
type LabelMap=Record<string,Record<string,HumanLabel>>
type JudgeResult={conversation_id:string;criterion_id:string;verdict:'PASS'|'FAIL';reason?:string;rationale?:string}
const criteria=[{id:'reasoning_alignment',name:'C1 — Reasoning-grounded support',description:'Do substantive tutor interventions address the learner’s actual approach, or clarify before assuming it?'},{id:'evidence_gating',name:'C2 — Evidence-gated progression',description:'Are marked conceptual advancements supported by learner-generated explanation or application, rather than confidence alone?'}]
const criteriaFor=(c:Conversation)=>c.purpose==='red_team'? [{id:`redteam_${c.target_id||'unknown'}`,name:`Red team — ${c.target_id||'violation target'}`,description:`PASS: ${c.target?.pass_rule||'No violation'}. FAIL: ${c.target?.fail_rule||'Violation observed'}.`}] :criteria
const LABEL_KEY='algocoach-a2-human-labels-v1'
const VISUAL_DESCRIPTION:Record<string,string>={offset:'ABABC and BABCA have common BABC at shifted starting positions',dp:'Ending-position DP table: matching characters extend diagonally and mismatches reset to zero'}
function normalize(value:unknown):Conversation[]{
  if(Array.isArray(value))return value.flatMap(normalize)
  if(!value||typeof value!=='object')return []
  const obj=value as Record<string,unknown>
  if(Array.isArray(obj.conversations))return obj.conversations.flatMap(normalize)
  if(Array.isArray(obj.cases))return obj.cases.flatMap(normalize)
  const raw=(obj.session&&typeof obj.session==='object'?obj.session:obj) as Partial<Session>
  if(!Array.isArray(raw.transcript)||!raw.transcript.every(t=>t&&typeof t.text==='string'&&(t.role==='coach'||t.role==='learner')))return []
  const id=String(obj.id??raw.id??'').trim()
  if(!id)return []
  return [{id,session:{id:raw.id||id,transcript:raw.transcript,events:raw.events,phase:raw.phase,turn:raw.turn},source_version:String(obj.source_version??'manual-export'),mode:String(obj.mode??'unspecified'),persona:(obj.persona as Conversation['persona'])||undefined,scenario:typeof obj.scenario==='string'?obj.scenario:undefined,purpose:typeof obj.purpose==='string'?obj.purpose:undefined,expected_failure_candidate:obj.expected_failure_candidate===true,target_id:typeof obj.target_id==='string'?obj.target_id:undefined,target:(obj.target as Conversation['target']),attack_type:typeof obj.attack_type==='string'?obj.attack_type:undefined,round:typeof obj.round==='string'?obj.round:undefined}]
}
function download(content:string,name:string,type='application/json'){
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),2000)
}
export default function EvaluationPanel(){
 const [items,setItems]=useState<Conversation[]>([]),[selected,setSelected]=useState(''),[labels,setLabels]=useState<LabelMap>(()=>{try{return JSON.parse(localStorage.getItem(LABEL_KEY)||'{}') as LabelMap}catch{return {}}}),[judge,setJudge]=useState<JudgeResult[]>([]),[judgeVisible,setJudgeVisible]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState<'all'|'unlabeled'|'labeled'>('all')
 useEffect(()=>{localStorage.setItem(LABEL_KEY,JSON.stringify(labels))},[labels])
 const counts=useMemo(()=>items.map(c=>({id:c.id,done:criteriaFor(c).every(k=>labels[c.id]?.[k.id]?.verdict)})),[items,labels])
 const complete=counts.filter(c=>c.done).length
 const filtered=items.filter(c=>filter==='all'||(filter==='labeled')===Boolean(counts.find(x=>x.id===c.id)?.done))
 const current=filtered.find(c=>c.id===selected)||filtered[0]
 const currentIndex=filtered.findIndex(c=>c.id===current?.id)
 const loadConversations=async(e:ChangeEvent<HTMLInputElement>)=>{
  const fileList=Array.from(e.target.files||[]);setError('');const loaded:Conversation[]=[];const warnings:string[]=[]
  for(const file of fileList){try{const parsed=JSON.parse(await file.text());const list=normalize(parsed);if(!list.length)warnings.push(`${file.name}: no usable transcript`);loaded.push(...list)}catch{warnings.push(`${file.name}: invalid JSON`)}}
  setItems(old=>{const all=new Map(old.map(c=>[c.id,c]));for(const c of loaded)all.set(c.id,c);return Array.from(all.values()).sort((a,b)=>a.id.localeCompare(b.id))});
  if(loaded.length)setSelected(loaded[0].id);if(warnings.length)setError(warnings.join('; '));e.target.value=''
 }
 const loadLabels=async(e:ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];if(!file)return;try{const obj=JSON.parse(await file.text());const imported=(obj.labels??obj) as LabelMap;if(!imported||typeof imported!=='object'||Array.isArray(imported))throw new Error('Invalid labels');setLabels(prev=>({...prev,...imported}));setError('')}catch{setError('Could not import labels JSON')}e.target.value=''
 }
 const loadJudge=async(e:ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0];if(!file)return;try{const obj=JSON.parse(await file.text());const imported=Array.isArray(obj)?obj:obj.results;if(!Array.isArray(imported))throw new Error('Invalid results');setJudge(imported);setJudgeVisible(false);setError('')}catch{setError('Could not import judge-results JSON')}e.target.value=''
 }
 const saveLabel=(caseId:string,key:string,value:Partial<HumanLabel>)=>setLabels(prev=>({...prev,[caseId]:{...prev[caseId],[key]:{verdict:prev[caseId]?.[key]?.verdict,note:prev[caseId]?.[key]?.note||'',...value}}}))
 const exportLabels=()=>download(JSON.stringify({schema:'algocoach.human-labels.v1',criteria:[...new Set(items.flatMap(c=>criteriaFor(c).map(k=>k.id)))],labels,reviewed_at:new Date().toISOString()},null,2),'human_labels.json')
 const exportCsv=()=>{const cell=(s:string)=>`"${s.replaceAll('"','""')}"`;const lines=['conversation_id,source_version,criterion_id,manual_label,note'];for(const c of items)for(const criterion of criteriaFor(c)){const l=labels[c.id]?.[criterion.id];lines.push([c.id,c.source_version,criterion.id,l?.verdict||'',l?.note||''].map(cell).join(','))}download(lines.join('\n'),'human_labels.csv','text/csv')}
 const comparisonAllowed=Boolean(items.length&&complete===items.length)
 const judgeFor=(id:string,criterion:string)=>judge.find(r=>r.conversation_id===id&&r.criterion_id===criterion)
 return <div className="ev-shell"><header className="ev-header"><div><h1>Evaluation workbench</h1><p>Manual conversation labeling · local-only drafts · exportable judgments</p></div><span className="ev-counter">{complete}/{items.length} fully labeled</span></header>
 <div className="ev-toolbar"><label className="ev-file">Import conversation JSON<input type="file" accept=".json,application/json" multiple onChange={e=>void loadConversations(e)}/></label><label className="ev-file">Import saved labels<input type="file" accept=".json" onChange={e=>void loadLabels(e)}/></label><button onClick={exportLabels} disabled={!items.length}>Export labels JSON</button><button onClick={exportCsv} disabled={!items.length}>Export CSV</button><label className="ev-file">Load judge results<input type="file" accept=".json" onChange={e=>void loadJudge(e)}/></label></div>
 {error&&<p className="ev-error" role="alert">{error}</p>}
 {!items.length?<section className="ev-empty"><h2>Import your collected transcripts</h2><p>Select individual transcript files, a JSON array, or a collection containing <code>conversations</code>. The original Live Tutor’s “Export transcript + events” file is also supported.</p><p>Your PASS/FAIL judgments are autosaved in this browser. Export <code>human_labels.json</code> for the submitted assignment; browser storage is not the submission record.</p><p>For independent labels, the judge’s predictions are hidden until every imported conversation has been labeled.</p></section>:<div className="ev-columns"><aside className="ev-list"><div className="ev-list-header"><strong>Conversations</strong><select aria-label="Filter conversations" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">All</option><option value="unlabeled">Unlabeled</option><option value="labeled">Labeled</option></select></div>{filtered.map(c=><button className={`ev-case ${current?.id===c.id?'active':''}`} onClick={()=>setSelected(c.id)} key={c.id}><strong>{c.id}</strong><small>{c.persona?.name||c.persona?.id||'Learner'} · {c.source_version}</small><span>{counts.find(x=>x.id===c.id)?.done?'✓ Labeled':'Unlabeled'}</span></button>)}</aside>
 <main className="ev-transcript"><div className="ev-meta"><div><strong>{current?.id}</strong><p>{current?.scenario||current?.persona?.behavior||'Review the entire conversation'}</p></div><span>{current?.source_version} · {current?.mode} · {current?.purpose==='red_team'?`${current.attack_type} (${current.round})`:current?.session.phase||'unknown phase'}</span></div><div className="ev-messages">{current?.session.transcript.map((m,i)=><article key={i} className={`ev-message ${m.role}`}><small>Turn {i+1} · {m.role==='coach'?'Coach':'Learner'}{m.action?` · ${m.action}`:''}</small><p>{m.text}</p>{m.visual&&<><Visual type={m.visual}/><small>Visual semantics: {VISUAL_DESCRIPTION[m.visual]||m.visual}</small></>}</article>)}</div><div className="ev-nav"><button disabled={currentIndex<=0} onClick={()=>setSelected(filtered[currentIndex-1].id)}>Previous</button><span>{Math.max(currentIndex+1,0)} of {filtered.length}</span><button disabled={currentIndex<0||currentIndex>=filtered.length-1} onClick={()=>setSelected(filtered[currentIndex+1].id)}>Next</button></div></main>
 <aside className="ev-labels"><h2>Independent manual labels</h2><p>Judge the visible learner–coach interaction, not the controller’s internal evidence tags.</p>{(current?criteriaFor(current):criteria).map(k=>{const record=current&&labels[current.id]?.[k.id];const prediction=current&&judgeFor(current.id,k.id);return <section className="ev-criterion" key={k.id}><strong>{k.name}</strong><p>{k.description}</p><div className="ev-choices"><button className={record?.verdict==='PASS'?'pass':''} onClick={()=>current&&saveLabel(current.id,k.id,{verdict:'PASS'})}>PASS</button><button className={record?.verdict==='FAIL'?'fail':''} onClick={()=>current&&saveLabel(current.id,k.id,{verdict:'FAIL'})}>FAIL</button></div><label>Optional reason / turn reference<textarea aria-label={`${k.id} manual reasoning`} value={record?.note||''} onChange={e=>current&&saveLabel(current.id,k.id,{note:e.target.value})} placeholder="e.g. Turn 7 advances without an explanation"/></label>{comparisonAllowed&&judgeVisible&&prediction&&<div className="ev-judge">LLM judge: <strong>{prediction.verdict}</strong> · {prediction.reason||prediction.rationale||'No rationale'}{record?.verdict!==prediction.verdict&&<b> · DISAGREEMENT</b>}</div>}</section>})}<div className="ev-privacy"><strong>Judge independence</strong><p>{comparisonAllowed?'All manual labels complete. You may reveal loaded judge verdicts.':'Complete all manual labels before reviewing judge verdicts.'}</p><button disabled={!comparisonAllowed||!judge.length} onClick={()=>setJudgeVisible(v=>!v)}>{judgeVisible?'Hide':'Reveal'} judge results</button></div></aside></div>}</div>
}
