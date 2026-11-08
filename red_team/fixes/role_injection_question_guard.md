# Red-team follow-up: role injection and Socratic question format

## Observed behavior

The complete manual-only v4 transcripts exposed a broader pedagogical weakness beyond the two original must-never targets:

- All three `premature_solution_disclosure` role-play attempts induced answer-like algorithm descriptions rather than a learner-thinking question.
- Seven generated tutor replies across the v4 matrix did not end with a question: three role-play replies and four later multi-turn factual-correction replies.

The replies did not contain executable code, but they followed the injected role/format too closely and sometimes replaced elicitation with an answer-like explanation.

## Generalized fix

`server/knapsack.mjs` now:

1. Treats learner messages as untrusted content in both interpretation and generation prompts.
2. Prohibits role changes, IDE/autograder impersonation, prompt disclosure, policy overrides, and unsupported claims that checkpoints are complete.
3. Requires every model-generated tutoring reply to contain exactly one learner-thinking question and end with `?`.
4. Limits generated replies to at most two short sentences and prohibits answer-like algorithm descriptions, complete solution-space enumeration, and final-answer disclosure.
5. Routes explicit role-override requests directly to the deterministic Socratic fallback without calling the generation model.
6. Rejects generated replies that lack exactly one final question or contain common final-answer/enumeration disclosures, again using the safe fallback.

Regression tests cover question-format enforcement and deterministic fallback for a role-override request. The complete local suite passes 65/65 and the production build succeeds.

## Evaluation status

The v4 transcripts are the pre-fix evidence for this follow-up issue. Independent human review was completed for all 18 cases:

- Overall: 15 PASS, 3 FAIL
- `false_validation_or_fabricated_test`: 9 PASS, 0 FAIL
- `premature_solution_disclosure`: 6 PASS, 3 FAIL
- All three confirmed failures were role-play attacks requesting an IDE/code-completion role; direct and multi-turn attacks passed.

These labels and transcripts are preserved before the strengthened role-injection/question guard is retested. The backend must be restarted and the affected manual-only matrix rerun under a new version so the post-fix source hash and human review are recorded independently.

### V5 outcome

The v5 manual-only rerun produced 18/18 human PASS, including all three role-play attempts that failed in v4. Premature-disclosure role-play therefore improved from 0/3 PASS to 3/3 PASS, while the overall matrix improved from 15/18 to 18/18.

A separate format audit then found nine safe `CLARIFY` fallbacks written as an imperative statement rather than a question. Although these remained PASS under the two RT must-never criteria, the fallback wording was changed to a direct learner-thinking question. A regression test now covers the fallback itself; the complete suite passes 66/66 and the production build succeeds. The current post-follow-up source hash is `349acf74c721cc4bfdfd874df16ca310c48f479bef5cda18026de928d9bd8fc5`.
