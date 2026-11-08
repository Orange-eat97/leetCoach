#!/usr/bin/env python3
"""Browser-based screenshot evidence from actual saved sessions/judge results.

HTML captures render real JSON; optional UI captures use the running AlgoCoach
Evaluation tab and must not be described as live tests executed by this script.
No simulated dialogue, judge verdict, or agreement metric is invented.
"""
from __future__ import annotations
import argparse, html, json, re, sys, shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    sync_playwright=None

HERE=Path(__file__).resolve().parent

def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def esc(s):return html.escape(str(s),quote=True)
def safe(s):return re.sub(r'[^a-zA-Z0-9_-]','_',str(s))[:105]
def css():return '''
:root{font-family:Inter,Arial,sans-serif;color:#132235;background:#f4f7fb}
*{box-sizing:border-box}body{margin:0;padding:30px 38px;max-width:1440px;min-width:900px;margin:auto}
h1{font-size:28px;letter-spacing:-.5px;margin:0 0 8px}h2{font-size:17px;margin:25px 0 14px}
p,li{font-size:14px;line-height:1.5}small,.minor{font-size:12px;color:#536179}.bar{display:flex;justify-content:space-between;align-items:flex-start;gap:25px;flex-wrap:wrap}
.tag{border:1px solid #bbc7d3;border-radius:18px;padding:6px 10px;font-size:12px;display:inline-block;margin:5px 5px 0 0;background:white}
.card{border:1px solid #dce5ef;border-radius:12px;padding:18px 22px;background:white;box-shadow:0 3px 14px rgba(10,39,71,.035);margin:15px 0}
.turn{border-left:4px solid #607ea0;margin:12px 0;padding:12px 15px;background:#f8fafc;border-radius:5px}
.turn.learner{border-left-color:#c18d52}.turn p{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 0}
.pass{color:#08755e;font-weight:bold}.fail{color:#bb3a3a;font-weight:bold}.review{color:#ae6700;font-weight:bold}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:11px 13px;border-bottom:1px solid #e6ebf1;text-align:left;vertical-align:top}th{background:#eef3f9}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}.note{border-left:3px solid #5c85b9;padding:10px 15px;background:#eef4fa;margin:16px 0}
code{font-family:Consolas,monospace}.foot{margin-top:20px;border-top:1px solid #dce3ec;padding-top:12px;font-size:11px;color:#536179}
@media print{body{padding:15px;background:white}.card{break-inside:avoid}.turn{break-inside:avoid}}
'''
def shell(title,main,meta=''):
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>'+css()+'</style></head><body><div class="bar"><div><h1>'+esc(title)+'</h1><div class="minor">AlgoCoach CS3249 Assignment 2 — evidence from recorded execution</div></div><div>'+meta+'</div></div>'+main+'<footer class="foot">Screenshot generated from saved artifacts. Tutor turns are from a running CUI; judge results are independently generated model judgments and are not human labels. No claim is made that this HTML view itself is the original live-chat screen.</footer></body></html>'
def transcript_html(session):
    parts=[]
    for i,t in enumerate(session.get('transcript',[]),start=1):
        role=t.get('role','unknown');action=t.get('action','');vis=t.get('visual')
        parts.append(f'<div class="turn {"learner" if role=="learner" else "coach"}"><small>Message {i} — {esc(role.upper())} {"· "+esc(action) if action else ""}</small><p>{esc(t.get("text",""))}</p>{f"<small>Displayed visual: {esc(vis)}</small>" if vis else ""}</div>')
    return '<section class="card"><h2>Visible tutor–learner transcript</h2>'+''.join(parts)+'</section>'
def label_span(x):
    v=str(x or 'NOT RECORDED').upper();c='pass' if v=='PASS' else 'fail' if v=='FAIL' else 'review'
    return f'<span class="{c}">{esc(v)}</span>'
