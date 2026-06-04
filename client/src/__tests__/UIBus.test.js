import { describe, expect, it } from "@jest/globals";
import { UIBus } from "../ui/UIBus.js";

describe("UIBus", () => {
  it("delivers typed payloads to subscribers", () => {
    const bus = new UIBus();
    const messages = [];

    bus.on("ready", ({ message }) => {
      messages.push(message);
    });

    bus.emit("ready", { message: "online" });
    expect(messages).toEqual(["online"]);
  });

  it("unsubscribes handlers", () => {
    const bus = new UIBus();
    const messages = [];

    const unsubscribe = bus.on("ready", ({ message }) => {
      messages.push(message);
    });

    unsubscribe();
    bus.emit("ready", { message: "ignored" });
    expect(messages).toEqual([]);
  });
});
