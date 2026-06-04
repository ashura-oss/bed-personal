# Branching Policy

Source policy: `.claude/hooks/pre-merge.json`.

## Branch Flow

`feat/* -> dev -> qa -> staging -> main`

## Rules

- Codex is the only agent allowed to edit files.
- Create feature branches from `dev`.
- Use `feat/<kebab-name>` for implementation.
- No direct commits to `dev`, `qa`, `staging`, or `main`.
- No backward merges.
- No stage skipping.
- No force-push.
- No tags without explicit human approval.

## Gate Mapping

- `feat/* -> dev -> qa`: QA gate.
- `qa -> staging`: staging performance gate.
- `staging -> main`: release gate.

## Current First Branch

- First planned slice: `feat/client-bootstrap`.
- The branch may exist before code exists.
- Do not create `client/` until the feature workflow begins.
- Human approval is required before committing or merging any branch.
