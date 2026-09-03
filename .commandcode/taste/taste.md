# Taste / Preferences

## Communication & Deliverables

- When asked for a codebase review, wants findings organized by explicit dimensions (bugs/error handling, security, architecture/clean code, UI/UX) with each issue carrying a priority level (High/Medium/Low) and actionable suggestions that include code examples, plus a prioritized fix order. Confidence: 0.8

## Workflow & Autonomy

- Even when explicitly granted "all permissions" for an audit, expects strictly read-only behavior — no internal changes to the codebase; the deliverable is a written report, not modifications. Confidence: 0.95
- Wants long-running work persisted incrementally (progress checkpoints saved to a report/plan file as work proceeds) so nothing is lost if power fails or the session is interrupted; final deliverable should be a report file the user can retrieve later rather than only an on-screen summary. Confidence: 0.9
- Prefers fully autonomous execution on long audit/analysis tasks: work through the whole task without stopping for check-ins, and leave a written report for later pickup instead of blocking on questions. Confidence: 0.9
- Uses a two-phase workflow: first commissions a read-only audit/report, reviews it, then approves execution with a short blanket go-ahead (e.g., "Work according to your report, you have been given all permissions"). That approval is authorization to execute the report's entire prioritized roadmap (all phases, all fixes) autonomously without pausing for per-step approval — verify as you go and summarize results at the end. Confidence: 0.85