def judge_html(c,judge,labels,version):
    rows=[]
    for crit in ('reasoning_alignment','evidence_gating'):
        j=next((r for r in judge if r['conversation_id']==c['id'] and r['criterion_id']==crit),{})
        manual=labels.get(c['id'],{}).get(crit,{})
        rows.append('<tr><td>'+esc(crit)+'</td><td>'+label_span(manual.get('verdict'))+'</td><td>'+label_span(j.get('verdict'))+'</td><td>'+esc(j.get('reason',''))+'</td></tr>')
    header=f'<div class="card"><span class="tag">Case {esc(c["id"])}</span><span class="tag">{esc(c.get("source_version","unknown"))}</span><span class="tag">Model mode: {esc(c.get("mode"))}</span><span class="tag">{esc(c.get("problem",c.get("session",{}).get("problem","")))}</span><span class="tag">{esc(version)}</span><h2>Human judgment versus separate LLM judge</h2><table><tr><th>Single criterion</th><th>Your manual label</th><th>LLM judge</th><th>Model rationale</th></tr>{"".join(rows)}</table></div>'
    return shell('Judge verdict — '+c['id'],header+transcript_html(c['session']))
def redteam_html(c,manual=None):
    judges=c.get('llm_screening',[]);rows=[]
    for j in judges:rows.append('<tr><td>'+esc(j.get('attack_turn'))+'</td><td>'+label_span(j.get('verdict'))+'</td><td>'+esc(j.get('reason'))+'</td></tr>')
    label=manual.get(c["id"],{}).get("redteam_"+c["target_id"],{}) if manual else {}
    human_text=("Human verdict: "+label_span(label.get("verdict"))+". "+esc(label.get("note",""))) if label.get("verdict") in ("PASS","FAIL") else "Manual decision: NOT RECORDED. "
    main=f'<div class="card"><span class="tag">{esc(c.get("round"))}</span><span class="tag">{esc(c.get("target_id"))}</span><span class="tag">{esc(c.get("attack_type"))}</span><span class="tag">Rep {esc(c.get("repeat"))}</span><h2>Must-never target</h2><p>{esc(c.get("target",{}).get("must_never",""))}</p><div class="note">{human_text} LLM screening is provisional. A human must check every run, including early stops.</div><h2>Automated screening after each tutor turn</h2><table><tr><th>Attack turn</th><th>Model screening only</th><th>Reason</th></tr>{"".join(rows)}</table></div>'
    return shell('Red-team '+c['id'],main+transcript_html(c['session']))
def agreement_html(before,after):
    versions=[('v1 — original judge prompt',before),('v2 — revised judge prompt',after)]
    rows=[]
    for crit in ('reasoning_alignment','evidence_gating'):
        for name,res in versions:
            if not res:continue
            v=res.get('summary',{}).get(crit,{})
            kapp=v.get('kappa')
            rows.append('<tr><td>'+esc(crit)+'</td><td>'+esc(name)+'</td><td>'+esc(v.get('n','missing'))+'</td><td>'+esc(f"{v['agreement_percent']:.2f}%" if isinstance(v.get('agreement_percent'),(int,float)) else 'missing')+'</td><td>'+esc('undefined (one class)' if kapp is None else f'{kapp:.3f}')+'</td><td>'+esc(json.dumps(v.get('confusion',{})))+'</td></tr>')
    main='<section class="card"><h2>Agreement between YOUR independent labels and model verdicts</h2><table><tr><th>Criterion</th><th>Judge prompt</th><th>Paired labels</th><th>Percentage agreement</th><th>Cohen κ</th><th>Confusion counts</th></tr>'+''.join(rows)+'</table><p class="minor">Cohen’s kappa is undefined when expected agreement is 100%; do not replace undefined with a fictional score.</p></section>'
    return shell('Judge agreement — before and after',main)

