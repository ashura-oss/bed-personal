# Workflow: Release Readiness

Use before any demo release.

## Required Evidence

- CI green: lint -> test -> build.
- webpack production build succeeds.
- Build output is hashed and code-split.
- Express serves `/play`.
- Demo login works.
- Current phase DoD is playable in browser.
- Assets/fonts/sounds/text are license-clean.
- Rollback plan exists.

## Roles

- Codex gathers evidence and updates status.
- Claude may review release readiness only.
- Human approves tags, pushes, and deploys.
