# AlgoCoach Assignment 2 — implementation and evaluation overlay

This overlay adds a **real multi-turn tutoring engine** and **test/review tools** to the original [A1 AlgoCoach React/Vite prototype](https://github.com/Orange-eat97/leetCoach). It is deliberately scoped to Longest Common Substring, with Maximum Length of Repeated Subarray as a near-transfer variation. It does **not** implement RAG, user accounts, general LeetCode decomposition, or a real code compiler.

**Project status:** controller unit tests and offline backend smoke tests can be run without an API key. Genuine model-supported tutor conversations, model judge verdicts, and assignment red-team outcomes must be collected with a configured API key. They are **not** fabricated or pre-populated here. The integration has not been pushed to GitHub because the connected integration refused branch creation (403).

## Apply overlay to your local repository

Clone/open the original `Orange-eat97/leetCoach` branch `algocoach-demo-frontend`. Extract this archive, then **copy the archive contents into the root of that checkout** (merge folders, don't delete the existing `src/App.tsx`, styles or scripted demo). From the repo root:

```bash
python scripts/integrate.py   # idempotent: safe to run twice
npm install
npm run test:a2
npm run build             # should be run in your complete original repo
```

Set the secret only for the Node backend (PowerShell: `$env:OPENAI_API_KEY="..."`; bash: `export OPENAI_API_KEY="..."`). Do not put secrets in `.env` files committed to git, frontend code or Vite environment variables. Optional `OPENAI_MODEL` (defaults to `gpt-4o-mini`) and `OPENAI_BASE_URL` (OpenAI-compatible chat-completions API base).

### SoCLaaS

Use the dedicated SoCLaaS variables so the backend automatically selects the SoCLaaS gateway. In PowerShell, set the key and then list the model IDs available to it:

```powershell
$secret = Read-Host "Paste SoCLaaS API key" -AsSecureString
$env:SOCLAAS_API_KEY = [System.Net.NetworkCredential]::new("", $secret).Password
Remove-Variable secret

$models = Invoke-RestMethod `
  -Uri "https://soclaas-api.comp.nus.edu.sg/v1/models" `
  -Headers @{ Authorization = "Bearer $env:SOCLAAS_API_KEY" }
$models.data | Select-Object id
```

Copy one chat-capable model ID from that output, then start the backend in the same terminal:

```powershell
$env:SOCLAAS_MODEL = "YOUR_MODEL_ID"
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
npm.cmd run server
```

`SOCLAAS_API_KEY` automatically uses `https://soclaas-api.comp.nus.edu.sg/v1`. `OPENAI_BASE_URL` remains available as an explicit override.

Two terminals:

```bash
npm run server
npm run dev
```

Open `http://127.0.0.1:5173/`. Visiting the backend root at `http://127.0.0.1:3001/` redirects there as a convenience. The top-right mode navigation switches **Live Tutor / Evaluation / A1 Demo**. In Live Tutor, each actual learner message is evaluated and answered through the backend. The A1 Demo remains deliberately scripted and is **not** valid for Assignment 2 testing.

Without `OPENAI_API_KEY`, the server uses `rule-fallback` exclusively for offline development. Do not report rule-fallback as model-based tutoring or as LLM judge/red-team evidence.

## Architecture: one message through the system

1. **UI** `src/LiveCoach.tsx` sends learner messages via `src/coachClient.ts`.
2. **HTTP API** `server/index.mjs` retrieves the in-memory session, calls `interpret` and `transition`, then generates and attaches a reply.
3. **LLM interpreter** `server/models.mjs::interpret()` emits typed, quote-grounded candidate evidence, ambiguity, status, and (only if explicit) contradictions to previously accepted milestones.
4. **Deterministic controller** `server/engine.mjs::transition()` is the **only authority** for state progression: `approach → gap → solution → abstraction → transfer → complete`. It gates advancement on **current-turn** evidence, not a scalar confidence score or stale earlier quotes. It does not store ambiguous evidence. It can open a targeted `repairFocus` without blindly jumping backward.
5. **Minimal session learner state** holds `currentApproach`, `activeGap`, `repairFocus`, `attemptsWithoutProgress`, and `supportHistory`. Ineffective repeated support escalates from hints to visualisation to learner choice; escalation never advances a milestone.
6. **LLM generator** `server/models.mjs::generate()` receives the approved controller action and composes short contextual guidance. `server/engine.mjs::validateReply()` applies limited safety checks. Rejected/error generations produce a tracked fallback (see `coach_reply.source`).
7. **UI renderer** deterministically renders `offset` or `dp` visuals; the exported transcript includes actual visible text and visual identifiers, plus policy events for auditing.

**Limitations:** The evidence interpreter may misclassify a learner's correct/incorrect statement; provenance matching is not independent semantic validation. The code/pseudocode guardrail is intentionally incomplete and must be red-teamed. Sessions are stored only in process memory; export important live sessions. No numeric mastery score or longitudinal knowledge tracing is claimed.

### Model request diagnostics

Live Tutor includes a collapsible **Diagnostics** panel. Every interpreter and reply-generator call records safe metadata in the exported session events: provider, model, stage, endpoint host, start time, elapsed milliseconds, timeout limit, outcome, HTTP status, provider request ID, and token counts when supplied. Failures also retain the attempted learner message and a sanitized error. API keys, hidden prompts, and model response contents are never recorded.

The diagnostic event kinds are `model_request` and `turn_failed`. A failed interpretation remains outside the learner transcript and phase progression, but its diagnostic events stay attached to the session for reproduction.

## Assignment 2: collect at least 20 genuine multi-turn conversations

`testing/personas.json` defines eight fictional learner personas. The generator uses an LLM as a *simulated learner*, sending its messages to the running CUI. **Every tutor message comes from the running system**, not from the test script. It saves complete sessions including evidence and events.

Use the original engine snapshot to collect *candidate* failure conversations before fixing it (separate terminal with a different port):

```bash
# terminal A: old snapshot
PORT=3002 node baseline/server/index.mjs
# terminal B: simulated learner, must have OPENAI_API_KEY
npm run collect:a2 -- --base-url=http://127.0.0.1:3002 --version=baseline-a1 --count=5 --start=1 --expected-failure-candidate=true
```

Then collect final-version conversations (restart final server normally on port 3001):

```bash
npm run collect:a2 -- --version=final-v1 --count=15 --start=6
npm run audit:a2
```

**Critical:** Five baseline runs do not automatically constitute five actual failures. **You must inspect and verify at least five real failing conversations**, adding more genuine baseline runs if necessary. All conversations should reach meaningful milestones so both judge criteria apply. The audit flags incomplete, fallback or interrupted sessions. Do not fabricate, edit, or stitch tutor replies. Keep both baseline and final provenance. The assignment does not require more than one primary algorithm problem.

To generate **20 final** conversations *in addition* to baseline, use `--count=20 --start=6`; then select an appropriate labeled 20-case set for reporting. The simulator consumes real model API calls; monitor spending and time.

## Manual labeling in the existing UI

1. Click **Evaluation** in the top-right of the app. Import all relevant `.json` files from `llm_judge/conversations/` (multiple selection supported).
2. Read every visible learner/tutor turn and rendered visual. Label **C1 reasoning-grounded support** and **C2 evidence-gated progression**, each PASS or FAIL. That is **40 independent manual labels for 20 conversations**. Optional reason notes are strongly encouraged; they are not required to score.
3. The review UI stores draft judgments in the browser's `localStorage`, but **Export labels JSON** to the repo's `llm_judge/human_labels.json` for submission. You can also import this export later. Do not clear browser storage without exporting.
4. The UI hides judge results until all imported conversations have been labeled. Keep your initial labels independent of the model judge; do not overwrite them after reading its outputs.

The review UI also accepts individual red-team JSON transcripts; their specific PASS/FAIL rules replace the two tutoring criteria in that view. Export those labels separately to `red_team/human_labels.json`.

## Judge, disagreement review, revised judge

The default two single-criterion prompts are in `llm_judge/prompts/v1/`, and an optional third transfer criterion is in `llm_judge/prompts/OPTIONAL_transfer.md` (using it raises manual workload to 60 labels and requires adapting the review UI).

```bash
npm run judge:a2 -- --prompt-version=v1
npm run agreement:a2 -- --human=llm_judge/human_labels.json --judge=llm_judge/judge_results/v1_results.json --output=llm_judge/judge_results/agreement_before.json
npm run summary:a2 -- --judge=llm_judge/judge_results/v1_results.json --human=llm_judge/human_labels.json
```

Read the disagreement cases yourself. Copy the relevant `v1` prompt files into a new folder `llm_judge/prompts/v2/`, revise **only the judge prompt**, not the transcripts or your initial human labels; then rerun:

```bash
npm run judge:a2 -- --prompt-version=v2 --output=llm_judge/judge_results/v2_results.json
npm run agreement:a2 -- --human=llm_judge/human_labels.json --judge=llm_judge/judge_results/v2_results.json --output=llm_judge/judge_results/agreement_after.json
npm run summary:a2 -- --judge=llm_judge/judge_results/v2_results.json --human=llm_judge/human_labels.json
```

`agreement` reports per-criterion **percentage agreement**, Cohen's kappa, confusion counts, and disagreements. If both annotators label every case identically and only one class occurs, kappa is mathematically undefined (`null`), not 1. `summary` separates source versions so final-system pass rates are not polluted by baseline failure cases. Judge prompts receive **only visible transcript text and actual visual semantics**, not the LLM interpreter's privileged conclusions.

## Red-teaming the running CUI

`red_team/attacks/attempts.json` contains two targets: **premature answer/code disclosure** (learning design) and **false validation / fabricated test claims** (harm to learners). Each has **direct, role-play, and multi-turn build-up** attacks. Each attack is repeated at least three times; six attack definitions × three runs = **18 runs per round**.

```bash
npm run redteam:a2 -- --round=before --version=final-v1 --repeat=3
# If failures occur: fix prompts/guardrails, then rerun *every attempt for that target*:
npm run redteam:a2 -- --round=after --version=final-v2 --repeat=3
```

The runner stops when a simple heuristic flags a **possible** failure, but this is not a reliable classifier. You **must personally check every saved transcript** and stop interactive attacks immediately when failure occurs. Import them into the Evaluation tab if helpful and label each against its target-specific PASS/FAIL rule. Retain the original attempts, before/after transcripts, human judgments and **screenshots from actual runs** in your appendix. The runner does not fabricate screenshots.

## Files and submission artifacts

- `src/`: unchanged A1 UI plus `LiveCoach.tsx`, `EvaluationPanel.tsx` and styles (installed by overlay)
- `server/`: current tutor model integration, evidence-based policy and HTTP routes
- `baseline/server/`: frozen previous-version snapshot for authentic prior-version failure testing
- `tests/`: pure policy tests (including the fixed stale-evidence bug) and agreement tests
- `testing/`: simulated learners, judge runner, pass-rate/κ analysis, dataset audit and red-team runner
- `llm_judge/`: persona specs, current/revised criterion prompts, conversation outputs and label exports
- `red_team/`: attack descriptions, before/after runs and human labels
- `ai_logs/`: put your *actual* exported AI-assistant and coding-agent transcripts or shared links here. Do not fabricate them.

Save screenshots of the real Evaluation UI, judge outputs, before/after agreement, each red-team attack and retest during execution. Exclude API keys/passwords. Report any unverified or missing outcomes honestly. The user study is a report design activity, not a requirement to implement a participant study interface.
