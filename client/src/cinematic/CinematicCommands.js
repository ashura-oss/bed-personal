export const CinematicCommandType = Object.freeze({
  CameraPan: "cameraPan",
  CameraShake: "cameraShake",
  Letterbox: "letterbox",
  Fade: "fade",
  Desaturate: "desaturate",
  Subtitle: "subtitle",
  BossReveal: "bossReveal",
  Wait: "wait",
  Dialogue: "dialogue",
  SetFlag: "setFlag",
  PlayAudio: "playAudio",
  NpcAnim: "npcAnim",
  Callback: "callback",
});

export const CINEMATIC_COMMAND_TYPES = Object.freeze(Object.values(CinematicCommandType));

export const CinematicEasing = Object.freeze({
  Linear: "linear",
  EaseInOut: "ease-in-out",
});

export const SubtitlePosition = Object.freeze({
  LowerThird: "lower-third",
  Center: "center",
});

const EASINGS = new Set(Object.values(CinematicEasing));
const SUBTITLE_POSITIONS = new Set(Object.values(SubtitlePosition));
const FADE_DIRECTIONS = new Set(["in", "out"]);

/**
 * Normalizes a declarative cutscene command into a stable, frozen shape.
 * The command objects remain engine-agnostic: no DOM, Three.js, or UIBus imports.
 */
export function normalizeCinematicCommand(command, index = 0) {
  if (!command || typeof command !== "object") {
    throw new TypeError(`Cinematic command at index ${index} must be an object.`);
  }

  const type = normalizeType(command.type, index);
  const base = optionalId(command);

  switch (type) {
    case CinematicCommandType.CameraPan:
      return freezeCommand({
        ...base,
        type,
        from: normalizeAnchor(command.from, "from", index),
        to: normalizeAnchor(command.to, "to", index),
        duration: normalizeDuration(command.duration, "duration", index),
        easing: normalizeEnum(command.easing ?? CinematicEasing.Linear, EASINGS, "easing", index),
      });

    case CinematicCommandType.CameraShake:
      return freezeCommand({
        ...base,
        type,
        intensity: normalizeNonNegativeNumber(command.intensity, "intensity", index),
        duration: normalizeDuration(command.duration, "duration", index),
      });

    case CinematicCommandType.Letterbox:
      return freezeCommand({
        ...base,
        type,
        enter: Boolean(command.enter),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.Fade:
      return freezeCommand({
        ...base,
        type,
        direction: normalizeEnum(command.direction, FADE_DIRECTIONS, "direction", index),
        color: normalizeOptionalText(command.color, "black"),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.Desaturate:
      return freezeCommand({
        ...base,
        type,
        amount: clamp01(normalizeFiniteNumber(command.amount, "amount", index)),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.Subtitle:
      return freezeCommand({
        ...base,
        type,
        text: normalizeRequiredText(command.text, "text", index),
        duration: normalizeDuration(command.duration, "duration", index),
        position: normalizeEnum(
          command.position ?? SubtitlePosition.LowerThird,
          SUBTITLE_POSITIONS,
          "position",
          index
        ),
      });

    case CinematicCommandType.BossReveal:
      return freezeCommand({
        ...base,
        type,
        name: normalizeRequiredText(command.name, "name", index),
        subtitle: normalizeOptionalText(command.subtitle, ""),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.Wait:
      return freezeCommand({
        ...base,
        type,
        duration: normalizeDuration(command.duration, "duration", index),
      });

    case CinematicCommandType.Dialogue:
      return freezeCommand({
        ...base,
        type,
        nodeId: normalizeRequiredText(command.nodeId, "nodeId", index),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.SetFlag:
      return freezeCommand({
        ...base,
        type,
        flagId: normalizeRequiredText(command.flagId, "flagId", index),
        value: command.value ?? true,
        duration: 0,
      });

    case CinematicCommandType.PlayAudio:
      return freezeCommand({
        ...base,
        type,
        soundId: normalizeRequiredText(command.soundId, "soundId", index),
        duration: 0,
      });

    case CinematicCommandType.NpcAnim:
      return freezeCommand({
        ...base,
        type,
        npcId: normalizeRequiredText(command.npcId, "npcId", index),
        state: normalizeRequiredText(command.state, "state", index),
        duration: normalizeDuration(command.duration ?? 0, "duration", index),
      });

    case CinematicCommandType.Callback:
      if (typeof command.fn !== "function") {
        throw new TypeError(`Cinematic command at index ${index} requires callback fn.`);
      }
      return freezeCommand({
        ...base,
        type,
        fn: command.fn,
        duration: 0,
      });

    default:
      throw new TypeError(`Unsupported cinematic command type "${type}" at index ${index}.`);
  }
}

export function normalizeCinematicCommands(commands) {
  if (!Array.isArray(commands)) {
    throw new TypeError("Cinematic sequence must be an array of commands.");
  }

  return Object.freeze(commands.map((command, index) => normalizeCinematicCommand(command, index)));
}

export function isCinematicCommandType(type) {
  return CINEMATIC_COMMAND_TYPES.includes(type);
}

function normalizeType(type, index) {
  if (!isCinematicCommandType(type)) {
    throw new TypeError(`Unsupported cinematic command type "${String(type)}" at index ${index}.`);
  }
  return type;
}

function optionalId(command) {
  if (command.id === undefined || command.id === null || String(command.id).trim() === "") {
    return {};
  }
  return { id: String(command.id).trim() };
}

function normalizeAnchor(anchor, field, index) {
  if (anchor === null || anchor === undefined) {
    throw new TypeError(`Cinematic command at index ${index} requires ${field}.`);
  }

  if (typeof anchor === "object") {
    return Object.freeze({ ...anchor });
  }

  return anchor;
}

function normalizeRequiredText(value, field, index) {
  const text = normalizeOptionalText(value, "");
  if (!text) {
    throw new TypeError(`Cinematic command at index ${index} requires ${field}.`);
  }
  return text;
}

function normalizeOptionalText(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
}

function normalizeEnum(value, allowed, field, index) {
  if (!allowed.has(value)) {
    throw new TypeError(`Invalid ${field} "${String(value)}" for cinematic command at index ${index}.`);
  }
  return value;
}

function normalizeDuration(value, field, index) {
  return normalizeNonNegativeNumber(value, field, index);
}

function normalizeNonNegativeNumber(value, field, index) {
  const number = normalizeFiniteNumber(value, field, index);
  if (number < 0) {
    throw new RangeError(`Cinematic command at index ${index} requires non-negative ${field}.`);
  }
  return number;
}

function normalizeFiniteNumber(value, field, index) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`Cinematic command at index ${index} requires finite ${field}.`);
  }
  return number;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function freezeCommand(command) {
  return Object.freeze(command);
}
