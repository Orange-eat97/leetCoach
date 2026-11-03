# AlgoCoach Demonstration Video Script

Target duration: 6 to 8 minutes. Keep your face visible while speaking.

## 0:00 to 0:40 Project introduction

“This project is AlgoCoach, a conversational learning prototype for university students preparing for coding interviews. My learner interviews indicated a convergence difficulty: students can obtain an AI solution, but often struggle to connect their own intuition to the optimal approach and retain the reasoning for later problems.”

“The prototype focuses on Longest Common Substring. The learner begins with a lockstep two-pointer idea and works toward a dynamic-programming solution.”

## 0:40 to 1:20 Division of work

Point to the problem and conversation regions, then briefly indicate the collapsed **Code workspace** rail.

“The learner must propose an approach, inspect counterexamples, define the DP state, implement the recurrence, and explain how the idea transfers. The CUI does not immediately reveal the solution. It elicits reasoning, changes the amount of scaffolding, visualises difficult states, and provides test feedback.”

“The problem remains visible on the left and the moderated dialogue receives most of the screen. Code with mocked compiler feedback is available from this collapsible rail, because it supports the learning interaction rather than defining the product.”

## 1:20 to 2:20 Show the initial failure

Keep the Faster scenario selected.

1. Reveal the first learner reply.
2. Expand **Code workspace**.
3. Before progressing to DP, select **Run**.
4. Show the failed offset-match test, then collapse the workspace before returning to the dialogue.

Say:

“The naive code advances both pointers together. It can find matches in one alignment, but it does not inspect all possible starting offsets. The failed test makes that gap concrete without replacing the learner’s reasoning.”

## 2:20 to 3:40 Demonstrate faster progression

Continue through the Faster scenario.

“This learner recognises the offset issue quickly. The moderator therefore reduces scaffolding and asks directly for a reusable state.”

When the coach gives the two-coordinate memory hint, say:

“The coach points toward the structure without naming a 2D array. The learner still has to decide that the state needs two dimensions and define what each entry means.”

When the learner defines `dp[i][j]`, point to the progress panel.

“The interface only marks Correct recurrence after the learner states that the cell represents a substring ending at both positions and that mismatch resets the run.”

When the DP grid appears:

“The embedded model shows the diagonal chain corresponding to `BABC`. The visual is part of the conversation rather than a detached explanation.”

Complete the flow, briefly expand the code workspace to run the tests again, then collapse it for the recommendation card. Say:

“Because this learner progressed quickly, the system recommends Longest Common Subsequence. The recommendation explicitly connects to the learner's original pairwise comparison, then asks them to predict how mismatch handling changes.”

## 3:40 to 5:20 Demonstrate moderated pacing

Use the **Demo scenario** toggle to select **Guided**.

“The toggle is a demonstration control. It lets me show how the same product responds when learner progression differs.”

Advance through the pointer trace, the base-case questions, and the incorrect `max(top, left)` proposal.

“This learner remains attached to two pointers, so the coach slows down. It traces one alignment, asks the learner to change the offset, and decomposes the idea into one-character base cases.”

“The learner then confuses substring with subsequence. Instead of stating the correction, the coach asks whether a mismatched ending can still be contiguous. Only after the learner resolves that question does the progress stage advance.”

At the final recommendation, say:

“This learner receives Maximum Length of Repeated Subarray as a near-transfer exercise. It preserves the same offset problem and diagonal-reset recurrence, giving them another chance to repair the original lockstep two-pointer intuition before moving to a more distant problem.”

## 5:20 to 6:15 Important design decision

“The most important design decision is that progress is evidence-based rather than based on the number of messages or attempted questions. Each stage corresponds to something the learner demonstrates: an initial intuition, a correct recurrence, a working implementation, and transfer to a related problem.”

“This also makes moderation visible. Faster progress produces shorter scaffolding, while a misconception produces smaller questions and an additional representation.”

## 6:15 to 6:55 Current limitation

“This Assignment 1 prototype is intentionally scripted. It does not contain a live language model, real compiler, vector database, or persistent learner model. The two flows demonstrate the intended interaction and frontend components, but they do not yet interpret arbitrary learner responses. That would be implemented and user-tested in a later version.”

## 6:55 to 7:20 Closing

Finish on the completed Guided screen with accepted tests.

“The completed interaction shows the learner moving from an incomplete intuition to a DP implementation and, importantly, explaining why substring and subsequence differ. This directly addresses the convergence difficulty by preserving learner-generated reasoning while making the route to the optimal solution inspectable.”
