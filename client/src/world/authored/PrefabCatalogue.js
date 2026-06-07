/**
 * PrefabCatalogue — WM-06 / WM-07
 *
 * Maps authored prefab tag strings to their definition objects.
 * All 4 previously-greybox prefabs are now authored builds with
 * distinct primitive-geometry setpieces.
 */

import { HEARTHMERE_CAMP_PREFAB } from "../prefab/prefabs/hearthmereCamp.js";
import { ASHFALL_ROAD_GATE_PREFAB } from "../prefab/prefabs/ashfallRoadGate.js";
import { COPPERSTONE_MINE_PREFAB } from "../prefab/prefabs/copperstoneMine.js";
import { HOLLOW_REACH_RUINS_PREFAB } from "../prefab/prefabs/hollowReachRuins.js";
import { HEARTHMERE_CRYPT_PREFAB } from "../prefab/prefabs/hearthmere_crypt.js";

export const PREFAB_CATALOGUE = Object.freeze({
  hearthmere_camp: HEARTHMERE_CAMP_PREFAB,
  ashfall_road_gate: ASHFALL_ROAD_GATE_PREFAB,
  copperstone_mine: COPPERSTONE_MINE_PREFAB,
  hollow_reach_ruins: HOLLOW_REACH_RUINS_PREFAB,
  hearthmere_crypt: HEARTHMERE_CRYPT_PREFAB
});

/**
 * Looks up a prefab definition by its tag or id string.
 *
 * @param {string} tagOrId
 * @returns {object|null}
 */
export function getPrefabDef(tagOrId) {
  return PREFAB_CATALOGUE[tagOrId] ?? null;
}