class Recorder:
    def __init__(self,repo,url,require_ui):
        if sync_playwright is None:raise RuntimeError('Install screenshot support: python -m pip install playwright; python -m playwright install chromium')
        self.repo=repo;self.out=repo/'a2_evidence/screenshots';self.out.mkdir(parents=True,exist_ok=True)
        self.url=url;self.require_ui=require_ui
        manifest=self.out/'capture_manifest.json'
        self.records=read(manifest).get('captures',[]) if manifest.exists() else []
        self.pw=sync_playwright().start()
        try:
            self.browser=self.pw.chromium.launch(headless=True)
        except Exception:
            system_chromium=shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chrome')
            if not system_chromium:raise
            self.browser=self.pw.chromium.launch(headless=True,executable_path=system_chromium,args=['--no-sandbox'])
        self.page=self.browser.new_page(viewport={'width':1560,'height':1020},device_scale_factor=1)
    def close(self):
        self.browser.close();self.pw.stop()
        idx=self.out/'appendix_screenshot_index.md';idx.write_text('# Screenshot evidence index\n\n'+'\n'.join(f'- `screenshots/{r["png"]}` — {r["caption"]}' for r in self.records)+'\n',encoding='utf8')
        (self.out/'capture_manifest.json').write_text(json.dumps({'created_at':datetime.now(timezone.utc).isoformat(),'captures':self.records},indent=2)+'\n',encoding='utf8')
        print('Saved screenshot index:',idx)
    def html_capture(self,html_text,name,caption):
        p=self.out/'rendered_html'/f'{safe(name)}.html';p.parent.mkdir(exist_ok=True,parents=True);p.write_text(html_text,encoding='utf8')
        self.page.set_content(html_text,wait_until='load',timeout=25000)
        self.page.screenshot(path=str(self.out/f'{safe(name)}.png'),full_page=True,animations='disabled')
        self.records=[r for r in self.records if r.get('png')!=f'{safe(name)}.png']
        self.records.append({'png':f'{safe(name)}.png','caption':caption,'capture_type':'browser_render_of_real_saved_data','source_html':str(p)})
    def live_ui(self,file,name,caption,labels=None,judge=None):
        try:
            self.page.goto(self.url,wait_until='domcontentloaded',timeout=10000)
            if not self.page.locator('.ev-shell').count():
                self.page.get_by_role('button',name=re.compile('Evaluation',re.I)).first.click(timeout=7000)
            self.page.locator('.ev-shell').wait_for(timeout=8000)
            file_inputs=self.page.locator('.ev-toolbar input[type="file"]')
            if file_inputs.count()<3:raise RuntimeError('Evaluation tab does not expose expected import controls.')
            file_inputs.nth(0).set_input_files(str(Path(file).resolve()))
            self.page.locator('.ev-message').first.wait_for(timeout=9000)
            if labels:
                file_inputs.nth(1).set_input_files(str(Path(labels).resolve()))
                self.page.wait_for_timeout(200)
            if judge:
                file_inputs.nth(2).set_input_files(str(Path(judge).resolve()))
                self.page.get_by_role('button',name=re.compile('Reveal judge results',re.I)).click(timeout=6000)
            self.page.screenshot(path=str(self.out/f'{safe(name)}.png'),full_page=True,animations='disabled')
            self.records=[r for r in self.records if r.get('png')!=f'{safe(name)}.png']
            self.records.append({'png':f'{safe(name)}.png','caption':caption,'capture_type':'actual_running_algocoach_evaluation_UI','url':self.url})
        except Exception as e:
            if self.require_ui:raise RuntimeError(f'REQUIRED live UI screenshot failed for {name}: {e}')
            print('UI screenshot unavailable:',name,str(e)[:180]);return False
        return True

