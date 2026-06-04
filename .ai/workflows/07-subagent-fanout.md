# Workflow: Subagent Fanout

Use the built-in FleetView agent types for review/check work:
- `qa-gatekeeper` — eslint/jest/build + boundary audit → PASS/FAIL
- `staging-auditor` — 60fps frame budget gate
- `release-manager` — CI + prod build + license + demo verification

The old 168-micro-agent registry has been superseded. The three agents above cover all gate needs.
No agent commits, pushes, merges, tags, or deploys without human approval.
