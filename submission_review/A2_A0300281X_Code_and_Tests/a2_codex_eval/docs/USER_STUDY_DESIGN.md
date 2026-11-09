# Report Step 3 — proposed user study (DESIGN ONLY; NO PEOPLE WERE STUDIED)

This is a practical draft for the student to review, refine, and justify in their own words. It contains complete proposed instruments to include in an appendix.

## Research questions and hypotheses

| Design goal | Research question | Intended measure and evidence |
|---|---|---|
| DG1 Preserve learner-generated reasoning | RQ1: Does AlgoCoach elicit more independent learner explanations and reduce unrequested solution disclosure compared with a general-purpose chatbot? | Blinded coding of learner-authored reasoning steps and premature answer disclosures in conversation logs; independent post-task explanation score |
| DG2 Adapt scaffolding to the learner's reasoning gap | RQ2: Do learners using AlgoCoach receive more relevant, appropriately timed repair/hints than comparable chatbot users, especially after errors? | Blind tutor-relevance ratings for every intervention, time-to-resolve a coded misconception, self-rated perceived support without excessive help |
| DG3 Encourage reusable abstraction and transfer | RQ3: After the practice task, can AlgoCoach learners solve a structurally related unseen task and explain the underlying take/skip principle more effectively? | Blindly graded novel near-transfer problem and written principle explanation, with delayed retention check |

## Study design

- **Participants**: Target N=32 undergraduate novice/intermediate algorithm learners, recruited from introductory/intermediate CS courses. Exclude participants who previously solved both assessment problems, or record prior exposure and stratify randomization. No participant has been recruited for A2.
- **Comparison**: Between-subject randomly assign 16 to AlgoCoach and 16 to a general-purpose chatbot (same base model where feasible, with no AlgoCoach controller); same primary task, same time limits and access to problem statement. This tests the added pedagogical interaction design, but cannot fully isolate individual components.
- **Procedure**: consent → baseline programming knowledge survey and 10-minute pre-test → randomized 20-minute Knapsack learning interaction → immediate 10-minute independent explanation/novel near-transfer task (no chatbot) → short questionnaire/interview → optional independent 1-week delayed transfer task. Save anonymized transcripts; blind human graders to condition.
- **Primary materials**: Use a fresh 0/1 Knapsack instance with changed items/capacity for guided practice, followed by an unseen Partition Equal Subset Sum input distinct from the tutor example. Provide equivalent teaching time and problem statements in both groups. Record prompts but no personal names/IDs in anonymized transcripts.
- **Analysis**: Use two independent rubric graders for reasoning and transfer, report agreement and resolve discrepancies blind to condition. Compare group means/medians on transfer scores, proportion completing independent explanations, reasoning-ownership frequency, and gap-repair relevance; report effect sizes with confidence intervals and uncertainty. Adjust for baseline skill and problem familiarity if pre-registered. Do not present significance claims without actual participant data.
- **Limitations / mitigations**: small convenience sample and limited external validity; novices may differ by prior DP exposure (stratified randomisation, pretest adjustment); novelty of new tutor (matched UI introduction); differences in time-on-task (fixed exposure window); chatbot model variance (same model, documented prompts); experimenter expectations (blind raters); short learning session does not establish durable learning (optional delayed test); near-transfer may not imply far transfer.

## Full proposed questionnaires (appendix material)

Agreement scale: 1 = Strongly disagree; 2 = Disagree; 3 = Neither; 4 = Agree; 5 = Strongly agree.

1. I was encouraged to explain my own approach before being shown a new strategy. (DG1)
2. The tutor built on reasoning that I had actually expressed. (DG1)
3. The tutor revealed more of the solution than I wanted before I attempted it. (reverse-coded DG1)
4. When I made a mistake, the tutor's next question addressed that particular mistake. (DG2)
5. The level of guidance was appropriate for my current understanding. (DG2)
6. The tutor repeated questions about concepts I had already explained correctly. (reverse-coded DG2)
7. I can state a general principle from this problem without referring to its original numbers. (DG3)
8. I feel able to apply that principle to a different but structurally related problem. (DG3; **self-report only**, not proof of transfer)
9. How confident were you with dynamic programming before the task? (1 = Not at all, 5 = Very)
10. Had you previously solved 0/1 Knapsack? (Never / Attempted / Solved independently / Seen a worked solution)

## Full proposed independent learning tasks (appendix material)

**Pre-test (without assistance):** "You can use each item at most once. Given items of weights [2,3,4] and values [3,4,5] with capacity 5, select items that maximise value. Explain *why* your choice is best, including one competing choice." Score 0-4: correct subset, valid capacity, discusses alternative, coherent reasoning.

**Immediate near-transfer task (without assistance):** "Given integer multiset [2, 3, 7, 8, 10], can it be partitioned into two subsets of equal sum? State your target sum, give a concrete partition if possible, and explain a general take-or-skip state transition that uses each element no more than once." Score 0-6: sum/target correct, conclusion correct, concrete witness where possible, coherent states, no item reuse, explanation of choice/skip.

**Delayed near-transfer variation (without assistance, if feasible):** "Given [1, 2, 3, 5], decide whether equal partition is possible; justify the result and explain the difference between 0/1 and unbounded choices." Score 0-6 with analogous rubric.

**General abstraction prompt (without assistance):** "Describe the most reusable idea you learned about building an exact algorithm from a sequence of include/skip decisions. Explain why a greedy value-to-weight choice does not always preserve the global optimum." Score 0-4 based on completeness, constraints, correctness, transfer-level abstraction.

## Full proposed interview questions (appendix material)

1. Tell me about a moment when the tutor followed your idea instead of replacing it. What was helpful or unhelpful?
2. Describe a moment where the tutor misunderstood what you meant or asked for clarification. How did you recover common ground?
3. When you became stuck, what did the tutor do next? Did it change its support in a useful way?
4. What, if anything, would you reuse when solving a problem that isn't explicitly called "Knapsack"?
5. Was there any point where the tutor gave away too much, demanded an unnecessary step, or treated a correct answer as wrong?

## How the design can falsify the goals

| Goal | Evidence supporting goal | Evidence opposing goal |
|---|---|---|
| DG1 | Higher proportion of independently explained steps and fewer premature complete solutions in AlgoCoach logs and post-task explanations | Equal/lower reasoning ownership or more unsolicited disclosures |
| DG2 | Higher blinded relevance scores after learner errors, fewer repeated irrelevant hints, appropriate repairs | Similar/worse relevance and more unjustified stagnation even after controlling baseline skill |
| DG3 | Higher unseen transfer and abstraction rubric scores, sustained on delayed task if included | Equal/lower transfer scores or improvements only on the practiced instance |

**Never put hypothetical participant numbers or invented p-values in the report.**
