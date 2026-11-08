import importlib.util,json,tempfile,unittest
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('a2run',BASE/'run.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
spec2=importlib.util.spec_from_file_location('a2capture',BASE/'capture.py');c=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(c)
class PackageTests(unittest.TestCase):
    def test_five_seed_conversations_are_authentic_shapes(self):
        files=list((BASE/'seeds').glob('*.json'))
        self.assertEqual(5,len(files))
        for file in files:
            d=a.read(file)
            self.assertEqual('llm',d.get('mode'))
            self.assertEqual([],a.validate_convo(d),file.name)
            self.assertTrue(d['session']['turn']>=5)
            self.assertEqual(d['id'],file.stem)
    def test_redteam_exact_18_runs(self):
        t=a.read(BASE/'configs/redteam_knapsack.json')['targets']
        self.assertEqual(2,len(t))
        self.assertEqual(['pedagogical','learner_harm'],[x['category'] for x in t])
        self.assertEqual(18,sum(3*len(x['attempts']) for x in t))
        for x in t:
            self.assertEqual({'direct_request','role_play','multi_turn_build_up'},{i['type'] for i in x['attempts']})
            self.assertTrue(x['pass_rule'] and x['fail_rule'])
    def test_escape_user_text_before_screenshot(self):
        v=c.transcript_html({'transcript':[{'role':'learner','text':'<script>alert(1)</script>'}]})
        self.assertNotIn('<script>',v)
        self.assertIn('&lt;script&gt;',v)
    def test_label_gate_requires_own_labels(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'llm_judge').mkdir()
            convs=[]
            for f in (BASE/'seeds').glob('*.json'):
                convs.append(a.read(f))
            a.write(root/'llm_judge/a2_selected_20.json',{'conversations':convs})
            with self.assertRaisesRegex(RuntimeError,'has not exported'):
                a.verify_labels(root)
    def test_label_gate_checks_all_and_five_failures(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'llm_judge').mkdir()
            old=a.read(BASE/'seeds/historical-hotfix-stall.json')
            pool=[]
            for i in range(20):
                d=json.loads(json.dumps(old));d['id']='test_'+str(i)
                d['source_version']='baseline-frozen' if i>=15 else 'final-knapsack'
                pool.append(d)
            a.write(root/'llm_judge/a2_selected_20.json',{'conversations':pool})
            labels={x['id']:{criterion:{'verdict':'PASS'} for criterion in a.CRITERIA} for x in pool}
            a.write(root/'llm_judge/human_labels.json',{'labels':labels})
            with self.assertRaisesRegex(RuntimeError,'Only 0'):
                a.verify_labels(root)
            for d in pool[-5:]:labels[d['id']]['evidence_gating']['verdict']='FAIL'
            a.write(root/'llm_judge/human_labels.json',{'labels':labels})
            out,_=a.verify_labels(root)
            self.assertEqual('FAIL',out[pool[-1]['id']]['evidence_gating']['verdict'])
    def test_malformed_or_fallback_conversations_rejected(self):
        d=a.read(BASE/'seeds/knapsack-pilot-01.json')
        d['session']['events'].append({'kind':'coach_reply','source':'model-error-fallback'})
        self.assertIn('contains fallback tutor response',a.validate_convo(d))
if __name__=='__main__':unittest.main(verbosity=2)
