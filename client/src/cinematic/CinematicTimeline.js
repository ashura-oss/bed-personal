import { normalizeCinematicCommand } from "./CinematicCommands.js";

/**
 * Schedules normalized cinematic commands on a deterministic timeline.
 * Commands are sequential by default; `at` or `start` places a command at an
 * absolute second offset for authored overlaps.
 */
export class CinematicTimeline {
  constructor(sequence = [], options = {}) {
    const source = normalizeSequenceSource(sequence);
    const id = options.id ?? source.id ?? "cinematic";
    const entries = buildEntries(source.commands);

    this.id = String(id);
    this.entries = Object.freeze(entries);
    this.duration = entries.reduce((latest, entry) => Math.max(latest, entry.end), 0);
    this.commandCount = entries.length;

    Object.freeze(this);
  }

  get commands() {
    return Object.freeze(this.entries.map((entry) => entry.command));
  }

  entriesStartingBetween(previousTime, currentTime) {
    return this.entries.filter((entry) => previousTime < entry.start && entry.start <= currentTime);
  }

  entriesCompletingBetween(previousTime, currentTime) {
    return this.entries.filter((entry) => previousTime < entry.end && entry.end <= currentTime);
  }

  entriesActiveAt(time) {
    return this.entries.filter((entry) => entry.start <= time && time < entry.end);
  }
}

export function createCinematicTimeline(sequence, options = {}) {
  if (sequence instanceof CinematicTimeline) {
    return sequence;
  }
  return new CinematicTimeline(sequence, options);
}

function normalizeSequenceSource(sequence) {
  if (Array.isArray(sequence)) {
    return { id: undefined, commands: sequence };
  }

  if (sequence && typeof sequence === "object" && Array.isArray(sequence.commands)) {
    return {
      id: sequence.id,
      commands: sequence.commands,
    };
  }

  throw new TypeError("Cinematic sequence must be an array or an object with commands.");
}

function buildEntries(commands) {
  let cursor = 0;

  return commands.map((rawCommand, index) => {
    const command = normalizeCinematicCommand(rawCommand, index);
    const hasExplicitStart = rawCommand.at !== undefined || rawCommand.start !== undefined;
    const start = hasExplicitStart
      ? normalizeStart(rawCommand.at ?? rawCommand.start, index)
      : cursor;
    const end = start + command.duration;

    cursor = end;

    return Object.freeze({
      index,
      command,
      start,
      end,
      duration: command.duration,
    });
  });
}

function normalizeStart(value, index) {
  const start = Number(value);
  if (!Number.isFinite(start)) {
    throw new TypeError(`Cinematic command at index ${index} requires finite start time.`);
  }
  if (start < 0) {
    throw new RangeError(`Cinematic command at index ${index} requires non-negative start time.`);
  }
  return start;
}
