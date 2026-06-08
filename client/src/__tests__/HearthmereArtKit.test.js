import { describe, expect, it } from "@jest/globals";
import {
  createResourceNodeVisual,
  setObjectOpacity
} from "../world/art/HearthmereArtKit.js";
import { RESOURCE_DEFINITIONS } from "../world/resources/ResourceDefinitions.js";

function collectMeshes(root) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
}

describe("HearthmereArtKit", () => {
  it("creates multi-part generated visuals for each resource definition", () => {
    for (const definition of RESOURCE_DEFINITIONS) {
      const visual = createResourceNodeVisual(definition);
      const meshes = collectMeshes(visual.root);

      expect(visual.root.name).toBe(`resource-${definition.id}-visual`);
      expect(meshes.length).toBeGreaterThan(1);
      expect(meshes.some((mesh) => mesh.castShadow)).toBe(true);

      visual.dispose();
    }
  });

  it("applies depleted opacity across all resource visual materials", () => {
    const definition = RESOURCE_DEFINITIONS.find((def) => def.id === "wood");
    const visual = createResourceNodeVisual(definition);

    setObjectOpacity(visual.root, 0.25);

    for (const mesh of collectMeshes(visual.root)) {
      expect(mesh.material.transparent).toBe(true);
      expect(mesh.material.opacity).toBe(0.25);
    }

    visual.dispose();
  });
});
