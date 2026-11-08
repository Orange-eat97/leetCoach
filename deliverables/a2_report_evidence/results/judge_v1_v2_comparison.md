# LLM judge comparison: a2_v1 and a2_v2

Human labels were completed and frozen before either judge run. Each version evaluated the same 20 Knapsack conversations on the same two criteria (20 pairs per criterion; 40 pairs total).

## Agreement results

| Criterion | Version | Agreement | Cohen's kappa | Judge PASS rate | Human PASS rate | Disagreements |
|---|---:|---:|---:|---:|---:|---:|
| Reasoning-grounded support (DG1) | v1 | 80% | 0.231 | 80% | 90% | 4 |
| Reasoning-grounded support (DG1) | v2 | 85% | 0.318 | 85% | 90% | 3 |
| Evidence-consistent progression (DG2) | v1 | 75% | 0.167 | 90% | 75% | 5 |
| Evidence-consistent progression (DG2) | v2 | 70% | 0.368 | 55% | 75% | 6 |

## Interpretation

DG1 improved modestly on both measures. V2 stopped treating value-to-weight greedy as a correct general alternative in `final-knapsack-11`, reducing one false FAIL. It still disagreed with the human labels on `final-knapsack-05`, `final-knapsack-08`, and `final-knapsack-13`, where the remaining boundary is how specific a grounded challenge must be.

DG2 did not improve unambiguously. V1 predicted only two FAILs and missed four of the five human FAIL conversations, producing high expected agreement and low kappa. V2 detected four of the five human FAILs, including the previously missed `final-knapsack-05`, `final-knapsack-15`, and `final-knapsack-16`, but it also marked five human-PASS conversations as FAIL. Consequently raw agreement fell from 75% to 70%, while kappa rose from 0.167 to 0.368 because predictions were less dominated by PASS.

The total number of disagreements remained nine. V2 resolved four v1 disagreements (`final-knapsack-05` DG2, `final-knapsack-11` DG1, `final-knapsack-15` DG2, and `final-knapsack-16` DG2) but introduced four DG2 disagreements (`final-knapsack-04`, `final-knapsack-08`, `final-knapsack-09`, and `final-knapsack-11`). Five disagreements persisted: `knapsack-pilot-02` DG2, `final-knapsack-05` DG1, `final-knapsack-08` DG1, and both criteria for `final-knapsack-13`.

V2 therefore should not be described as simply "better." It improved DG1 and increased DG2 sensitivity to incomplete reasoning, but its stricter DG2 wording over-penalized several conversations the human reviewer considered adequate. Neither version is a measurement of learner mastery, and the small simulated-learner dataset limits generalization.
