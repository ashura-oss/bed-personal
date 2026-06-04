import { describe, expect, it } from "@jest/globals";
import { AppMode } from "../core/AppMode.js";
import { GameContext } from "../core/GameContext.js";

function makeCtxAt(mode) {
  const ctx = new GameContext();
  if (mode === AppMode.Boot) return ctx;

  ctx.transition(AppMode.Exploration);
  if (mode !== AppMode.Exploration) {
    ctx.transition(mode);
  }
  return ctx;
}

describe("GameContext initial state", () => {
  it("starts in Boot", () => {
    expect(new GameContext().mode).toBe(AppMode.Boot);
  });

  it("keeps separate state per instance", () => {
    const a = new GameContext();
    const b = new GameContext();
    a.transition(AppMode.Exploration);
    expect(a.mode).toBe(AppMode.Exploration);
    expect(b.mode).toBe(AppMode.Boot);
  });
});

describe("legal transitions", () => {
  it("Boot -> Exploration", () => {
    const ctx = new GameContext();
    ctx.transition(AppMode.Exploration);
    expect(ctx.mode).toBe(AppMode.Exploration);
  });

  it("Exploration -> Combat", () => {
    const ctx = makeCtxAt(AppMode.Exploration);
    ctx.transition(AppMode.Combat);
    expect(ctx.mode).toBe(AppMode.Combat);
  });

  it("Exploration -> Cutscene", () => {
    const ctx = makeCtxAt(AppMode.Exploration);
    ctx.transition(AppMode.Cutscene);
    expect(ctx.mode).toBe(AppMode.Cutscene);
  });

  it("Exploration -> Menu", () => {
    const ctx = makeCtxAt(AppMode.Exploration);
    ctx.transition(AppMode.Menu);
    expect(ctx.mode).toBe(AppMode.Menu);
  });

  it("Exploration -> Loading", () => {
    const ctx = makeCtxAt(AppMode.Exploration);
    ctx.transition(AppMode.Loading);
    expect(ctx.mode).toBe(AppMode.Loading);
  });

  it("Combat -> Exploration", () => {
    const ctx = makeCtxAt(AppMode.Combat);
    ctx.transition(AppMode.Exploration);
    expect(ctx.mode).toBe(AppMode.Exploration);
  });

  it("Cutscene -> Exploration", () => {
    const ctx = makeCtxAt(AppMode.Cutscene);
    ctx.transition(AppMode.Exploration);
    expect(ctx.mode).toBe(AppMode.Exploration);
  });

  it("Menu -> Exploration", () => {
    const ctx = makeCtxAt(AppMode.Menu);
    ctx.transition(AppMode.Exploration);
    expect(ctx.mode).toBe(AppMode.Exploration);
  });

  it("Loading -> Exploration", () => {
    const ctx = makeCtxAt(AppMode.Loading);
    ctx.transition(AppMode.Exploration);
    expect(ctx.mode).toBe(AppMode.Exploration);
  });
});

describe("illegal transitions", () => {
  it("Boot -> Combat is illegal", () => {
    const ctx = new GameContext();
    expect(() => ctx.transition(AppMode.Combat)).toThrow(TypeError);
  });

  it("Boot -> Cutscene is illegal", () => {
    const ctx = new GameContext();
    expect(() => ctx.transition(AppMode.Cutscene)).toThrow(TypeError);
  });

  it("Boot -> Menu is illegal", () => {
    const ctx = new GameContext();
    expect(() => ctx.transition(AppMode.Menu)).toThrow(TypeError);
  });

  it("Boot -> Loading is illegal", () => {
    const ctx = new GameContext();
    expect(() => ctx.transition(AppMode.Loading)).toThrow(TypeError);
  });

  it("Exploration -> Boot is illegal", () => {
    const ctx = makeCtxAt(AppMode.Exploration);
    expect(() => ctx.transition(AppMode.Boot)).toThrow(TypeError);
  });

  it("Combat -> Menu is illegal", () => {
    const ctx = makeCtxAt(AppMode.Combat);
    expect(() => ctx.transition(AppMode.Menu)).toThrow(TypeError);
  });

  it("Cutscene -> Menu is illegal", () => {
    const ctx = makeCtxAt(AppMode.Cutscene);
    expect(() => ctx.transition(AppMode.Menu)).toThrow(TypeError);
  });

  it("Menu -> Combat is illegal", () => {
    const ctx = makeCtxAt(AppMode.Menu);
    expect(() => ctx.transition(AppMode.Combat)).toThrow(TypeError);
  });

  it("Loading -> Combat is illegal", () => {
    const ctx = makeCtxAt(AppMode.Loading);
    expect(() => ctx.transition(AppMode.Combat)).toThrow(TypeError);
  });

  it("illegal transition does not change the current mode", () => {
    const ctx = new GameContext();
    try {
      ctx.transition(AppMode.Combat);
    } catch {
      // expected
    }
    expect(ctx.mode).toBe(AppMode.Boot);
  });

  it("error message contains from-mode, to-mode, and legal targets", () => {
    const ctx = new GameContext();
    let message = "";
    try {
      ctx.transition(AppMode.Combat);
    } catch (e) {
      message = e instanceof Error ? e.message : "";
    }
    expect(message).toContain(AppMode.Boot);
    expect(message).toContain(AppMode.Combat);
    expect(message).toContain(AppMode.Exploration);
  });
});

