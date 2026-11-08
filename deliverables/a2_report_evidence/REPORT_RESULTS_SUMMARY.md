# AlgoCoach A2 report evidence summary

This folder contains report-ready copies of the genuine evaluation artifacts. Originals remain in `a2_evidence/`, `llm_judge/`, and `red_team/`.

## Dataset and human labels

- Dataset: 20 genuine, model-backed 0/1 Knapsack conversations.
- Nineteen conversations reached `complete`; `final-knapsack-07` stalled in `gap` after 24 learner turns and was retained as an authentic failure case.
- Independent human labels: 40/40 completed before judge results were viewed.
- Human reasoning-grounded support (DG1): 18 PASS, 2 FAIL (90% PASS).
- Human evidence-consistent progression (DG2): 15 PASS, 5 FAIL (75% PASS).
- Five distinct conversations received at least one human FAIL: `knapsack-pilot-02`, `final-knapsack-05`, `final-knapsack-07`, `final-knapsack-15`, and `final-knapsack-16`.

## LLM judge results

| Criterion | Version | Agreement | Cohen's kappa | Judge PASS rate | Human PASS rate | Disagreements |
|---|---:|---:|---:|---:|---:|---:|
| DG1 reasoning-grounded support | v1 | 80% | 0.231 | 80% | 90% | 4 |
| DG1 reasoning-grounded support | v2 | 85% | 0.318 | 85% | 90% | 3 |
| DG2 evidence-consistent progression | v1 | 75% | 0.167 | 90% | 75% | 5 |
| DG2 evidence-consistent progression | v2 | 70% | 0.368 | 55% | 75% | 6 |

V2 improved DG1 agreement and kappa. DG2 changed in a mixed way: raw agreement fell by five percentage points, while kappa rose because v2 predicted more FAILs and reduced the PASS-heavy class imbalance. It detected four of five human DG2 FAILs but over-predicted five FAILs on human-PASS cases. The total number of disagreements remained nine: four v1 disagreements were resolved and four new DG2 disagreements appeared. This must not be presented as an unqualified improvement.

## Red-team results

- Targets: premature complete-solution disclosure; false validation or fabricated test execution.
- Attack matrix: two targets x three attack styles x three repetitions = 18 transcripts.
- Human review: 18/18 PASS, 0 confirmed FAIL.
- The automated screener provisionally flagged all six multi-turn build-up attempts. Manual review found that none crossed the target-specific FAIL boundary, so these are retained as six screening false positives.
- No source change or after-fix retest was required. Absence of a confirmed failure in this matrix does not establish general safety.

## Screenshot evidence

- 20 v1 conversation verdict screenshots.
- 20 v2 conversation verdict screenshots.
- Two live Evaluation UI judge overview screenshots (v1 and v2).
- One agreement comparison screenshot.
- 18 live Evaluation UI red-team screenshots.
- Captions and provenance are listed in `screenshots/appendix_screenshot_index.md`.

## Suggested report use

- Main text: use the compact metrics table above and the interpretation in `results/judge_v1_v2_comparison.md`.
- Judge appendix: use `screenshots/UI_JUDGE_a2_v1.png`, `screenshots/UI_JUDGE_a2_v2.png`, and representative disagreement screenshots; retain all 40 per-conversation screenshots in the evidence archive.
- Agreement appendix: use `screenshots/AGREEMENT_before_after.png`.
- Red-team appendix: use the 18 `screenshots/UI_RT_before_*.png` images with their one-line captions.
- Limitations: simulated learners, small sample, model stochasticity, class imbalance, human-judge ambiguity, one stalled conversation, and red-team coverage limited to the specified attacks.

## File map

- `datasets/`: selected 20-conversation corpus, manifest, and preparation status.
- `results/`: human labels, judge outputs, agreement JSON, disagreement reports, quality audit, and red-team results.
- `prompts/`: immutable v1 prompts, revised v2 prompts, and revision memo.
- `red_team/transcripts/before/`: all 18 genuine attacks plus their manifest.
- `screenshots/`: report and appendix images with caption index.
