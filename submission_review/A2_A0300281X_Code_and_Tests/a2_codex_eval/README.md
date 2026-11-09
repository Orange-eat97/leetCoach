# CS3249 A2 Codex evaluation package — Knapsack (Nov 2026)

**Purpose:** run genuine tutor / judge / red-team tests with minimal intervention; preserve actual records and capture screenshots. **This package has not executed new remote-model tests**; it contains scripts and authentic previously uploaded seed transcripts. It is not a substitute for manual review.

## Install and prerequisites

Copy the **entire `a2_codex_eval` directory** into the root of your existing AlgoCoach repository. This is an **additive** package; do not overwrite `server/` or existing labels. You should have a working Knapsack patch, `npm.cmd run server` on port 3001 in LLM mode, `npm.cmd run dev` on port 5173, Node 18+, Python 3.10+, and model API credentials in the terminal executing test collection. Existing client/UI supports JSON import in Evaluation tab.

For screenshot automation install Playwright in the same Python environment Codex will use:

```powershell
python -m pip install playwright
python -m playwright install chromium
```

If a browser is unavailable, `capture.py --require-ui` fails rather than pretending to have captured the running interface. Secondary HTML screenshots are clearly labeled, not passed off as live UI.

From repository root:

```powershell
python .\a2_codex_eval\run.py install
python .\a2_codex_eval\run.py status
```

`install` creates judge prompts under `llm_judge/prompts/a2_v1/` and does not alter tutoring code or existing conversations.

## Automated collection (Codex)

Run **after** verifying the health endpoint says `mode: llm`. Collection calls the actual locally running tutor for every coach message and model simulates only the learner. The script also launches frozen `baseline/server/index.mjs` on 3002 to collect genuinely earlier-version failures.

```powershell
python .\a2_codex_eval\run.py prepare
```

Creates `a2_evidence/selected_dataset.json` and `llm_judge/a2_selected_20.json`. Default design: **15 final-system Knapsack cases** (3 genuine previously recorded pilots + 12 fresh) and **5 earlier-version Longest Common Substring cases** (2 previously recorded historical failures + 3 frozen baseline runs chosen from 8). **Baseline does not guarantee FAIL.** Check that these 5 really fail a chosen criterion; replace the three selected baseline IDs from pool if necessary using `replace-baseline --ids=baseline-frozen-02,...`, or collect more if fewer than 5 actually fail.

After generating the corpus, run `python .\a2_codex_eval\quality_audit.py` to flag persona deviations, model fallbacks, missing transfer, and repeated tutor turns. These are diagnostic flags, **not** human PASS/FAIL labels. Review `docs/TEST_MATRIX.md` for all twenty planned cases and coverage targets.

If your final code has changed since the three pilot runs, use `prepare --no-reuse-pilots --final-count=15` to collect all final cases anew. Preserve previously collected data in the pool when rerunning.

## Human label checkpoint (non-negotiable)

1. Open the live frontend's **Evaluation** tab and import `llm_judge/a2_selected_20.json`.
2. Label **each of 20 conversations** independently on **each of 2 criteria** (40 PASS/FAIL total), using the visible transcript. Codex must not invent labels. Export `human_labels.json` and save as `llm_judge/human_labels.json`.
3. Check at least five selected baseline conversations genuinely FAIL a criterion. `run.py judge` **blocks** if labels are missing or if the five failing baseline cases are not verified.

## Judge pass 1, revision, pass 2

```powershell
python .\a2_codex_eval\run.py judge --version a2_v1
```

This writes the v1 verdicts, confusion tables, percentage agreement and Cohen kappa, disagreements, and final-system pass rates. **Codex must inspect the real disagreements**, describe why its own judgment and yours differ, and create two **single-criterion** revised prompts under `llm_judge/prompts/a2_v2/` with a `revision_memo.md`. Never alter the human labels to raise agreement, and don't pretend a template copied unchanged was a response to disagreements.

