# Testing Contract

## Test Stack

- Jest for pure JavaScript systems.
- Playwright for browser smoke.
- ESLint for static rules.
- webpack production build for bundle verification.

## Pure Systems

Must be testable without WebGL:
- stamina math;
- damage math;
- poise/stagger math;
- cooldown timers;
- resource changes;
- event payload helpers.

## Browser Smoke

Once `client/` exists, smoke tests should confirm:
- bundle loads;
- canvas is nonblank;
- no console errors;
- boot screen completes;
- basic interaction works for the slice.

## Gate Commands

From `client/` once present:

- `npm run lint`
- `npm test`
- `npm run build`
- Playwright smoke command when configured.
