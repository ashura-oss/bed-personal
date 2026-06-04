# Workflow: Claude Final Review Only

Use after Codex QA passes and before human commit/merge approval.

## Claude Reviews

- Diff correctness.
- Architecture boundaries.
- Security.
- Performance.
- Test coverage.
- Release readiness if relevant.

## Claude Does Not

- Edit.
- Commit.
- Merge.
- Push.
- Create alternate implementation.

## Codex Then

- Applies accepted fixes.
- Re-runs checks.
- Reports final state to human.
