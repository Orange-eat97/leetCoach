# AlgoCoach — 0/1 Knapsack extension

This extension makes **0/1 Knapsack** the default Live Tutor problem while keeping **Longest Common Substring** selectable. The A1 scripted demo and the original LCS regression fixtures remain unchanged.

## Run

Restart both processes after installing this change:

```powershell
# Terminal 1, with OPENAI_API_KEY or SOCLAAS_API_KEY set
npm.cmd run server

# Terminal 2
npm.cmd run dev
```

Live Tutor opens 0/1 Knapsack by default. The problem selector starts a fresh session when switching between Knapsack and Longest Common Substring. Exported session JSON stores the selected `problem` id.

## Learning sequence

The fixed example has capacity 50 and three single-use items: A=(10,60), B=(20,100), C=(30,120). Ratio-greedy chooses A+B for value 160, while B+C reaches 220. The tutor asks the learner to expose this gap before developing an include-or-skip solution.

| Phase | Required learner-authored evidence |
|---|---|
| approach | Concrete item-selection method, even if flawed |
| gap | Why the learner's greedy approach can miss a better subset, or why a valid initial method covers all choices |
| solution | Correct exhaustive or 0/1 DP include/skip method with capacity and item-once constraints |
| abstraction | General include-or-skip structure and state invariant |
| transfer | Apply include/skip to Partition Equal Subset Sum `[1,5,11,5]`, including the half-sum target, reachability state, and no reuse |
| complete | Terminal acknowledgement |

Knapsack has its own evidence rubric, conservative false-negative recovery, hints, and two partial visuals. The shared evidence-gated state machine remains unchanged.

## Tests

```powershell
# Unit and legacy regression tests; no API required
powershell -ExecutionPolicy Bypass -File .\scripts\test-knapsack.ps1

# Optional model-backed replay; backend must already be running
powershell -ExecutionPolicy Bypass -File .\scripts\test-knapsack.ps1 -Live
```

The live smoke test writes `testing/knapsack-smoke-result.json`. The existing LCS regression remains available:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-a2-regression.ps1 -Live -Repeats 1
```

## Simulated learner collection

```powershell
npm.cmd run collect:a2 -- --problem=zero-one-knapsack --count=3 --start=1 --version=knapsack-pilot --out=testing/knapsack-pilot
```

Knapsack collection uses `testing/personas_knapsack.json`. Do not mingle pilot transcripts with the frozen LCS evaluation dataset without declaring the different problem and version. The existing red-team suite remains explicitly scoped to LCS.

The Knapsack heuristics are deliberately scoped to this fixed problem and transfer activity; they are not a general proof of correctness or a mastery estimate.
