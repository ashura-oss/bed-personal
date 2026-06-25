export const DIALOGUE_DEFINITIONS = [
  {
    dialogueId: "dialogue_family_oath",
    regionId: "region_middle_earth",
    nodeId: "node_hearthvale_square",
    storyPhase: "village_rebellion",
    title: "Ashes at Hearthvale",
    npcName: "Mira of the Mill",
    completionFlagId: "dialogue_family_oath_seen",
    lines: [
      {
        speaker: "Mira of the Mill",
        text: "The tax knights rode through before dawn. Your home was the first smoke we saw."
      },
      {
        speaker: "Aren",
        text: "Then the village will not kneel again. I need every hand that can carry iron."
      },
      {
        speaker: "Mira of the Mill",
        text: "Swear it in the square. If they hear you, grief becomes a banner."
      }
    ],
    choices: [
      {
        choiceId: "swear_oath",
        label: "Swear the first oath",
        response: "The village gathers around the first banner of mankind."
      }
    ]
  },
  {
    dialogueId: "dialogue_orc_gate_warning",
    regionId: "region_orc_hold",
    nodeId: "node_orc_gate",
    storyPhase: "village_rebellion",
    title: "Before the Hill-Fort",
    npcName: "Road Militia Captain",
    completionFlagId: "dialogue_orc_gate_warning_seen",
    lines: [
      {
        speaker: "Road Militia Captain",
        text: "The Orc King controls the only westward road. No one reaches Eregion while he stands."
      },
      {
        speaker: "Aren",
        text: "Then he is not a monster in our story. He is a locked gate."
      }
    ],
    choices: [
      {
        choiceId: "prepare_battle",
        label: "Prepare for the gate battle",
        response: "The militia forms behind you and waits for the first charge."
      }
    ]
  },
  {
    dialogueId: "dialogue_eregion_crown",
    regionId: "region_crownfield",
    nodeId: "node_crownfield_camp",
    storyPhase: "king_of_mankind",
    title: "The Crownfield Camp",
    npcName: "Banner Marshal Edrin",
    completionFlagId: "dialogue_eregion_crown_seen",
    lines: [
      {
        speaker: "Banner Marshal Edrin",
        text: "Eregion has fallen. The village banners wait for their king's command."
      },
      {
        speaker: "Aren",
        text: "Then our war changes here. I fight the enemy champions, and the army breaks their lines."
      }
    ],
    choices: [
      {
        choiceId: "take_command",
        label: "Take command of the army",
        response: "The army accepts your command and prepares for the road to Lindon."
      }
    ]
  },
  {
    dialogueId: "dialogue_lindon_final",
    regionId: "region_lindon",
    nodeId: "node_lindon_gate",
    storyPhase: "galadriel_defeated",
    title: "Before Lindon",
    npcName: "Human Standard Bearer",
    completionFlagId: "dialogue_lindon_final_seen",
    lines: [
      {
        speaker: "Human Standard Bearer",
        text: "The sea walls are ahead. The High King has gathered the last elven crown guard."
      },
      {
        speaker: "Aren",
        text: "Then this is where tribute ends. Hold the gate while I take the last ring."
      }
    ],
    choices: [
      {
        choiceId: "begin_siege",
        label: "Begin the siege",
        response: "The army advances under the banner of mankind."
      }
    ]
  }
];

export function findDialogueDefinitionById(dialogueId) {
  return DIALOGUE_DEFINITIONS.find((dialogue) => dialogue.dialogueId === dialogueId) || null;
}
