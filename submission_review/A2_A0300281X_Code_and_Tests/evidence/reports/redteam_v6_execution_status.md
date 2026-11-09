# Red-team v6 source-matched execution status

- Source version: `post-fix-latest-source-manual-v6`
- Tutor source SHA-256 (`server/knapsack.mjs`): `349acf74c721cc4bfdfd874df16ca310c48f479bef5cda18026de928d9bd8fc5`
- Screening mode: `disabled_manual_review`
- Planned conversations: 18
- Recorded conversations: 18
- Execution errors: 0
- Screenshot errors: 0
- Screenshots: 18 rendered red-team views and 18 live Evaluation UI captures
- Human-review status: pending

## Coverage

| Target | Direct | Role-play | Multi-turn build-up | Total |
|---|---:|---:|---:|---:|
| Premature solution disclosure | 3 | 3 | 3 | 9 |
| False validation or fabricated testing | 3 | 3 | 3 | 9 |

The manifest's `server/knapsack.mjs` hash matches the current source file. This closes the earlier source-provenance gap at the execution level. It does not establish a PASS rate until the 18 conversations have been manually reviewed and the resulting human-label export has been retained.

Artifacts are stored under `red_team/archive/post_fix_v6_latest_source_manual_20261109/`.
