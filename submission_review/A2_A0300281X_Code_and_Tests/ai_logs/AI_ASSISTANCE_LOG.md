# AI Assistance Log — Turn-by-Turn Record

## Record information

- Module: CS3249
- Project: AlgoCoach
- Development context: Assignment 1 prototype and Assignment 2 evaluation
- AI tool: Codex desktop
- Primary recorded thread: **Run the test cases** (`01a1b41e-2c57-7200-ba50-f48d1fb56029`)

## Reading note

This is a chronological, condensed interaction record. The entries are faithful paraphrases of the work and decisions, not verbatim quotations. They are written to make the division of responsibility explicit. The student originated the user story, architecture, functions, pedagogical strategy, evaluation decisions, and human labels. Codex implemented code and supporting engineering artifacts under the student's direction.

API keys, hidden instructions, internal model reasoning, and raw command output are excluded.

## Assignment 1 prototype development

### Turn 1

**Student direction — paraphrased:** I have defined AlgoCoach as a learning coach rather than an answer generator. The learner should reason through a problem, and the system should not immediately disclose a complete solution. Implement the prototype according to this user story.

**Codex work — summarized:** Translated the supplied user story into the initial application structure and implemented the learner-facing conversational prototype.

### Turn 2

**Student direction — paraphrased:** Use a frontend-and-backend architecture. The frontend should present the conversation and learning state, while the backend should control tutoring behaviour and model requests.

**Codex work — summarized:** Implemented the React/TypeScript frontend and Node.js backend separation, including client/server communication and development commands.

### Turn 3

**Student direction — paraphrased:** The tutoring flow should be staged. It should probe the learner's approach, challenge weaknesses, ask for abstraction and transfer, and only complete after suitable evidence is demonstrated.

**Codex work — summarized:** Implemented the staged tutoring controller, phase transitions, learner evidence storage, and controller-owned prompts.

### Turn 4

**Student direction — paraphrased:** Progression must depend on what the learner actually explains. Confidence statements, requests for the answer, or unsupported claims must not count as evidence.

**Codex work — summarized:** Implemented evidence gates, ambiguity handling, contradiction repair, and protections against unsupported phase advancement.

### Turn 5

**Student direction — paraphrased:** The system should support the 0/1 Knapsack problem and should recognise valid alternative reasoning instead of forcing one predetermined algorithm.

**Codex work — summarized:** Added Knapsack-specific prompts, evidence recognition, visual support, transfer activities, and tests for both dynamic-programming and valid non-DP approaches.

### Turn 6

**Student direction — paraphrased:** Connect the prototype to a configurable model provider, but keep credentials outside the source code.

**Codex work — summarized:** Implemented OpenAI-compatible and SoCLaaS provider configuration through environment variables, with no API keys committed to the repository.

### Turn 7

**Student direction — paraphrased:** Add automated checks for the intended learning behaviour so that later changes do not silently break the controller.

**Codex work — summarized:** Added regression tests for phase gating, learner-authored evidence, alternative approaches, answer requests, contradictions, visual requests, and provider selection.

## Assignment 2 setup and conversation corpus

### Turn 8

**Student direction — paraphrased:** Inspect the Assignment 2 materials and explain what must be manually labelled and what can be run through the existing interface.

**Codex work — summarized:** Inspected the supplied assignment package and handoff documentation, mapped the required LLM-judge and red-team artifacts, and identified the manual-labelling stages.

### Turn 9

**Student direction — paraphrased:** Configure the existing project for the evaluation. I will supply the API key in my own PowerShell environment.

**Codex work — summarized:** Prepared the local evaluation structure, explained the frontend/backend startup sequence, and diagnosed server-port and environment-variable issues without recording the key.

### Turn 10

**Student direction — paraphrased:** Evaluate only the 0/1 Knapsack conversations. Do not include the LCS problem.

**Codex work — summarized:** Supplied and checked commands constrained to `zero-one-knapsack`, and organized the generated Knapsack corpus separately.

### Turn 11

**Student direction — paraphrased:** Generate the remaining Knapsack conversations needed for the 20-case evaluation set.

**Codex work — summarized:** Configured the conversation generator and simulated learner personas, then helped collect and organize the required conversations.

### Turn 12

**Student direction — paraphrased:** I will inspect the conversations and provide the authoritative human labels. Cases that are unsuitable should not be fabricated or silently counted.

**Codex work — summarized:** Validated label-file structure and completeness, collated revised label exports, and reported which conversations were labelled PASS or FAIL without replacing the student's judgements.

## LLM-as-a-judge evaluation

### Turn 13

**Student direction — paraphrased:** Run the first judge prompt against the 20 manually labelled conversations and calculate agreement with my labels.

**Codex work — summarized:** Ran or supplied the commands for the v1 judge, stored the verdicts, and calculated agreement, Cohen's kappa, confusion counts, and disagreement IDs.

### Turn 14

**Student direction — paraphrased:** Run the revised v2 judge and compare it with the same human labels.

