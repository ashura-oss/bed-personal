# Open Risks

| ID | Risk | Status | Mitigation |
|---|---|---|---|
| R-001 | Phase 1 scope creep | Open | Scope-slicer must keep slices small. |
| R-002 | `client-bootstrap` includes combat | Open | Explicitly blocked in `.ai` and `docs/tech`. |
| R-003 | Rapier WASM integration friction | Open | Async boot contract and browser smoke. |
| R-004 | UI/gameplay coupling | Open | `UIBus` contract and QA grep. |
| R-005 | Performance regressions | Open | Staging performance gate and budget docs. |
| R-006 | Legacy docs confuse future agents | Open | Source-of-truth map and docs sync review. |
| R-007 | Backend changes arrive too early | Open | Backend contract defers run-state to Phase 3. |
| R-008 | `.claude` workflow still grants Claude builder powers | Open | Treat `.claude/*` as review-only until rewritten. |
| R-009 | Multiple AI writers edit simultaneously | Open | Codex is the only writer. |
| R-010 | Initial Three/Rapier chunks are large | Open | Non-blocking bootstrap warning: production build emits a ~2.29 MiB Rapier chunk and ~473 KiB Three/vendor chunk. Keep code-splitting; revisit bundle budget after bootstrap. |
| R-011 | `npm audit --omit=dev` reported moderate transitive vulnerabilities | Resolved | Safe non-force audit fix updated transitive `qs` and `ws`; final `npm audit --omit=dev` reports 0 vulnerabilities. |
