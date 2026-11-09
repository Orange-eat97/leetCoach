# Package verification — performed 7 November 2026

- `python -m unittest discover -s tests -v`: **6/6 passing**. Tests include authentic seed schema checks (3 model-backed Knapsack pilots + 2 earlier genuine failed runs), 18-attack matrix checks, no unescaped HTML injection in screenshots, independent human-label gating, and fallback transcript rejection.
- `python -m py_compile run.py capture.py quality_audit.py`: passing.
- `run.py install` tested against a synthetic repository skeleton: package and versioned judge prompt files copied without modifying existing app files.
- `quality_audit.py` tested against five authentic user-supplied seeds. Flagged the known Pilot 03 persona deviation and missing transfer in the historical stall. These are diagnostic flags, not judge verdicts.
- `capture.py example` generated a PNG from **a previously uploaded real model-backed conversation**. The example contains a prominent disclaimer; it is **not a new test run or a screenshot of the original live chat interface**. Inspected the screenshot for legibility.
- **Not run here:** new OpenAI/SoCLaaS calls, 20 fresh conversations, human labels, independent judge verdicts, red-team attacks, local Windows/PowerShell, running frontend import screenshots or production build. Those require the student's live server, credentials, and human review. The packaged scripts will collect or capture them when executed by Codex on that machine.
