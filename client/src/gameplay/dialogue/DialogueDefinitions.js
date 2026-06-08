/**
 * DialogueDefinitions — branching dialogue trees for all authored NPCs.
 *
 * Shape:
 *   DIALOGUE_TREES[dialogueId] = {
 *     start: <nodeId>,
 *     nodes: {
 *       [nodeId]: {
 *         speaker: string,
 *         text:    string,
 *         choices: Array<{
 *           label:    string,
 *           next:     string|null,   // null = end conversation
 *           requires?: string,       // predicate key; choice hidden if false
 *           effect?:  string,        // effect key emitted by DialogueEngine
 *         }>
 *       }
 *     }
 *   }
 *
 * All text is original, license-clean.
 * effect strings are emitted by DialogueEngine — consumed by quest/progression
 * systems in a later module.
 */

export const DIALOGUE_TREES = Object.freeze({

  // ── First Shard Memory ───────────────────────────────────────────────────

  "heart_remembers_you": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "The Worldheart",
        text: "The Heart remembers you.",
        choices: Object.freeze([
          Object.freeze({ label: "(Continue)", next: "echo" })
        ])
      }),
      echo: Object.freeze({
        speaker: "The Worldheart",
        text: "Carry this light to Hearthmere. The road has not forgotten its oath.",
        choices: Object.freeze([
          Object.freeze({ label: "(Leave)", effect: "story.shard_absorbed_first", next: null })
        ])
      })
    })
  }),

  // ── Tessa the Emberwright ─────────────────────────────────────────────────

  "tessa.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Tessa the Emberwright",
        text: "The forge still breathes, barely. Bring me ore and timber and I will make you something that bites back.",
        choices: Object.freeze([
          Object.freeze({ label: "What can you forge?", next: "forge" }),
          Object.freeze({ label: "Who are you?",        next: "who" }),
          Object.freeze({ label: "(Leave)",             next: null })
        ])
      }),
      forge: Object.freeze({
        speaker: "Tessa the Emberwright",
        text: "Blades, wards, and the small mercies that keep the hollow at bay. Gather, and return to the Hearthlight.",
        choices: Object.freeze([
          Object.freeze({ label: "I will gather what you need.", effect: "quest.tessa_gather.offer", next: null }),
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      who: Object.freeze({
        speaker: "Tessa the Emberwright",
        text: "The last smith of Hearthmere. The others walked the Ashfall Road and did not return.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      })
    })
  }),

  // ── Warden Aldric ─────────────────────────────────────────────────────────

  "aldric.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Warden Aldric",
        text: "The northern pass is sealed until I say otherwise. Hollow sightings have doubled since the last ember-tide.",
        choices: Object.freeze([
          Object.freeze({ label: "What are you guarding against?", next: "threat" }),
          Object.freeze({ label: "Can I help?",                    next: "help" }),
          Object.freeze({ label: "(Leave)",                        next: null })
        ])
      }),
      threat: Object.freeze({
        speaker: "Warden Aldric",
        text: "The Hollow — what remains of those who lost their Worldheart shard. They hunger for light and will tear you apart to get it.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      help: Object.freeze({
        speaker: "Warden Aldric",
        text: "If you want to prove yourself, thin the hollow ranks east of the mill. Come back when your hands are black with ash.",
        choices: Object.freeze([
          Object.freeze({ label: "I will handle it.", effect: "quest.aldric_hollow.offer", next: null }),
          Object.freeze({ label: "(Leave)", next: null })
        ])
      })
    })
  }),

  // ── Marn the Trader ───────────────────────────────────────────────────────

  "marn.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Marn the Trader",
        text: "Everything has a price out here — even silence. Looking to trade or just talk?",
        choices: Object.freeze([
          Object.freeze({ label: "What do you sell?",    next: "wares" }),
          Object.freeze({ label: "How is business?",     next: "business" }),
          Object.freeze({ label: "(Leave)",              next: null })
        ])
      }),
      wares: Object.freeze({
        speaker: "Marn the Trader",
        text: "Dried provisions, rope, flint — the things nobody thinks about until they are bleeding in a ditch. Shard-dust if you have the coin.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      business: Object.freeze({
        speaker: "Marn the Trader",
        text: "Terrible, honestly. Half my customers turned hollow last season. The other half are you — one customer is not a market.",
        choices: Object.freeze([
          Object.freeze({ label: "I will try to send people your way.", effect: "quest.marn_supply.note", next: null }),
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      })
    })
  }),

  // ── The Unbound Wanderer ──────────────────────────────────────────────────

  "wanderer.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "The Unbound Wanderer",
        text: "I have walked every road this shattered world has left. Some of them lead somewhere. Most do not.",
        choices: Object.freeze([
          Object.freeze({ label: "Where have you been?",    next: "roads" }),
          Object.freeze({ label: "What drives you onward?", next: "drive" }),
          Object.freeze({ label: "(Leave)",                 next: null })
        ])
      }),
      roads: Object.freeze({
        speaker: "The Unbound Wanderer",
        text: "The Salt Flats, the Cinder Peaks, the Drowned Quarter below Hearthmere. Each one taught me something I would rather not know.",
        choices: Object.freeze([
          Object.freeze({ label: "Tell me about the Drowned Quarter.", next: "drowned" }),
          Object.freeze({ label: "(Back)",                              next: "root" })
        ])
      }),
      drowned: Object.freeze({
        speaker: "The Unbound Wanderer",
        text: "A city that sank when the Worldheart first cracked. The hollow there are old — too old. They remember what they were.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      drive: Object.freeze({
        speaker: "The Unbound Wanderer",
        text: "I am looking for the shard that was taken from me. It is out there. It has to be.",
        choices: Object.freeze([
          Object.freeze({ label: "(Leave)", next: null })
        ])
      })
    })
  }),

  // ── Road Scout Pell ───────────────────────────────────────────────────────

  "scout.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Road Scout Pell",
        text: "You look like someone who walks into danger on purpose. I respect that. Mostly.",
        choices: Object.freeze([
          Object.freeze({ label: "What have you scouted lately?", next: "report" }),
          Object.freeze({ label: "Any safe paths ahead?",         next: "paths" }),
          Object.freeze({ label: "(Leave)",                       next: null })
        ])
      }),
      report: Object.freeze({
        speaker: "Road Scout Pell",
        text: "Three hollow camps on the east ridge, a collapsed bridge at the ford, and something very large moving in the quarry at night. Happy travels.",
        choices: Object.freeze([
          Object.freeze({ label: "The quarry — what kind of large?", next: "quarry" }),
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      quarry: Object.freeze({
        speaker: "Road Scout Pell",
        text: "The kind with claws. I did not stay long enough to count them.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      paths: Object.freeze({
        speaker: "Road Scout Pell",
        text: "Stick to the river road south of the mill. It is boring and muddy and you will probably survive it.",
        choices: Object.freeze([
          Object.freeze({ label: "(Leave)", next: null })
        ])
      })
    })
  }),

  // ── Hollow Survivor ───────────────────────────────────────────────────────

  "survivor.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Hollow Survivor",
        text: "... you are not one of them. You still have your light. I can see it.",
        choices: Object.freeze([
          Object.freeze({ label: "What happened to you?",       next: "happened" }),
          Object.freeze({ label: "Are you hurt?",               next: "hurt" }),
          Object.freeze({ label: "(Leave)",                     next: null })
        ])
      }),
      happened: Object.freeze({
        speaker: "Hollow Survivor",
        text: "My shard cracked during the tide. I did not go hollow — not fully — but I can feel the edge of it. Every hour.",
        choices: Object.freeze([
          Object.freeze({ label: "Is there a cure?",    next: "cure" }),
          Object.freeze({ label: "(Back)",              next: "root" })
        ])
      }),
      cure: Object.freeze({
        speaker: "Hollow Survivor",
        text: "The old texts mention a Mending Rite at the Worldheart shrine. I cannot reach it alone.",
        choices: Object.freeze([
          Object.freeze({ label: "I will look into it.", effect: "quest.survivor_rite.note", next: null }),
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      hurt: Object.freeze({
        speaker: "Hollow Survivor",
        text: "Not in any way you can mend with bandages. But thank you for asking.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      })
    })
  }),

  // ── Foreman Brek ─────────────────────────────────────────────────────────

  "foreman.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Foreman Brek",
        text: "Mine is closed. Hollow took level three last week and I am not sending my crew back until someone clears it.",
        choices: Object.freeze([
          Object.freeze({ label: "What is in the mine?",    next: "mine" }),
          Object.freeze({ label: "I can clear it.",         next: "offer" }),
          Object.freeze({ label: "(Leave)",                 next: null })
        ])
      }),
      mine: Object.freeze({
        speaker: "Foreman Brek",
        text: "Shardstone, mostly. Best vein in Hearthmere. Also, apparently, a nest of hollow that moved in when we stopped working.",
        choices: Object.freeze([
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      }),
      offer: Object.freeze({
        speaker: "Foreman Brek",
        text: "You serious? Level three, past the second lift. If you clear it out I will split the first haul with you.",
        choices: Object.freeze([
          Object.freeze({ label: "Deal.", effect: "quest.brek_mine.offer", next: null }),
          Object.freeze({ label: "(Back)", next: "root" })
        ])
      })
    })
  }),

  // ── Weary Traveller ───────────────────────────────────────────────────────

  "traveller.intro": Object.freeze({
    start: "root",
    nodes: Object.freeze({
      root: Object.freeze({
        speaker: "Weary Traveller",
        text: "Long road behind me, longer one ahead. Not much to say — I am just trying to reach the next hearthlight before dark.",
        choices: Object.freeze([
          Object.freeze({ label: "Where are you headed?",      next: "destination" }),
          Object.freeze({ label: "Safe travels.",              next: null })
        ])
      }),
      destination: Object.freeze({
        speaker: "Weary Traveller",
        text: "Somewhere the Worldheart still sings. They say there is a valley to the east where the shard-crack never reached. I will believe it when I see it.",
        choices: Object.freeze([
          Object.freeze({ label: "(Leave)", next: null })
        ])
      })
    })
  })

});

/**
 * Retrieve a dialogue tree by its dialogueId.
 * Returns null if the id is not found.
 *
 * @param {string} dialogueId
 * @returns {object|null}
 */
export function getDialogueTree(dialogueId) {
  return DIALOGUE_TREES[dialogueId] ?? null;
}
