# UIBus Contract

The UI is an HTML/CSS overlay. Gameplay communicates with UI through `UIBus` only.

## Rules

- Gameplay may emit events.
- UI may subscribe to events.
- Gameplay must not import `ui/`.
- Gameplay must not mutate DOM.
- UI must not reach into gameplay internals.
- Event payloads must be typed.

## Initial Event Families

- `boot:progress`
- `player:hpChanged`
- `player:fpChanged`
- `player:staminaChanged`
- `player:died`
- `embers:changed`
- `lockon:changed`
- `boss:entered`
- `hearthlight:rested`
- `menu:opened`
- `menu:closed`

## Review Checks

- No `document.querySelector` in gameplay.
- No `HTMLElement` types in gameplay.
- No imports from `ui/` inside gameplay.
- UI components are dumb and data-driven.
