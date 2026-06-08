import { AppMode } from "../core/AppMode.js";
import { CinematicCommandType } from "./CinematicCommands.js";
import { CinematicTimeline, createCinematicTimeline } from "./CinematicTimeline.js";

const TIMED_EVENT_TYPES = new Set([
  CinematicCommandType.CameraPan,
  CinematicCommandType.CameraShake,
  CinematicCommandType.Letterbox,
  CinematicCommandType.Fade,
  CinematicCommandType.Desaturate,
  CinematicCommandType.Subtitle,
  CinematicCommandType.Wait,
  CinematicCommandType.NpcAnim,
]);

/**
 * Drives a CinematicTimeline by explicit dt updates.
 * The player is pure engine orchestration: injected GameContext and UIBus-like
 * emitters are the only side-effect surfaces.
 */
export class CinematicPlayer {
  constructor(options = {}) {
    this.gameContext = options.gameContext ?? options.context ?? null;
    this.uiBus = options.uiBus ?? options.bus ?? null;
    this.timeline = null;
    this.time = 0;
    this.playing = false;
    this.startedEntries = new Set();
    this.completedEntries = new Set();
  }

  get isPlaying() {
    return this.playing;
  }

  play(sequence, options = {}) {
    if (this.playing) {
      this.end({ skipped: true, reason: "interrupted" });
    }

    const timeline = sequence instanceof CinematicTimeline
      ? sequence
      : createCinematicTimeline(sequence, options);

    this.transitionToCutscene();

    this.timeline = timeline;
    this.time = 0;
    this.playing = true;
    this.startedEntries.clear();
    this.completedEntries.clear();

    this.emit("cinematic:started", this.timelinePayload());
    this.processAtCurrentTime();
    this.emitProgress();

    if (timeline.duration === 0 && this.completedEntries.size === timeline.entries.length) {
      this.finish({ skipped: false, reason: "complete" });
    }

    return this;
  }

  update(dt) {
    if (!this.playing || !this.timeline) {
      return false;
    }

    const delta = normalizeDelta(dt);
    const nextTime = Math.min(this.time + delta, this.timeline.duration);
    this.time = nextTime;

    this.processAtCurrentTime();
    this.emitProgress();

    if (this.time >= this.timeline.duration && this.completedEntries.size === this.timeline.entries.length) {
      this.finish({ skipped: false, reason: "complete" });
    }

    return this.playing;
  }

  skip() {
    return this.end({ skipped: true, reason: "skip" });
  }

  end(options = {}) {
    if (!this.playing) {
      return false;
    }

    this.finish({
      skipped: Boolean(options.skipped),
      reason: options.reason ?? (options.skipped ? "skip" : "end"),
    });
    return true;
  }

  processAtCurrentTime() {
    for (const entry of this.timeline.entries) {
      if (!this.startedEntries.has(entry.index) && entry.start <= this.time) {
        this.startEntry(entry);
      }
    }

    for (const entry of this.timeline.entries) {
      if (this.startedEntries.has(entry.index) && !this.completedEntries.has(entry.index)) {
        this.progressEntry(entry);
      }
    }

    for (const entry of this.timeline.entries) {
      if (!this.completedEntries.has(entry.index) && entry.end <= this.time) {
        this.completeEntry(entry);
      }
    }
  }

  startEntry(entry) {
    this.startedEntries.add(entry.index);
    this.emitCommand("start", entry, progressFor(entry, this.time));
    this.emitSpecific("start", entry, progressFor(entry, this.time));

    if (entry.duration === 0) {
      this.progressEntry(entry);
      this.completeEntry(entry);
    }
  }

  progressEntry(entry) {
    const progress = progressFor(entry, this.time);
    this.emitCommand("progress", entry, progress);

    if (TIMED_EVENT_TYPES.has(entry.command.type) || entry.command.type === CinematicCommandType.Callback) {
      this.emitSpecific("progress", entry, progress);
    }
  }

  completeEntry(entry) {
    if (this.completedEntries.has(entry.index)) {
      return;
    }

    this.completedEntries.add(entry.index);
    this.emitCommand("end", entry, 1);
    this.emitSpecific("end", entry, 1);
  }

  finish({ skipped, reason }) {
    const timelinePayload = this.timelinePayload();

    for (const entry of this.timeline.entries) {
      if (this.startedEntries.has(entry.index) && !this.completedEntries.has(entry.index)) {
        this.completeEntry(entry);
      }
    }

    this.cleanup(skipped);
    this.playing = false;
    this.emit("cinematic:ended", {
      ...timelinePayload,
      skipped,
      reason,
      time: this.time,
    });
    this.transitionToExploration();
  }

