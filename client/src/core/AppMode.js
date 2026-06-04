/**
 * AppMode — the exhaustive list of application states.
 *
 * All systems that need to know what the game is doing (input, camera,
 * UI, audio) check this rather than inventing their own flags.
 */
export const AppMode = {
  /** Three.js and Rapier are initialising; no player control exists yet. */
  Boot: "Boot",
  /** Player roams the world freely. Default in-game state. */
  Exploration: "Exploration",
  /** Optional 2.5D staged combat encounter is active; camera switches. */
  Combat: "Combat",
  /** In-engine cinematic is playing; all player input is suppressed. */
  Cutscene: "Cutscene",
  /** A menu (pause, inventory, level-up) is open. */
  Menu: "Menu",
  /** A zone or region is streaming in; play is suspended. */
  Loading: "Loading"
};
