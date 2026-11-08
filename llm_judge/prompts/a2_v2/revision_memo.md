# A2 judge prompt revision memo: a2_v1 to a2_v2

## Baseline agreement

The independent human labels were frozen before the v1 judge run. V1 produced:

- Reasoning-grounded support (DG1): 16/20 agreement (80%), Cohen's kappa 0.2308.
- Evidence-consistent progression (DG2): 15/20 agreement (75%), Cohen's kappa 0.1667.
- Nine disagreements in total. Human labels were not changed in response to judge output.

V2 keeps each prompt single-criterion with explicit PASS/FAIL output. The revisions clarify ambiguous decision boundaries observed in the actual disagreements rather than adding case IDs or desired verdicts.

## Disagreement review

| Conversation / criterion | Human / v1 judge | Transcript-grounded diagnosis | V2 clarification |
|---|---|---|---|
| `knapsack-pilot-02` / DG2 | FAIL / PASS | The learner's opening already enumerated all subsets, rejected overweight subsets, maximized value, and explained full coverage. The tutor then made scalability and item-once probing into extra prerequisites even though exhaustive enumeration was already valid. | Exhaustive enumeration is explicitly sufficient; efficiency or DP cannot become a needless prerequisite after adequate evidence. |
| `final-knapsack-05` / DG1 | FAIL / PASS | The learner proposed ratio-greedy. The first challenge said it could be suboptimal but largely restated the need to consider combinations, without eliciting the concrete failure mechanism. The human treated this generic challenge as insufficiently grounded. | A challenge to a misconception must engage or elicit its specific failure mechanism; merely restating the task can fail grounding. |
| `final-knapsack-05` / DG2 | FAIL / PASS | The tutor advanced to abstraction immediately after the learner said they were unsure how the proposed backtracking mechanism would work. The human treated that unresolved mechanism as material. | Named uncertainty about an essential correctness mechanism must be resolved before advancement; syntax-only uncertainty does not block progress. |
| `final-knapsack-08` / DG1 | PASS / FAIL | The learner had moved from a flawed removal heuristic to considering all combinations but explicitly said they did not know how to do so efficiently. The DP suggestion addressed that expressed efficiency gap. | Offering DP in response to an expressed efficiency/tracking gap is grounded; replacing an already-complete correct alternative solely by preference is not. |
| `final-knapsack-11` / DG1 | PASS / FAIL | V1 called value-to-weight ratio a correct alternative. It is not a generally correct 0/1 Knapsack algorithm, and the learner also expressed concern about reuse and remaining capacity. The challenge addressed those stated issues. | The prompt distinguishes valid exhaustive/DP alternatives from invalid ratio or highest-value heuristics. |
| `final-knapsack-13` / DG1 | PASS / FAIL | V1 treated vague selection by value as a correct method and claimed the tutor imposed a criterion the learner had not expressed. The tutor's capacity/include-skip question was responsive to the learner's vague selection proposal. | Highest-value or ratio selection is not a valid general alternative; challenging it is permitted when tied to the learner's proposal. |
| `final-knapsack-13` / DG2 | PASS / FAIL | V1 treated repeated requests for code and statements of uncertainty as absence of understanding, despite substantive DP, take/skip, target-half, state, recursion, index, and no-reuse explanations. | Code requests, confidence, and uncertainty neither establish nor erase reasoning; substantive evidence in the same turn controls. |
| `final-knapsack-15` / DG2 | FAIL / PASS | The learner repeatedly mixed Knapsack value maximization with equal-partition reachable-weight reasoning before transfer. V1 accepted DP vocabulary and reverse iteration without detecting that unresolved objective conflation. | Vague DP language is insufficient, and current-problem/transfer-objective conflation must be repaired before advancement. |
| `final-knapsack-16` / DG2 | FAIL / PASS | The learner moved from ratio-greedy to a vague suggestion to use DP, without a concrete recurrence, exhaustive mechanism, or item-once invariant, yet the tutor advanced to abstraction. | Mentioning DP or a maximum-value table alone is insufficient evidence for a correct 0/1 method. |

## Generalization intent

The v2 prompts do not require DP and do not assume that reaching `complete` proves learning. DG1 now separates responsiveness from method preference and task correctness. DG2 now separates substantive conceptual evidence from confidence, code-seeking language, and algorithm-name recognition. The rerun should be interpreted honestly even if agreement or kappa decreases.

## V2 outcome

The rerun produced mixed results. DG1 agreement rose from 80% to 85% and kappa from 0.231 to 0.318. DG2 agreement fell from 75% to 70%, while kappa rose from 0.167 to 0.368 because v2 predicted more FAILs and reduced the PASS-heavy class imbalance. V2 resolved four original disagreements but introduced four new DG2 false positives, leaving nine disagreements overall. See `a2_evidence/reports/judge_v1_v2_comparison.md` for the complete comparison and limitations.
