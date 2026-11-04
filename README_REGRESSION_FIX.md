# AlgoCoach A2 – corrected evidence-interpretation patch (4 Nov 2026)

This replacement patch fixes two observed regressions in the model-backed tutor without changing the React interface or increasing the 25-second model timeout.

## What changed

1. The interpreter evaluates all five evidence kinds independently of the current controller phase. The controller still accepts only the evidence required for one phase transition per learner turn.
2. Conservative, inspectable rubric recovery handles clearly expressed two-pointer approaches, shifted-alignment limitations, correct ending-position DP or start-pair enumeration, an explicit principle, and the integer-array near-transfer. Recovered evidence is marked `assessmentOrigin: "phase-rubric-recovery"`.
3. Complete-answer requests are separated from reasoning evidence. A request alone cannot advance or disclose a solution; a valid explanation is not erased merely because the learner also requests code.
4. `ASK_ABSTRACTION`, `ASK_TRANSFER`, and `COMPLETE` remain deterministic controller-owned replies.
5. Model diagnostics continue to record stage, duration, outcome, provider, model, and safe response metadata without recording API keys, hidden prompts, or full model responses.

The recovery checks are deliberately scoped to Longest Common Substring and its Maximum Length of Repeated Subarray near-transfer. They are guardrails for this prototype, not a general algorithm verifier.

## Run deterministic regression tests

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-a2-regression.ps1
```

This uses `npm.cmd` internally to avoid the common `npm.ps1` execution-policy error.

## Run a genuine model-backed replay

Restart the backend after setting either the OpenAI or SocLaaS environment variables, verify that `/api/health` reports `mode: "llm"`, then run in a second terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-a2-regression.ps1 -Live -Repeats 1
```

The live runner replays both recorded five-turn conversations plus two negative checks. It saves full results under `testing/smoke-regression/`. Model behavior is not guaranteed to pass; failures are retained as diagnostic evidence.

The expected five-turn progression is:

| Learner turn | Expected phase | Expected action |
|---|---|---|
| Original approach | `gap` | `CHALLENGE` |
| Shifted-offset limitation | `solution` | `PROBE` |
| Correct method | `abstraction` | `ASK_ABSTRACTION` |
| Reusable principle | `transfer` | `ASK_TRANSFER` |
| Integer-array application | `complete` | `COMPLETE` |

Do not overwrite the original exported transcripts; retain them as pre-fix failure evidence.
