#!/usr/bin/env python3
"""Surface factual corpus quality flags. Not a learning judge; produces no PASS/FAIL labels."""
import argparse,csv,json,re
from pathlib import Path
from collections import Counter

def flags(c):
    s=c.get('session',{});turns=s.get('transcript',[])
    learner=[x.get('text','') for x in turns if x.get('role')=='learner']
    tutor=[x.get('text','') for x in turns if x.get('role')=='coach']
    events=s.get('events',[])
    result=[]
    if s.get('turn',0)<3:result.append('short_multiturn')
    if c.get('error'):result.append('collector_error')
    if c.get('mode')!='llm':result.append('not_model_mode')
    if any(x.get('source') in ('rule-fallback','model-error-fallback') for x in events if x.get('kind')=='coach_reply'):
        result.append('fallback_tutor_reply')
    if not any(x.get('action')=='ASK_TRANSFER' for x in turns if x.get('role')=='coach'):
        result.append('no_transfer_question_observed')
    if any(a==b for a,b in zip(tutor,tutor[1:])):result.append('duplicate_consecutive_coach_reply')
    persona=c.get('persona',{}).get('id','')
    opening=' '.join(learner[:1]).lower()
    if persona=='k03' and 'dp' not in opening and 'table' not in opening:
        result.append('k03_persona_did_not_start_with_DP')
    if persona=='k05' and not re.search(r'understand|skip|solution|answer|code|confident',opening):
        result.append('k05_confidence_behavior_not_in_opening')
    if persona=='k06' and not re.search(r'item|dp|again|repeat|row|weight',opening):
        result.append('k06_0_1_confusion_not_visible_in_opening')
    if persona=='k08' and len(opening)>300:result.append('k08_opening_more_specific_than_expected')
    if s.get('complete') and not any(x.get('action')=='COMPLETE' for x in turns if x.get('role')=='coach'):result.append('completion_without_visible_acknowledgement')
    return result

def main():
    p=argparse.ArgumentParser();p.add_argument('--repo',default='.')
    args=p.parse_args();repo=Path(args.repo)
    f=repo/'llm_judge/a2_selected_20.json'
    d=json.loads(f.read_text(encoding='utf8'))['conversations']
    output=[]
    for c in d:
        row={'id':c['id'],'source_version':c.get('source_version'),'problem':c.get('problem',c.get('session',{}).get('problem')),'persona':c.get('persona',{}).get('id'),'turns':c.get('session',{}).get('turn'),'complete':c.get('session',{}).get('complete'),'possible_quality_flags':flags(c)}
        output.append(row)
    dest=repo/'a2_evidence/reports';dest.mkdir(parents=True,exist_ok=True)
    (dest/'quality_audit.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf8')
    with (dest/'quality_audit.csv').open('w',encoding='utf8',newline='') as f:
        wr=csv.DictWriter(f,fieldnames=['id','source_version','problem','persona','turns','complete','possible_quality_flags']);wr.writeheader()
        for row in output:wr.writerow({**row,'possible_quality_flags':';'.join(row['possible_quality_flags'])})
    for row in output:
        if row['possible_quality_flags']:print(row['id'],':',','.join(row['possible_quality_flags']))
    print('Generated factual quality audit of',len(output),'cases (flags are NOT judge scores).')
if __name__=='__main__':main()
