export const FACTION_DEFINITIONS = Object.freeze([
  Object.freeze({
    factionId: "mordor",
    name: "Mordor",
    description: "The rising shadow host and war-camp network behind the Black Road campaign."
  }),
  Object.freeze({
    factionId: "eregion_smiths",
    name: "Eregion Smiths",
    description: "Ring-lore keepers and smithcraft rivals tied to the next campaign front."
  }),
  Object.freeze({
    factionId: "adars_host",
    name: "Adar's Host",
    description: "A fractured army whose loyalty will shape later campaign choices."
  }),
  Object.freeze({
    factionId: "faction_black_road_host",
    name: "Black Road Host",
    description: "Mordor road captains, levy captains, and supply masters securing the first conquest route."
  }),
  Object.freeze({
    factionId: "faction_eregion_gatewatch",
    name: "Eregion Gatewatch",
    description: "Forward scouts and smith-envoys watching the road toward Eregion's ring-lore."
  }),
  Object.freeze({
    factionId: "faction_western_wardens",
    name: "Western Wardens",
    description: "Root-bound sentries and trackers guarding poisoned groves on Mordor's western marches."
  }),
  Object.freeze({
    factionId: "faction_lamp_vault_keepers",
    name: "Lamp-Vault Keepers",
    description: "Archive wardens preserving stolen maps, ring warnings, and records of the road to Eregion."
  })
]);

export function hasFactionDefinition(factionId) {
  return FACTION_DEFINITIONS.some((faction) => faction.factionId === factionId);
}