  cleanup(skipped) {
    this.emit("cinematic:cleanup", {
      id: this.timeline?.id ?? "cinematic",
      skipped,
    });
    this.emit("cinematic:letterbox", { phase: "cleanup", enter: false, duration: 0, progress: 1, skipped });
    this.emit("cinematic:subtitle", { phase: "cleanup", clear: true, duration: 0, progress: 1, skipped });
    this.emit("cinematic:fade", { phase: "cleanup", clear: true, duration: 0, progress: 1, skipped });
    this.emit("cinematic:desaturate", { phase: "cleanup", amount: 0, duration: 0, progress: 1, skipped });
    this.emit("cinematic:cameraPan", { phase: "cleanup", active: false, duration: 0, progress: 1, skipped });
    this.emit("cinematic:cameraShake", { phase: "cleanup", intensity: 0, duration: 0, progress: 1, skipped });
    this.emit("cinematic:bossReveal", { phase: "cleanup", visible: false, skipped });
  }

  emitProgress() {
    const duration = this.timeline.duration;
    this.emit("cinematic:progress", {
      ...this.timelinePayload(),
      time: this.time,
      progress: duration > 0 ? this.time / duration : 1,
    });
  }

  emitCommand(phase, entry, progress) {
    this.emit("cinematic:command", {
      phase,
      timelineId: this.timeline.id,
      index: entry.index,
      start: entry.start,
      end: entry.end,
      duration: entry.duration,
      progress,
      command: entry.command,
    });
  }

  emitSpecific(phase, entry, progress) {
    const command = entry.command;
    const payload = {
      phase,
      timelineId: this.timeline.id,
      index: entry.index,
      duration: entry.duration,
      progress,
      command,
    };

    switch (command.type) {
      case CinematicCommandType.CameraPan:
        this.emit("cinematic:cameraPan", { ...payload, from: command.from, to: command.to, easing: command.easing });
        break;
      case CinematicCommandType.CameraShake:
        this.emit("cinematic:cameraShake", { ...payload, intensity: command.intensity });
        break;
      case CinematicCommandType.Letterbox:
        this.emit("cinematic:letterbox", { ...payload, enter: command.enter });
        break;
      case CinematicCommandType.Fade:
        this.emit("cinematic:fade", { ...payload, direction: command.direction, color: command.color });
        break;
      case CinematicCommandType.Desaturate:
        this.emit("cinematic:desaturate", { ...payload, amount: command.amount });
        break;
      case CinematicCommandType.Subtitle:
        this.emit("cinematic:subtitle", { ...payload, text: command.text, position: command.position });
        break;
      case CinematicCommandType.BossReveal:
        this.emit("cinematic:bossReveal", { ...payload, name: command.name, subtitle: command.subtitle, visible: true });
        break;
      case CinematicCommandType.Wait:
        this.emit("cinematic:wait", payload);
        break;
      case CinematicCommandType.Dialogue:
        this.emit("cinematic:dialogue", { ...payload, nodeId: command.nodeId });
        break;
      case CinematicCommandType.SetFlag:
        this.emit("cinematic:setFlag", { ...payload, flagId: command.flagId, value: command.value });
        break;
      case CinematicCommandType.PlayAudio:
        this.emit("cinematic:audio", { ...payload, soundId: command.soundId });
        break;
      case CinematicCommandType.NpcAnim:
        this.emit("cinematic:npcAnim", { ...payload, npcId: command.npcId, state: command.state });
        break;
      case CinematicCommandType.Callback:
        this.emit("cinematic:callback", payload);
        if (phase === "start") {
          command.fn();
        }
        break;
      default:
        break;
    }
  }

  timelinePayload() {
    return {
      id: this.timeline?.id ?? "cinematic",
      duration: this.timeline?.duration ?? 0,
      commandCount: this.timeline?.commandCount ?? 0,
    };
  }

  transitionToCutscene() {
    if (this.gameContext) {
      this.gameContext.transition(AppMode.Cutscene);
    }
  }

  transitionToExploration() {
    if (this.gameContext?.mode === AppMode.Cutscene) {
      this.gameContext.transition(AppMode.Exploration);
    }
  }

  emit(eventName, payload) {
    this.uiBus?.emit?.(eventName, payload);
  }
}

function progressFor(entry, time) {
  if (entry.duration === 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, (time - entry.start) / entry.duration));
}

function normalizeDelta(dt) {
  const delta = Number(dt);
  if (!Number.isFinite(delta)) {
    throw new TypeError("CinematicPlayer.update(dt) requires a finite dt.");
  }
  if (delta < 0) {
    throw new RangeError("CinematicPlayer.update(dt) requires non-negative dt.");
  }
  return delta;
}
