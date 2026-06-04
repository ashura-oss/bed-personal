# AI Collaboration Rules

## Roles

- Human: product owner and final approval. Switches between AI sessions as needed.
- Active AI session (Claude Code or Codex): implementer for that session — edits files, runs tests, updates docs. They do not collaborate in real-time.
- Gate agents (qa-gatekeeper, staging-auditor, release-manager): check and report only; do not merge or deploy without human approval.
- ChatGPT planning chat: prompt design, workflow coordination, scope review.

## Shared Conduct

- Read current files before editing.
- Preserve existing work.
- Do not revert unrelated changes.
- Keep changes scoped.
- Report assumptions and verification gaps.
- Prefer one small slice over broad rewrites.
- One active session at a time — whichever AI is running is the writer.
- Do not have two AI sessions editing the same branch simultaneously.

## Handoffs

Every handoff must include:
- branch;
- files changed;
- commands run;
- results;
- risks;
- next exact command.

## Context Hygiene

- Use `.ai/01-source-of-truth-map.md` to decide what to read.
- Read only the docs needed for the task.
- Summarize long docs instead of copying them into prompts.
- Use subagents for bounded scans or independent reviews.
