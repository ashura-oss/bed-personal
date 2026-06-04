# Risk Register

| ID | Risk | Impact | Mitigation | Owner |
|---|---|---|---|---|
| R-001 | Scope expands into a full soulslike too early | Stalled project | Phase 1 greybox slice first | Orchestrator |
| R-002 | `client-bootstrap` grows into combat | Muddy foundation | Explicitly exclude combat | Scope-slicer |
| R-003 | Backend rewrite temptation | Breaks completed API | Keep routes -> controllers -> models -> db | Code-reviewer |
| R-004 | UI/gameplay coupling | Hard-to-test client | Enforce `UIBus` only | QA gate |
| R-005 | Rapier WASM boot issues | Blank client | Async init contract and boot smoke | Feature-builder |
| R-006 | Render-loop GC stutter | Poor feel | Performance review for allocations | Performance-reviewer |
| R-007 | Asset license uncertainty | Release blocker | Manifest license fields and review | Release-manager |
| R-008 | Legacy docs confuse agents | Wrong implementation path | Source-of-truth map and legacy labels | Docs-sync |
| R-009 | Inconsistent branch flow | Broken promotion process | Use `.claude/hooks/pre-merge.json` | Orchestrator |
| R-010 | Tests added too late | Slow regressions | Jest contract from first pure systems | QA gate |
| R-011 | Claude workflow still grants edit/merge powers | Wrong agent writes or merges | Treat `.claude/*` as review-only until rewritten | Codex |
| R-012 | Multiple AI writers edit at once | Conflicts and lost work | One writer only: Codex | Human |
