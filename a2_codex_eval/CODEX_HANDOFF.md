# Codex execution handoff — CS3249 A2 AlgoCoach

You are operating on the user's **own** AlgoCoach project in its local working directory. We must submit a PDF report (≤3000 core words, excluding references/appendix) and a code/tests ZIP. The course rubric is in `Assignment 2_  Implement and Evaluate Your Learning CUI.pdf` or supplied in the chat. The installed `a2_codex_eval` package implements real-data collection, LLM judging, red-teaming, analysis, and screenshot capture. Read `a2_codex_eval/README.md` and the code before invoking it.

## Governing rules (non-negotiable)

1. Tutor turns must come from the **actually running CUI**; never synthesize tutor messages, invent failures, invent judge verdicts, or fake screenshots/results.
2. The student must **personally label 20 conversations × 2 criteria**, and personally inspect all red-team transcripts. Do not auto-fill human labels. Your other work may proceed autonomously; pause only for these necessary student steps.
3. Save all source conversations (including incomplete/failed), all attempted red-team runs, model request diagnostics and actual failures. Keep before and after data separate.
4. Do not expose or commit API keys, personally identifying data, or private prompts. Do not delete prior versions, historical failure cases or `ai_logs/`.
5. Screenshots must be taken from genuine test records and preferably the running AlgoCoach **Evaluation** tab using Playwright. Use `capture.py --require-ui`; if unavailable, report the blocker. Keep captions and provenance. Secondary HTML evidence screenshots must be described as such, not as the unmodified chat UI.
6. Do not claim that an absence of detected violations proves safety, nor that stage completion demonstrates learner mastery.

## Stage A — Codex autonomous data collection

- Confirm repository branch and commit; create a separate git branch or back up changes before modifying code. Verify the Knapsack module and `testing/generate_conversations.mjs` exist.
- Start (or reuse) backend `npm.cmd run server` on 3001, frontend `npm.cmd run dev` on 5173, with model API credentials set via environment. Verify `/api/health` says `mode: llm` and actual tutor messages use LLM/policy templates, not error fallbacks.
- Install evaluation prompts: `python a2_codex_eval/run.py install`.
- Run offline package tests: `python -m unittest discover -s a2_codex_eval/tests -v`. Run existing `npm.cmd run test:a2`, `npm.cmd run build`; note any failures.
- Run `python a2_codex_eval/run.py prepare` (15 final Knapsack, 5 baseline substring candidates selected from a larger genuine pool; 3 prior Knapsack pilots and 2 historical failures are available as authentic seeds). It launches its own baseline backend on 3002 and writes `llm_judge/a2_selected_20.json`.
- Run `python a2_codex_eval/quality_audit.py` and inspect all 20 selected cases and especially the 5 earlier-version cases, *without* treating the `expected_failure_candidate` tag as a true failure. Select alternatives from baseline pool if clearly required. Every criterion must apply in every case. Verify genuine multi-turn source provenance and persona diversity. Include at least five genuinely failing baseline cases **confirmed by the student's later independent labels**.
- Red-team the current Knapsack tutor with `python a2_codex_eval/run.py redteam --round before --repeats 3 --capture-live`. This must yield 18 separately recorded runs (2 targets × 3 attack styles × 3 repetitions); model judge checks tutor replies individually and stops the attempt at a suspected failure. Check every result yourself and flag ambiguous cases, but do not pretend that this replaces the student's human check.
- While frontend is running, capture every attempt `python a2_codex_eval/capture.py redteam --round before --require-ui`. Save genuine UI screenshots plus readable transcript-evidence screenshots and one-line caption index.
- Prepare an easy human-review handoff: import `llm_judge/a2_selected_20.json` into the existing Evaluation tab and ask the student to manually label 40 cells and export `llm_judge/human_labels.json`; also ask them to review every red-team transcript using the Evaluation tab and export its manual labels. **Pause until the user has done these actions.**

## Stage B — Codex continues after the student's labels

- Verify `llm_judge/human_labels.json` is complete and five baseline cases actually FAIL at least one criterion; do not proceed by adding fake labels. If not, explain how to replace cases and rerun human review.
- Run `python a2_codex_eval/run.py judge --version a2_v1`. Inspect every disagreement in `a2_evidence/reports/disagreements_a2_v1.md` against the full visible transcript.
- Create revised prompts `llm_judge/prompts/a2_v2/{reasoning_alignment,evidence_gating}.md`. The revision must remain single-criterion with explicit PASS/FAIL; cite which observed disagreements motivated the changes. Keep `llm_judge/prompts/a2_v1/` unchanged and document rationale in `llm_judge/prompts/a2_v2/revision_memo.md`. Do NOT tweak human labels to raise kappa.
- Run `python a2_codex_eval/run.py judge --version a2_v2`. Calculate and verify pair counts (20 per criterion), percentage agreement, Cohen's kappa (null if undefined), and final-system pass rates. Explain if fewer than 20 fully applicable cases or no disagreements; do not overclaim improvement if the metric falls.
- Run `python a2_codex_eval/run.py redteam-results` after receiving the student-reviewed `red_team/human_labels.json`; it verifies counts and required retests. For each **confirmed red-team FAIL**, implement a targeted guardrail or prompt revision in the actual tutor, add a unit/regression test, and rerun **all three attack types ×3** for that target using `python a2_codex_eval/run.py redteam --round after --target TARGET --repeats 3 --version post-fix-COMMIT`. Preserve before and after original transcripts and code diff. If no confirmed FAIL, no fictional fix or after-run is necessary.
- Capture `python a2_codex_eval/capture.py judge --version a2_v1 --require-ui`, then v2, `agreement`, and all after-fix red-team attempts. Keep screenshots with one-line captions in `a2_evidence/screenshots/appendix_screenshot_index.md`.
- Draft Step 1 implementation/changes/architecture using `docs/ARCHITECTURE_AND_IMPLEMENTATION.md`, Step 2 quantitative + qualitative results only from actual artifacts, Step 3 **user study design only** using `docs/USER_STUDY_DESIGN.md`. Include complete questionnaire, learning tasks and interview questions as appendix materials. The student's design rationale and interpretation remain their responsibility.
- Check final submission ZIP content includes `server`, `src`, `testing`, `tests`, `llm_judge` prompts + 20 conversations + manual and judge labels, `red_team` attacks/transcripts, `ai_logs` full assistant exports/links, README, screenshots. Never include secrets. Follow the rubric filename convention using the student's ID without guessing it.

## Minimal commands

```powershell
# From the AlgoCoach repository root, with backend/frontend running:
python .\a2_codex_eval\run.py install
python -m unittest discover -s .\a2_codex_eval\tests -v
python .\a2_codex_eval\run.py prepare
python .\a2_codex_eval\run.py redteam --round before --repeats 3 --capture-live
python .\a2_codex_eval\quality_audit.py
python .\a2_codex_eval\capture.py redteam --round before --require-ui
# ==== Required human review checkpoint ====
python .\a2_codex_eval\run.py judge --version a2_v1
# Codex inspect disagreements, revise and save a2_v2 prompt and revision memo
python .\a2_codex_eval\run.py judge --version a2_v2
# If confirmed failures, fix and retest same target 3x each attack
python .\a2_codex_eval\capture.py all --require-ui
```

If the automated scripts cannot run, diagnose and fix in the evaluation harness rather than silently claiming success. Preserve true errors and the source event log. This is a deadline-sensitive assessment: prioritise reproducible evidence, manual judgment integrity, clear limitations and submission completeness over new tutoring features.
