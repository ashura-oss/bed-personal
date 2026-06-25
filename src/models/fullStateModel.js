import { findBossStatesByCharacterId } from "./bossStateModel.js";
import { findCampaignMarkersByCharacterId } from "./campaignMarkerModel.js";
import { findDialogueFlagsByCharacterId } from "./dialogueFlagModel.js";
import { findEquipmentByCharacterId } from "./characterEquipmentModel.js";
import { findFactionReputationByCharacterId } from "./factionReputationModel.js";
import { findInventoryByCharacterId } from "./characterInventoryModel.js";
import { findRegionStatesByCharacterId } from "./regionStateModel.js";

export async function findFullCharacterState(characterId) {
  const inventory = await findInventoryByCharacterId(characterId);
  const equipment = await findEquipmentByCharacterId(characterId);
  const dialogueFlags = await findDialogueFlagsByCharacterId(characterId);
  const bossStates = await findBossStatesByCharacterId(characterId);
  const campaignMarkers = await findCampaignMarkersByCharacterId(characterId);
  const factionReputation = await findFactionReputationByCharacterId(characterId);
  const regionStates = await findRegionStatesByCharacterId(characterId);

  return {
    inventory,
    equipment,
    dialogueFlags,
    bossStates,
    campaignMarkers,
    factionReputation,
    regionStates
  };
}
