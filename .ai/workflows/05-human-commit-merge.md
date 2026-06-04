# Workflow: Human Commit / Merge

Use only after Codex implementation, checks, and any review blockers are resolved.

## Human Approval Required For

- Staging files.
- Creating commits.
- Pushing.
- Merging.
- Tagging.
- Releasing.

## Approval Request Format

`Approve commit on <branch> for <scope>?`

or

`Approve merge <from> -> <to>?`

## Branch Flow

`feat/* -> dev -> qa -> staging -> main`

No stage skipping.
