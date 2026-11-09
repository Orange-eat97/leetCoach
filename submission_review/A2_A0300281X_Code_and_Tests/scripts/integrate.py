"""Idempotently integrate A2 Live Tutor + Evaluation into the original A1 Vite application.
Run from any directory with: python scripts/integrate.py
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
app=root/'src/App.tsx'
s=app.read_text(encoding='utf-8')
for import_line in ["import LiveCoach from './LiveCoach'\n", "import EvaluationPanel from './EvaluationPanel'\n"]:
    if import_line not in s: s=import_line+s
if 'function ScriptedPrototype() {' not in s:
    if 'export default function App() {' not in s: raise RuntimeError('Unexpected App.tsx: cannot find original React App component')
    s=s.replace('export default function App() {','function ScriptedPrototype() {',1)
# The exported App belongs to the A2 navigation overlay; replace it in-place for upgrades.
if 'export default function App() {' in s:
    s=s[:s.rfind('export default function App() {')].rstrip()+'\n\n'
s+='''export default function App() {
  const [mode, setMode] = useState<'live'|'demo'|'evaluation'>('live')
  return <>
    <nav aria-label="AlgoCoach application mode" style={{position:'fixed',top:8,right:10,zIndex:99999,display:'flex',gap:6,background:'#fff',padding:6,border:'1px solid #cbd5e1',borderRadius:8,boxShadow:'0 2px 10px #0001'}}>
      <button aria-pressed={mode==='live'} onClick={()=>setMode('live')} style={{background:mode==='live'?'#dbeafe':'#fff',border:'1px solid #cbd5e1',borderRadius:5,padding:'5px 9px'}}>Live Tutor</button>
      <button aria-pressed={mode==='evaluation'} onClick={()=>setMode('evaluation')} style={{background:mode==='evaluation'?'#dbeafe':'#fff',border:'1px solid #cbd5e1',borderRadius:5,padding:'5px 9px'}}>Evaluation</button>
      <button aria-pressed={mode==='demo'} onClick={()=>setMode('demo')} style={{background:mode==='demo'?'#dbeafe':'#fff',border:'1px solid #cbd5e1',borderRadius:5,padding:'5px 9px'}}>A1 Demo</button>
    </nav>
    {mode==='live'?<LiveCoach/>:mode==='evaluation'?<EvaluationPanel/>:<ScriptedPrototype/>}
  </>
}
'''
app.write_text(s,encoding='utf-8')
pkg=root/'package.json';j=json.loads(pkg.read_text(encoding='utf-8'))
j['scripts'].update({
 'server':'node server/index.mjs',
 'test:a2':'node --test tests/*.test.mjs',
 'collect:a2':'node testing/generate_conversations.mjs',
 'judge:a2':'node testing/run_judge.mjs',
 'agreement:a2':'node testing/agreement.mjs',
 'redteam:a2':'node testing/run_redteam.mjs',
 'audit:a2':'node testing/audit_dataset.mjs',
 'summary:a2':'node testing/summary.mjs'
})
pkg.write_text(json.dumps(j,indent=2)+'\n',encoding='utf-8')
vite=root/'vite.config.ts';src=vite.read_text(encoding='utf-8')
if '"/api": "http://127.0.0.1:3001"' not in src and "'/api': 'http://127.0.0.1:3001'" not in src:
    src=src.replace('defineConfig({','defineConfig({\n  server: { proxy: { "/api": "http://127.0.0.1:3001" } },',1)
vite.write_text(src,encoding='utf-8')
print('Integrated live tutoring, evaluation review, and A1 reference modes. Existing frontend retained.')