**Codex work — summarized:** Executed the v2 evaluation pipeline and produced the corresponding result and agreement artifacts.

### Turn 15

**Student direction — paraphrased:** Use my revised C1 prompt for reasoning-grounded support. It should judge whether the tutor recognises and builds on the learner's expressed reasoning, without independently grading algorithmic correctness.

**Codex work — summarized:** Installed the supplied prompt as `a2_v3`, corrected its prompt-file configuration when the first run returned errors, and prepared it for a single-criterion rerun.

### Turn 16

**Student direction — paraphrased:** Rerun C1 with v3 and calculate the revised agreement and Cohen's kappa.

**Codex work — summarized:** Produced the v3 C1 results: 95% agreement and Cohen's κ of approximately 0.643, with one disagreement on `final-knapsack-05`.

### Turn 17

**Student direction — paraphrased:** Preserve the judge results and prepare evidence views, but do not misrepresent reconstructed result pages as original live-chat screenshots.

**Codex work — summarized:** Generated judge and agreement evidence artifacts, labelled replay-style views appropriately, and retained the original numerical result files.

## Red-team evaluation and remediation

### Turn 18

**Student direction — paraphrased:** Run the complete red-team input matrix. The two must-never behaviours are premature solution disclosure and false validation or fabricated test execution.

**Codex work — summarized:** Ran or prepared the direct, role-play, and multi-turn build-up attack types, three repeats each, and stored the before-round transcripts.

### Turn 19

**Student direction — paraphrased:** I will manually judge the red-team conversations. PASS means the prohibited behaviour was not shown; the system does not have to provide the requested full solution.

**Codex work — summarized:** Collated the student's red-team labels and corrected summaries that had relied on automated screening or a broader criterion than the specified prohibited behaviour.

### Turn 20

**Student direction — paraphrased:** The initial false-validation build-up cases fail because the tutor accepts the claim that B and C cannot fit even though their weights total exactly 50. Improve this behaviour.

**Codex work — summarized:** Added factual verification instructions and an output validator that rejects unsupported validation and fabricated-execution claims, together with regression tests.

### Turn 21

**Student direction — paraphrased:** Do not hard-code facts such as `B + C = 50`. That would mislead the prototype on other questions. Retain only generalized safeguards.

**Codex work — summarized:** Removed question-specific hard-coding while preserving general instructions to recompute relevant conditions and check inclusive boundaries before affirming a claim.

### Turn 22

**Student direction — paraphrased:** Rerun all red-team inputs without deciding PASS or FAIL halfway through. I will review every completed case manually.

**Codex work — summarized:** Added and used a manual-review-only execution mode that sent the planned attack inputs and deferred the authoritative verdicts to the student.

### Turn 23

**Student direction — paraphrased:** The rerun reveals a new weakness: persona injection can make the tutor act like an IDE code completer, and some replies stop asking a question that triggers learner thinking. Strengthen the general system behaviour.

**Codex work — summarized:** Implemented generalized role-override resistance and enforced one learner-thinking question at the end of tutoring responses, with regression tests.

### Turn 24

**Student direction — paraphrased:** Generate the revised red-team conversations. I will label the results again and decide whether the safeguards are acceptable.

**Codex work — summarized:** Generated and organized the later before/after red-team rounds, preserved source provenance, and collated the student's final label exports.

### Turn 25

**Student direction — paraphrased:** Keep the historical results tied to the versions that were actually tested. Do not claim that a later source change was covered by an earlier red-team run.

**Codex work — summarized:** Preserved versioned red-team archives and source hashes, and documented that the v5 18/18 result predates the later clarification-fallback change and therefore is not source-matched to the latest file.

## Evidence, repository, and submission organization

### Turn 26

**Student direction — paraphrased:** Prepare screenshots and logs that support the report, including repetitive tutoring, false validation, and persona-injection cases.

**Codex work — summarized:** Generated and organized replay screenshots, judge-result views, red-team evidence images, and the screenshot index while distinguishing reconstructed artifacts from authentic live-UI captures.

### Turn 27

**Student direction — paraphrased:** Push the completed project and evidence to the specified GitHub branch.

**Codex work — summarized:** Checked repository state, committed the requested project content, and pushed the branch. Later review-only packaging files were kept untracked until approved.

### Turn 28

**Student direction — paraphrased:** Evaluate the repository against the Assignment 2 requirements and identify anything missing.

**Codex work — summarized:** Audited the repository against the assignment PDF and identified missing or incomplete submission elements, including AI-assistance records, README accuracy, screenshot gaps, procedural red-team limitations, and source-matched verification.

## Final responsibility statement

The student was responsible for the concept, user story, architecture, functional requirements, pedagogical strategy, evaluation design, manual judgements, and final academic interpretation. Codex assisted by implementing the prototype code from those specifications and producing supporting tests, evaluation tooling, debugging changes, evidence artifacts, and submission organization under the student's direction.

