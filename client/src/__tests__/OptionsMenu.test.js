/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { OptionsMenu } from "../ui/OptionsMenu.js";

describe("OptionsMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("applies master volume to all audio targets", () => {
    const mount = document.createElement("div");
    const audio = { setMasterVolume: jest.fn() };
    const music = { setMasterVolume: jest.fn() };

    const menu = new OptionsMenu(mount, [audio, music], jest.fn());

    expect(audio.setMasterVolume).toHaveBeenCalledWith(0.65);
    expect(music.setMasterVolume).toHaveBeenCalledWith(0.65);

    const slider = mount.querySelector("#opt-volume");
    slider.value = "0.2";
    slider.dispatchEvent(new Event("input", { bubbles: true }));

    expect(audio.setMasterVolume).toHaveBeenLastCalledWith(0.2);
    expect(music.setMasterVolume).toHaveBeenLastCalledWith(0.2);

    menu.dispose();
  });
});
