# AlgoCoach Assignment 2 - 0/1 Knapsack Learning CUI

This submission contains the working AlgoCoach learning CUI, its prompts and configuration, automated tests, the 20-conversation LLM-judge evaluation, and the complete red-team evidence retained across fixes.

The evaluated core interaction is 0/1 Knapsack. The original Assignment 1 scripted demonstration and Longest Common Substring regression fixtures remain in the repository but are not used as the Assignment 2 evaluation corpus.

## Requirements

- Node.js 18 or newer
- npm
- Python 3.10 or newer for the evaluation helper scripts
- An OpenAI-compatible API key or SoCLaaS API key for model-backed collection or judging

No API key or password is included in this submission.

## Install and run

From this directory:

```powershell
npm install
```

Set one backend-only credential in the terminal that will run the server:

```powershell
$env:OPENAI_API_KEY = "YOUR_KEY"
# Optional: $env:OPENAI_MODEL = "gpt-4o-mini"
```

Alternatively, use SoCLaaS:

```powershell
$env:SOCLAAS_API_KEY = "YOUR_KEY"
$env:SOCLAAS_MODEL = "YOUR_CHAT_MODEL_ID"
```

Start two terminals:

```powershell
# Terminal 1
npm.cmd run server

# Terminal 2
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`. The backend runs at `http://127.0.0.1:3001/`.

The interface provides:

- **Live Tutor** - the running evidence-gated Knapsack CUI;
- **Evaluation** - transcript import, independent human labelling, and judge-result review;
- **Session Replay** - a frontend reconstruction of saved execution data;
- **A1 Demo** - the earlier scripted prototype, which is not valid Assignment 2 test evidence.

If no API key is configured, the backend uses a conservative rule fallback. Rule-fallback sessions must not be reported as model-backed evaluation conversations.

## Models, APIs, and services

- The tutor and simulated learner use an OpenAI-compatible chat-completions provider through `server/provider.mjs`.
- The default OpenAI-compatible model is `gpt-4o-mini` unless overridden by environment configuration.
- SoCLaaS is supported through `SOCLAAS_API_KEY` and `SOCLAAS_MODEL`.
- The React/Vite frontend communicates only with the local Node backend; secrets are never placed in frontend variables.

## Main components

| Component | Location |
|---|---|
| Live tutoring UI | `src/LiveCoach.tsx` |
| Manual evaluation UI | `src/EvaluationPanel.tsx` |
| Recorded-session replay | `src/ReplayCoach.tsx` |
| HTTP session API | `server/index.mjs` |
| Knapsack policy, prompts, and output guards | `server/knapsack.mjs` |
| Shared evidence-gated controller | `server/engine.mjs` |
| Model interpretation and generation | `server/models.mjs` |
| Provider configuration | `server/provider.mjs` |
| Simulated learner collection | `testing/generate_conversations.mjs` |
| LLM judge runner | `testing/run_judge.mjs` |
| Agreement calculation | `testing/agreement.mjs` |
| Red-team runner | `a2_codex_eval/run.py` |

## System architecture diagram

The illustrated frontend, backend, tutoring-engine, session-store, guardrail, and model interaction flow is provided in [System Design Overview Infographic.png](<docs/System Design Overview Infographic.png>).

## Tests

These tests require no API key:

```powershell
npm.cmd run test:a2
npm.cmd run build
python -m unittest a2_codex_eval.tests.test_package
```

The latest verified local run passed 66/66 Node tests, six evaluation-package tests, and the production build.

## Evaluation artifacts

- `llm_judge/` contains the selected 20 conversations, eight learner personas, the simulated-learner prompt/script, all judge-prompt versions, human labels, judge verdicts, agreement calculations, and disagreement records.
- `red_team/` contains attack definitions, PASS/FAIL rules, the initial 18-run matrix, every retained after-fix run, clean per-round human-label exports, fix notes, and result summaries.
- `evidence/` contains report tables and screenshot evidence. HTML renderer intermediates are intentionally excluded.
- `ai_logs/` contains the approved AI-assistance disclosure and its supporting collated interaction record.

## Red-team provenance note

The human-reviewed v5 matrix achieved 18/18 PASS for the two defined must-never targets. After the later clarification fallback was rephrased as a learner-thinking question, the complete 18-case matrix was run again as `post-fix-latest-source-manual-v6`. The v6 manifest matches the submitted `server/knapsack.mjs` hash and records 18/18 completed conversations with zero execution or screenshot errors. Automated screening was disabled, so v6 human verdicts remain pending and no v6 PASS rate is claimed. The v5 result remains the latest fully human-labelled result.

## Submission status

This directory is the final code-and-tests submission folder for student `A0300281X`. It contains the required source, prompts, configuration, evaluation artifacts, red-team evidence, screenshots, documentation, and approved AI-assistance logs. Archive this directory as `A2_A0300281X_Code_and_Tests.zip` without adding parent review folders, dependencies, API keys, or temporary build output.
