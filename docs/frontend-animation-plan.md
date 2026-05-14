# Frontend Animation Plan

This began as the CA2 frontend planning document. The user has now explicitly started Phase 9 frontend work, so this file tracks both implemented frontend pieces and upcoming animation/game-feel work.

Track 2 note:
- This file covers the existing DOM-based CA2 frontend.
- Phaser/action gameplay planning now lives in `docs/game-design-doc.md`.
- Pixel art production standards now live in `docs/pixel-art-style-guide.md`.
- Do not mix Phaser scene logic into the dashboard DOM modules.

## Frontend Goal

Realmforge should feel like a playable 2D browser RPG, not a basic CRUD website. The frontend should still be plain HTML, CSS, and JavaScript so it is easy to explain in an interview.

## Planned Pages

- `frontend/index.html`
- `frontend/register.html`
- `frontend/login.html`
- `frontend/dashboard.html`
- `frontend/characterCreation.html`

## Planned CSS Structure

- `frontend/css/global.css`
- `frontend/css/game-ui.css`
- `frontend/css/animations.css`

## Planned JavaScript Structure

- `frontend/js/api.js`
- `frontend/js/auth.js`
- `frontend/js/dashboard.js`
- `frontend/js/scenes/characterCreationScene.js`
- `frontend/js/game/characterRules.js`
- `frontend/js/game/gameState.js`
- `frontend/js/animations/waapi.js`
- `frontend/js/animations/particles.js`

World map browsing currently lives inside `frontend/js/dashboard.js` because the map is a dashboard panel. Extract it only if the dashboard file becomes difficult to maintain.

## Implemented Frontend Milestones

- Phase 9.1: frontend shell, design system, navigation, shared API helper, shared UI helper, WAAPI helper, and ambient particles.
- Phase 9.2: registration and login screens connected to backend auth.
- Phase 9.3: protected dashboard HUD with profile, characters, region previews, log count, and logout.
- Phase 9.4: multi-step character creation with live stat preview and real `POST /characters` submission.
- Phase 9.5: interactive world map panel with clickable region nodes, selected region details, and dynamic `GET /regions/:regionId/quests` loading.
- Phase 9.6: quest board panel with selected region contracts, character selection, `POST /adventures/attempt`, result reveal, reward popups, HUD progression updates, and log refresh.
- Phase 9.7: adventure journal panel with journey totals, filters, character progress, and timeline entries from real backend logs.
- Phase 10.2: ability progression panel with real unlocked/locked states, unlock actions, opener/chain/finisher combo slots, WAAPI combo slot animation, and backend combo result display.
- Phase 10.3: boss quest combo encounters with boss visual treatment, combo handoff, persisted XP/gold rewards, and adventure log writes.

## Planned Screens

- Game-style loading screen.
- Animated landing page.
- Register page.
- Login page.
- Dashboard.
- Character creation screen.
- Animated world map.
- Region detail panel.
- Quest board.
- Adventure result screen.
- Ability tree or combo screen.
- Adventure log screen.

## Visual Style

- Dark fantasy.
- Premium browser RPG.
- Deep navy and black backgrounds.
- Gold accents.
- Ember orange highlights.
- Mist and fog overlays.
- Glowing shard effects.
- Panels, cards, badges, stat blocks, progress bars, and quest cards.
- Region cards with hover states.
- Boss portrait cards.
- Readable forms and clear errors.

## CSS Animation Usage

Use CSS animations for:

- Background fog drift.
- Button hover glow.
- Card entrance animations.
- Region hover pulse.
- Loading shard pulse.
- Quest reward popups.
- XP bar fill animation.
- Modal transitions.

Rules:
- Animations must support real UI states.
- Do not animate fake buttons or unavailable features.
- Keep motion subtle enough for usability.

## Web Animations API Usage

Use `element.animate()` for:

- Boss card entrance.
- Quest completion result animation.
- Damage number popups.
- Ability combo sequence effects.
- Region unlock animation.
- Character creation step transitions.

Example planned use:

```js
resultPanel.animate(
  [
    { opacity: 0, transform: "translateY(16px) scale(0.98)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ],
  {
    duration: 260,
    easing: "ease-out"
  }
);
```

## requestAnimationFrame Usage

Use `requestAnimationFrame` for:

- Canvas particle background.
- Floating embers.
- World map ambient effects.
- Animated star or shard field.
- Smooth HUD counters if appropriate.

Rules:
- Stop animation loops when leaving a page/view.
- Keep particle counts low enough for school laptops.
- Keep all animation code understandable.

## Core Mechanic Frontend Integration

### Mechanic 1: Character creation plus world map quest progression

Expected frontend flow:
1. User logs in.
2. User creates a character.
3. User opens the world map.
4. User selects a region.
5. User chooses a quest.
6. User attempts the quest.
7. UI displays result, rewards, and progression.
8. Adventure log updates dynamically.

### Mechanic 2: Combo battle system plus ability unlock/progression

Expected frontend flow:
1. User views unlocked abilities.
2. User unlocks eligible abilities.
3. User builds or triggers a combo sequence.
4. UI animates the combo result.
5. Backend persists ability unlocks and returns a combo simulation result.

## Interview-Friendly Constraints

- Use Fetch API, not a complex framework.
- Keep each JS file focused on one responsibility.
- Use readable function names.
- Keep data flow easy to explain: UI event -> API call -> response handling -> DOM update.
- Avoid frontend-only fake progress. The backend must be the source of truth.

## Accessibility and Usability

- Text must remain readable on dark backgrounds.
- Forms must show clear validation messages.
- Buttons must not shift layout on hover.
- Keyboard users should be able to navigate forms and primary actions.
- Dynamic errors should be visible near the relevant action.