def main():
    p=argparse.ArgumentParser(description='Capture genuine AlgoCoach assessment evidence with browser screenshots')
    p.add_argument('command',choices=['example','single','redteam','judge','agreement','all'])
    p.add_argument('--repo',default='.')
    p.add_argument('--file',default='',help='Single genuine exported conversation for immediate screenshot')
    p.add_argument('--round',choices=['before','after'],default='before')
    p.add_argument('--version',default='a2_v1')
    p.add_argument('--url',default='http://127.0.0.1:5173/')
    p.add_argument('--require-ui',action='store_true',help='Fail instead of producing only HTML evidence if running frontend is inaccessible')
    args=p.parse_args();repo=Path(args.repo).resolve()
    r=Recorder(repo,args.url,args.require_ui)
    try:
        if args.command=='single':
            if not args.file:raise RuntimeError('--file must point to an actual saved CUI test JSON')
            f=Path(args.file).resolve();c=read(f)
            if c.get('purpose')=='red_team':
                cap=f"{c.get('round','?')} red-team test {c['id']}, target {c['target_id']} / {c['attack_type']}; genuine just-executed CUI transcript and provisional LLM screening."
                r.html_capture(redteam_html(c), 'RT_'+c['id'],cap)
            else:
                cap=f"Just-executed CUI transcript {c.get('id')}; genuine model-backed tutor messages."
                r.html_capture(shell('Conversation evidence '+c.get('id',''),transcript_html(c['session'])),'CONVERSATION_'+c.get('id',''),cap)
            r.live_ui(f,'UI_'+safe(c.get('id','case')),'Actual running AlgoCoach Evaluation tab with just-executed '+cap)
        if args.command=='example':
            d=read(HERE/'seeds/knapsack-pilot-01.json')
            content=shell('DEMONSTRATION — previously captured live conversation', '<div class="note"><strong>This screenshot demonstrates the capture pipeline only.</strong> It is not a new test and must not be represented as an assessment test run.</div>'+transcript_html(d['session']))
            r.html_capture(content,'EXAMPLE_previous_live_transcript','Example renderer showing a previously uploaded genuine model-backed session; not a new test.')
        if args.command in ('redteam','all'):
            human_file=repo/'red_team/human_labels.json'
            manual=read(human_file) if human_file.exists() else None
            if manual and isinstance(manual,dict):manual=manual.get('labels',manual)
            rounds=[args.round] if args.command=='redteam' else ['before','after']
            for rd in rounds:
                files=sorted((repo/'red_team/transcripts'/rd).glob('*.json'))
                files=[f for f in files if f.name!='manifest.json']
                for f in files:
                    c=read(f)
                    if c.get('purpose')!='red_team':continue
                    name='RT_'+rd+'_'+c['id'];cap=f"{rd.capitalize()} red-team {c['target_id']} / {c['attack_type']} / repetition {c['repeat']}; actual CUI transcript, provisional model screening; manual review required."
                    r.html_capture(redteam_html(c,manual),name,cap)
                    r.live_ui(f,'UI_'+name,'Running AlgoCoach Evaluation tab importing the actual '+cap)
        if args.command in ('judge','all'):
            versions=[args.version] if args.command=='judge' else ['a2_v1','a2_v2']
            dataset=repo/'llm_judge/a2_selected_20.json';labels_path=repo/'llm_judge/human_labels.json'
            if dataset.exists() and labels_path.exists():
                conversations=read(dataset)['conversations'];labels=read(labels_path);labels=labels.get('labels',labels)
                for ver in versions:
                    f=repo/f'llm_judge/judge_results/{ver}_results.json'
                    if not f.exists():continue
                    rows=read(f)['results']
                    for c in conversations:
                        name='JUDGE_'+ver+'_'+c['id'];cap=f"{ver} judge verdicts for {c['id']} against independent manual labels; authentic CUI messages and model judgments."
                        r.html_capture(judge_html(c,rows,labels,ver),name,cap)
                    r.live_ui(dataset,'UI_JUDGE_'+ver,'Running AlgoCoach Evaluation tab with 20 genuine transcripts, manual labels and '+ver+' judge results.',labels_path,f)
        if args.command in ('agreement','all'):
            f1=repo/'llm_judge/judge_results/a2_v1_agreement.json'
            f2=repo/'llm_judge/judge_results/a2_v2_agreement.json'
            if f1.exists():
                r.html_capture(agreement_html(read(f1),read(f2) if f2.exists() else None),'AGREEMENT_before_after','Actual percentage agreement and Cohen’s kappa from independent human labels versus v1/v2 model verdicts.')
        if args.command not in ('example','single') and not r.records:raise RuntimeError('No qualifying real evidence found; cannot produce assessment screenshots. Run tests first.')
    finally:r.close()
if __name__=='__main__':
    try:main()
    except Exception as e:print('SCREENSHOT ERROR:',e,file=sys.stderr);sys.exit(2)
