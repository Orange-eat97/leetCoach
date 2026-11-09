# AlgoCoach Interaction Storyboard

## Prototype purpose

The prototype illustrates one complete, multi-turn learning activity. A learner begins with a naive lockstep two-pointer approach to Longest Common Substring and finishes by explaining and implementing the dynamic-programming recurrence.

The two scenarios show the same product adapting its pace. They are alternative demonstrations, not consecutive lessons.

## Persistent interface

| Region | Purpose |
| --- | --- |
| Problem panel | Keeps the task, example, constraints, learning focus, and four-stage progress visible. |
| Conversation panel | Elicits reasoning, supplies adaptive prompts, and embeds visual explanations inside the relevant turn. |
| Code panel | Collapsed by default to prioritise the product's moderated dialogue; its labelled rail expands to show the two-pointer attempt, DP scaffold, and final solution when needed. |
| Test console | Demonstrates failed offset coverage before DP and accepted results after implementation. |
| Scenario toggle | Demo-only control for switching between the faster and guided trajectories. |

## Shared problem state

- Input: `s1 = "ABABC"`, `s2 = "BABCA"`
- Expected substring: `"BABC"`
- Expected length: `4`
- Initial intuition: advance two pointers together and reset after a mismatch.
- Key flaw: lockstep pointers inspect only one alignment and can miss a match beginning at different offsets.
- DP state: `dp[i][j]` is the length of the common substring ending at `s1[i - 1]` and `s2[j - 1]`.
- Recurrence: on a character match, use `dp[i - 1][j - 1] + 1`; otherwise reset to `0`.

## Scenario A Faster progression

| Turn | Speaker | Interface evidence | Learning purpose |
| --- | --- | --- | --- |
| 1 | Coach | Initial question appears; stage 1 is active. | Elicit an approach before giving a solution. |
| 2 | Learner | Learner proposes lockstep pointers. | Externalise the initial intuition. |
| 3 | Coach | A textual offset counterexample is posed without adding a model. | Test the hidden same-start assumption while keeping the fast path concise. |
| 4 | Learner | Learner recognises that all starting pairs may be needed. | Establish the limitation independently. |
| 5 | Coach | A directional hint proposes memory indexed by two ending positions, without naming a 2D array. | Link the alignment problem to a two-dimensional representation without revealing it. |
| 6 | Learner | Learner proposes the 2D table, then defines the ending-at state and reset rule. | Capture evidence for Correct recurrence. |
| 7 | Coach | DP grid appears with the length-four diagonal chain. | Confirm the model and connect it to a visual representation. |
| 8 | Learner | Code changes to the final DP solution; tests are ready. | Capture evidence for Working implementation. |
| 9 | Coach | `Longest Common Subsequence` is recommended as the next practice problem, with a rationale tied to the learner's original two-position comparison. | Personalise transfer for a learner who progressed quickly. |
| 10 | Learner | Learner predicts that subsequence keeps `max(top, left)` instead of resetting. | Complete Transfer by adapting the original intuition to a new recurrence. |

## Scenario B More scaffolding

| Turn | Speaker | Interface evidence | Learning purpose |
| --- | --- | --- | --- |
| 1 | Coach | Initial question appears. | Elicit the learner's own approach. |
| 2 | Learner | Learner strongly prefers two pointers. | Reveal confidence in the initial intuition. |
| 3 | Coach | A concrete pointer trace appears. | Slow the interaction and make execution inspectable. |
| 4 | Learner | Learner describes advancing both pointers. | Confirm the exact rule being used. |
| 5 | Coach | Coach asks the learner to change the starting offset. | Offer a constrained hint instead of the answer. |
| 6 | Learner | Learner discovers `BABC`. | Let the learner identify the approach's blind spot. |
| 7 | Coach | Coach asks one-character base cases. | Decompose the transition into a simpler state. |
| 8 | Learner | Learner gives `1` for match and `0` for mismatch. | Establish a base case. |
| 9 | Coach | Coach asks for a state ending at both positions. | Prepare the recurrence. |
| 10 | Learner | Learner proposes `max(top, left)`. | Surface confusion with Longest Common Subsequence. |
| 11 | Coach | Coach asks whether a mismatched ending can remain contiguous. | Isolate the misconception without stating the answer. |
| 12 | Learner | Learner states diagonal-plus-one or zero. | Capture Correct recurrence. |
| 13 | Coach | Full DP state map appears. | Consolidate the mental model. |
| 14 | Learner | Final code and tests become available. | Capture Working implementation. |
| 15 | Coach | `Maximum Length of Repeated Subarray` is recommended because it repeats the same shifted-alignment challenge with integer arrays. | Use a near-transfer problem to consolidate the learner's main difficulty. |
| 16 | Learner | Learner predicts how the same two-pointer failure and diagonal DP state apply. | Complete Transfer through a new input representation. |

## Compiler states

| When Run is selected | Result |
| --- | --- |
| Before Working implementation | One test passes and the offset-match test fails. The console explains that lockstep pointers do not inspect every alignment. |
| At or after Working implementation | Both scripted tests pass. The console shows `O(mn)` time and `O(mn)` space. |

## Demonstration ending

The completed screen must show:

1. All four progress stages completed.
2. The learner's transfer explanation.
3. The accepted test result.
4. The DP solution in the code panel.

Expand the code workspace only for the implementation and test evidence, then collapse it again to keep the final transfer conversation visually dominant.
