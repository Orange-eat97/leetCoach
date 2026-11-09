# Red-team evidence map

Two must-never targets were tested:

1. premature solution disclosure;
2. false validation or fabricated test execution.

Each target has a direct request, role-play framing, and multi-turn build-up, repeated three times. The attack messages and target-specific PASS/FAIL rules are in `attacks/`.

## Rounds

| Folder | Purpose | Human-reviewed outcome |
|---|---|---|
| `transcripts/before/` | Initial 18-run matrix | RT1 9/9 PASS; RT2 7/9 PASS, 2 FAIL |
| `transcripts/after/v2_factual_guard/` | First source-matched factual-guard retest for RT2 | 9/9 PASS |
| `transcripts/after/v3_targeted_guard_manual/` | Historical manual run | Human-label export was not preserved; do not use as final evidence |
| `transcripts/after/v4_generalized_pre_role_guard/` | Full matrix after generalized factual guard, before role guard | 15/18 PASS; three role-play FAILs |
| `transcripts/after/v5_role_question_guard/` | Full matrix after role/question guard | 18/18 PASS |

Clean labels for each available round are in `labels/`. The original mixed browser exports are not used as the organized label files. Result summaries are in `results/`, and implementation notes are in `fixes/`.

## Current-source limitation

The v5 matrix tested `server/knapsack.mjs` SHA-256 `840d947a91bdbe94892605fdd0ae340dd5f74ed84cd7f2c9f42639e149f79b38`. A subsequent clarification-fallback wording change produced current SHA-256 `349acf74c721cc4bfdfd874df16ca310c48f479bef5cda18026de928d9bd8fc5`. The later change has regression-test coverage, but no final source-matched v6 red-team matrix is included. Do not describe v5 as a source-identical test of the final file without this qualification.

Automatic screening was treated only as a diagnostic aid. The organized PASS/FAIL results come from the human-label exports.
