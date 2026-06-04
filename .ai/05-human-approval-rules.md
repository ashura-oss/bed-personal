# Human Approval Rules

## Always Requires Approval

- Git commit.
- Git push.
- Tag creation.
- Release or deploy.
- Merge into `dev`, `qa`, `staging`, or `main`.
- Letting Claude or another AI edit files.
- Backend schema or architecture change.
- Creating `client/` outside `client-bootstrap`.
- Expanding `client-bootstrap` to include combat.
- Installing new major dependencies.
- Using non-original or unclear-license assets.

## Can Proceed Without Approval

- Read-only scans.
- Documentation scaffolding requested by the human.
- Surgical docs updates that remove contradictions.
- Local verification commands that do not mutate project state.
- Creating directories/files explicitly requested by the human.
- Claude review-only feedback.

## Approval Prompt Format

Ask for one concrete action:

`Approve <action> on <branch/path>? Reason: <why it is needed>.`

Do not bundle unrelated approvals.
