# AlgoCoach CUI Prototype

AlgoCoach is a deterministic frontend prototype for CS3249 Assignment 1. It demonstrates how a moderated conversational interface helps a learner move from a naive two-pointer intuition to a dynamic-programming solution for Longest Common Substring.

The interface uses a bright, minimal LeetCode-inspired visual style designed for a desktop demonstration.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```bash
npm run build
npm run preview
```

## Demo controls

1. Use the **Demo scenario** toggle above the conversation to select **Faster** or **Guided** progression.
2. When it is the learner's turn, select **Use scripted learner reply**, then select **Send**.
3. When it is the coach's turn, select **Reveal coach response**.
4. The code workspace is collapsed by default so the learning interaction stays prominent. Select the vertical **Code workspace** rail to expand it, and use the chevron in its header to collapse it again.
5. Select **Run** in the expanded code panel before the recurrence is complete to see the two-pointer failure. Run it again after the implementation stage to see the mocked accepted result.
6. Use **Previous step**, **Reset**, or the global reset control to rehearse the demonstration.

## What the prototype demonstrates

- A textual conversational interface with learner and coach turns.
- Moderation that changes pacing and scaffolding based on learner progression.
- A naive two-pointer trace that exposes the offset-alignment problem.
- An embedded graphical DP state map.
- A code editor and deterministic compiler feedback.
- Four visible learning stages: Initial intuition, Correct recurrence, Working implementation, and Transfer.
- An adaptive next-problem recommendation tied to the learner's starting intuition and demonstrated progress.

## Scripted scenarios

### Faster progression

The learner identifies the offset problem quickly and defines the correct DP state. The coach shortens the scaffolding and moves directly to recurrence, implementation, and transfer.

### More scaffolding

The learner remains attached to lockstep pointers and briefly proposes a subsequence-style recurrence. The coach slows down, traces a counterexample, elicits base cases, isolates the contiguity misconception, and only then advances to implementation.

## Prototype boundaries

- All conversation turns, compilation results, and progress values are local and deterministic.
- There is no LLM, compiler service, vector database, authentication, or persistence.
- The scenario toggle is a demonstration control, not a proposed learner-facing feature.
- The code editor is a visual prototype; it is not intended as a general-purpose editor.

## Supporting material

- `docs/storyboard.md` documents screen states and both complete dialogue flows.
- `docs/video-script.md` provides a concise assignment demonstration script.