describe("isControlLocked", () => {
  it("Boot is not locked", () => {
    expect(new GameContext().isControlLocked()).toBe(false);
  });

  it("Exploration is not locked", () => {
    expect(makeCtxAt(AppMode.Exploration).isControlLocked()).toBe(false);
  });

  it("Combat is locked", () => {
    expect(makeCtxAt(AppMode.Combat).isControlLocked()).toBe(true);
  });

  it("Cutscene is locked", () => {
    expect(makeCtxAt(AppMode.Cutscene).isControlLocked()).toBe(true);
  });

  it("Menu is locked", () => {
    expect(makeCtxAt(AppMode.Menu).isControlLocked()).toBe(true);
  });

  it("Loading is locked", () => {
    expect(makeCtxAt(AppMode.Loading).isControlLocked()).toBe(true);
  });

  it("unlocks after returning to Exploration from Combat", () => {
    const ctx = makeCtxAt(AppMode.Combat);
    ctx.transition(AppMode.Exploration);
    expect(ctx.isControlLocked()).toBe(false);
  });

  it("unlocks after returning to Exploration from Cutscene", () => {
    const ctx = makeCtxAt(AppMode.Cutscene);
    ctx.transition(AppMode.Exploration);
    expect(ctx.isControlLocked()).toBe(false);
  });
});

describe("onTransition listener", () => {
  it("fires with correct from and to on a legal transition", () => {
    const ctx = new GameContext();
    const calls = [];
    ctx.onTransition((from, to) => {
      calls.push([from, to]);
    });
    ctx.transition(AppMode.Exploration);
    expect(calls).toEqual([[AppMode.Boot, AppMode.Exploration]]);
  });

  it("fires multiple times for multiple transitions", () => {
    const ctx = new GameContext();
    const calls = [];
    ctx.onTransition((from, to) => {
      calls.push([from, to]);
    });
    ctx.transition(AppMode.Exploration);
    ctx.transition(AppMode.Combat);
    ctx.transition(AppMode.Exploration);
    expect(calls).toEqual([
      [AppMode.Boot, AppMode.Exploration],
      [AppMode.Exploration, AppMode.Combat],
      [AppMode.Combat, AppMode.Exploration]
    ]);
  });

  it("supports multiple independent listeners", () => {
    const ctx = new GameContext();
    const a = [];
    const b = [];
    ctx.onTransition((_, to) => {
      a.push(to);
    });
    ctx.onTransition((_, to) => {
      b.push(to);
    });
    ctx.transition(AppMode.Exploration);
    expect(a).toEqual([AppMode.Exploration]);
    expect(b).toEqual([AppMode.Exploration]);
  });

  it("does not fire on illegal rejected transitions", () => {
    const ctx = new GameContext();
    const calls = [];
    ctx.onTransition((from, to) => {
      calls.push([from, to]);
    });
    try {
      ctx.transition(AppMode.Combat);
    } catch {
      // expected
    }
    expect(calls).toHaveLength(0);
  });

  it("continues notifying later listeners when earlier listeners record state", () => {
    const ctx = new GameContext();
    const calls = [];
    ctx.onTransition((from) => {
      calls.push(from);
    });
    ctx.onTransition((_, to) => {
      calls.push(to);
    });
    ctx.transition(AppMode.Exploration);
    expect(calls).toEqual([AppMode.Boot, AppMode.Exploration]);
  });
});
