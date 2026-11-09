import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const reviewRoot=path.join(root,'submission_review')
const submission=path.join(reviewRoot,'A2_A0300281X_Code_and_Tests')

const buildManifest=()=>{
 const manifest=[]
 const walk=directory=>{
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
   const full=path.join(directory,entry.name)
   if(entry.isDirectory())walk(full)
   else if(entry.name!=='SUBMISSION_MANIFEST.json')manifest.push({path:path.relative(submission,full).replaceAll('\\','/'),bytes:fs.statSync(full).size})
  }
 }
 walk(submission)
 const includedAiLogs=manifest.map(item=>item.path).filter(file=>file.startsWith('ai_logs/')&&!file.endsWith('README_PENDING_REVIEW.md'))
 const value={generated_at:new Date().toISOString(),student_id:'A0300281X',status:includedAiLogs.length?'FINAL_AI_LOGS_INCLUDED':'REVIEW_ONLY_AI_LOGS_NOT_INCLUDED',ai_log_files:includedAiLogs,content_file_count:manifest.length,total_content_bytes:manifest.reduce((sum,item)=>sum+item.bytes,0),files:manifest}
 fs.writeFileSync(path.join(submission,'SUBMISSION_MANIFEST.json'),JSON.stringify(value,null,2)+'\n','utf8')
 return value
}

if(process.argv.includes('--refresh-manifest')){
 if(!fs.existsSync(submission))throw new Error(`Review package does not exist: ${submission}`)
 const manifest=buildManifest()
 console.log(`Refreshed manifest: ${manifest.content_file_count} content files, ${manifest.total_content_bytes} bytes`)
 process.exit(0)
}

if(fs.existsSync(reviewRoot))throw new Error(`Refusing to overwrite existing review folder: ${reviewRoot}`)
fs.mkdirSync(submission,{recursive:true})

const copy=(sourceRelative,destinationRelative=sourceRelative,options={})=>{
 const source=path.join(root,sourceRelative)
 if(!fs.existsSync(source))throw new Error(`Required source is missing: ${sourceRelative}`)
 const destination=path.join(submission,destinationRelative)
 fs.mkdirSync(path.dirname(destination),{recursive:true})
 const baseFilter=candidate=>{
  const name=path.basename(candidate)
  return name!=='__pycache__'&&!name.endsWith('.pyc')&&!name.endsWith('.tsbuildinfo')&&name!=='.DS_Store'&&name!=='Thumbs.db'
 }
 const requestedFilter=options.filter
 const filter=requestedFilter?candidate=>baseFilter(candidate)&&requestedFilter(candidate):baseFilter
 fs.cpSync(source,destination,{recursive:true,...options,filter})
}
const writeJSON=(relative,value)=>{
 const destination=path.join(submission,relative)
 fs.mkdirSync(path.dirname(destination),{recursive:true})
 fs.writeFileSync(destination,JSON.stringify(value,null,2)+'\n','utf8')
}
const readJSON=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'))

for(const file of ['.gitignore','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts'])copy(file)
for(const directory of ['src','server','baseline','tests','testing','scripts','a2_codex_eval','docs'])copy(directory)

copy('llm_judge')
copy('testing/personas_knapsack.json','llm_judge/personas/personas_knapsack.json')
copy('testing/generate_conversations.mjs','llm_judge/generation/generate_conversations.mjs')
copy('testing/util.mjs','llm_judge/generation/util.mjs')

copy('red_team/attacks','red_team/attacks')
copy('red_team/fixes','red_team/fixes')
copy('red_team/transcripts/before','red_team/transcripts/before')

const rounds=[
 ['v2_factual_guard','post_fix_v2_screened_run_20261108'],
 ['v3_targeted_guard_manual','post_fix_v3_manual_run_targeted_guard_20261108'],
 ['v4_generalized_pre_role_guard','post_fix_v4_manual_pre_role_guard_20261108'],
 ['v5_role_question_guard','post_fix_v5_manual_role_guard_pre_clarify_question_20261108'],
 ['v6_latest_source_manual','post_fix_v6_latest_source_manual_20261109'],
]
for(const [shortName,archiveName] of rounds){
 copy(`red_team/archive/${archiveName}/after`,`red_team/transcripts/after/${shortName}`)
 const resultSource=`red_team/archive/${archiveName}/redteam_results.json`
 if(fs.existsSync(path.join(root,resultSource)))copy(resultSource,`red_team/results/${shortName}_results.json`)
}

const filterLabels=(sourceRelative,prefix)=>{
 const source=readJSON(sourceRelative)
 const labels=Object.fromEntries(Object.entries(source.labels||{}).filter(([id])=>id.startsWith(prefix)))
 return {schema:source.schema||'algocoach.human-labels.v1',criteria:source.criteria||[],source_file:sourceRelative,labels,reviewed_at:source.reviewed_at||null}
}
writeJSON('red_team/labels/before.json',filterLabels('red_team/human_labels.json','before-'))
for(const [shortName,archiveName] of rounds){
 const labelSource=`red_team/archive/${archiveName}/human_labels.json`
 if(fs.existsSync(path.join(root,labelSource)))writeJSON(`red_team/labels/after/${shortName}.json`,filterLabels(labelSource,'after-'))
 else writeJSON(`red_team/labels/after/${shortName}.json`,{schema:'algocoach.human-labels.v1',source_file:labelSource,status:'MISSING_ARCHIVED_HUMAN_LABEL_EXPORT',labels:{}})
}

copy('a2_evidence/reports','evidence/reports')
copy('a2_evidence/screenshots','evidence/screenshots',{filter:source=>!source.includes(`${path.sep}rendered_html`)})

const manifest=buildManifest()

fs.mkdirSync(path.join(reviewRoot,'AI_LOG_REVIEW'),{recursive:true})
console.log(`Prepared review staging folder: ${submission}`)
console.log(`Files before authored review notes: ${manifest.content_file_count}`)
