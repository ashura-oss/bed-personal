# Workflow: Codex QA Gate

Use before asking the human to approve commit or merge.

## Checks

- `git status --short --branch`.
- Scope review against `.ai/02-non-negotiables.md`.
- No `client/` unless in `client-bootstrap`.
- No combat in `client-bootstrap`.
- No Vite or Vitest.
- No backend rewrite.
- No gameplay -> UI imports once `client/` exists.
- Typecheck/lint/Jest/browser smoke once configured.

## Output

- PASS/FAIL.
- Evidence.
- Remaining risks.
- Human approval request if ready.