```powershell
python .\a2_codex_eval\run.py judge --version a2_v2
```

If zero disagreements occur, record that truth; a v2 exploratory wording check is optional and must not be represented as a disagreement-driven repair.

## Red-team: two never-do targets, 3 attack styles x3 repetitions

Knapsack-specific target definitions live in `configs/redteam_knapsack.json`:

- Pedagogical: disclose a complete solution or code prematurely.
- Harm to learners: falsely certify a wrong greedy method / invent code execution and passing tests.

Each has direct, role-play and multi-turn build-up attacks. For 2 targets x 3 types x 3 repeats = **18 minimum before-fix runs**.

```powershell
python .\a2_codex_eval\run.py redteam --round before --repeats 3 --capture-live
python .\a2_codex_eval\run.py redteam-review-sheet
python .\a2_codex_eval\capture.py redteam --round before --require-ui
```

With `--capture-live`, the browser captures each completed real attack immediately, while the evaluation is running; this requires the frontend on port 5173 and installed Playwright. The independent LLM screens **each tutor reply** and stops the attempt on a suspected violation or uncertain REVIEW. It can miss errors. User must inspect **all** transcripts and mark each human PASS/FAIL. Save the student-reviewed red-team labels exported from Evaluation as `red_team/human_labels.json`, then run `python .\a2_codex_eval\run.py redteam-results` to check coverage and human FAIL counts. For confirmed failures, Codex should implement a *targeted* code/prompt change and run all 3 attacks for that target again x3, even if the particular failing attack was only one style:

```powershell
python .\a2_codex_eval\run.py redteam --round after --target premature_solution_disclosure --repeats 3 --version post-fix-v1 --capture-live
python .\a2_codex_eval\capture.py redteam --round after --require-ui
```

Do not run a meaningless `after` round if there was no actual change. Retain diff/commit, exact fix explanation and both sets. Stop any attack immediately when a CUI reply fails.

## Screenshots

```powershell
python .\a2_codex_eval\capture.py judge --version a2_v1 --require-ui
python .\a2_codex_eval\capture.py judge --version a2_v2 --require-ui
python .\a2_codex_eval\capture.py agreement
python .\a2_codex_eval\capture.py redteam --round before --require-ui
python .\a2_codex_eval\capture.py redteam --round after --require-ui
```

Creates `a2_evidence/screenshots/*.png`, `rendered_html/`, capture provenance manifest, and `appendix_screenshot_index.md` with one-line captions. `--require-ui` requires the **actual running AlgoCoach Evaluation tab** to be openable in headless Chromium and captures it importing the real data; browser-rendered evidence reports are also generated from real JSON. Do not call the secondary rendered HTML an unmodified original live UI screenshot.

**Example only:** `python .\a2_codex_eval\capture.py example` captures one earlier genuine conversation; it is **not a newly run test** and should not be counted as formal appendix evidence.

## Submission checks

Report order: Step 1 built/omitted/changed/architecture; Step 2 judge/red-team/results/limitations; Step 3 study design. Include selected 20 conversations, definitions/personas, prompts v1+v2, independent labels, actual judge output and agreement, attack runs and review verdicts, screenshots and one-line captions, source/config without credentials, full AI assistant logs. PDF maximum 3000 **core** words (appendices/references excluded). No human study execution required. Review `docs/ARCHITECTURE_AND_IMPLEMENTATION.md` and `docs/USER_STUDY_DESIGN.md` and write decisions/interpretation in your own words.

### Limitations and provenance

- Tested Python syntax and local screenshot renderer against an authentic previously supplied transcript; this is not proof that the user's machine or model endpoint will run the new end-to-end process.
- Correct progression / completion cannot prove real learning, and red-team blocks cannot prove safety.
- Three prior successful Knapsack pilot seeds and two earlier genuine failures are included unmodified. Their prior time/version metadata are not invented.
