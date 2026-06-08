/**
 * PrefabLoader owns runtime instances for authored world chunks.
 *
 * W-03 only builds the Hearthmere camp. Later slices can make this distance
 * gated, but the API is already instance-based so streaming can be introduced
 * without rewriting prefab build functions.
 */

export class PrefabLoader {
  constructor(scene, rapier, registry, callbacks = {}) {
    this.instances = new Map();
    this.instanceAnchors = new Map();
    this.persistentInstanceIds = new Set();
    this.loadedChunks = new Set();
    this.scene = scene;
    this.rapier = rapier;
    this.registry = registry;
    this.callbacks = callbacks ?? {};
  }

  buildAll() {
    for (const anchor of this.registry.getPrefabAnchors()) {
      this.build(anchor.id);
    }
  }

  ensureChunk(cx, cz) {
    this.loadedChunks.add(prefabChunkKey(cx, cz));

    for (const anchor of this.registry.getPlacementsOverlappingChunk(cx, cz)) {
      this.buildForChunk(anchor);
    }
  }

  unloadChunk(cx, cz) {
    this.loadedChunks.delete(prefabChunkKey(cx, cz));

    for (const anchor of this.registry.getPlacementsOverlappingChunk(cx, cz)) {
      if (this.persistentInstanceIds.has(anchor.id)) continue;
      if (!this.instances.has(anchor.id)) continue;
      if (this.isPrefabCoveredByLoadedChunk(anchor.id)) continue;

      this.disposeInstance(anchor.id);
    }
  }

  build(id) {
    if (this.instances.has(id)) {
      this.persistentInstanceIds.add(id);
      return this.instances.get(id);
    }

    const anchor = this.registry.getAnchorById(id);
    if (!anchor) return null;

    const instance = this.createInstance(anchor);
    this.instances.set(id, instance);
    this.instanceAnchors.set(id, anchor);
    this.persistentInstanceIds.add(id);
    this.callbacks.onInstanceCreated?.(instance, anchor);
    return instance;
  }

  getInstance(id) {
    return this.instances.get(id) ?? null;
  }

  getPrimaryHearthlight() {
    for (const instance of this.instances.values()) {
      const hearthlight = instance.hearthlights?.[0];
      if (hearthlight) return hearthlight;
    }

    return null;
  }

  getHearthlights() {
    const hearthlights = [];

    for (const [instanceId, instance] of this.instances.entries()) {
      const instanceHearthlights = instance.hearthlights ?? [];
      for (let index = 0; index < instanceHearthlights.length; index += 1) {
        const hearthlight = instanceHearthlights[index];
        const position = hearthlight?.group?.position ?? null;
        hearthlights.push(Object.freeze({
          id: `${instanceId}:hearthlight:${index}`,
          instanceId,
          name: formatHearthlightName(instanceId, index),
          hearthlight,
          position: position
            ? Object.freeze({ x: position.x, y: position.y, z: position.z })
            : null
        }));
      }
    }

    return Object.freeze(hearthlights);
  }

  getBossArenas() {
    const bossArenas = [];

    for (const instance of this.instances.values()) {
      if (instance.bossArenas) {
        bossArenas.push(...instance.bossArenas);
      }
    }

    return bossArenas;
  }

  getActiveBossArena() {
    return this.getBossArenas().find((arena) => isActiveBossArena(arena)) ?? null;
  }

  isPlayerNearInteractable() {
    for (const instance of this.instances.values()) {
      if (instance.isPlayerNearInteractable?.()) return true;
    }

    return false;
  }

  update(dt, playerPosition, interactJustPressed, runtime) {
    for (const instance of this.instances.values()) {
      instance.update?.(dt, playerPosition, interactJustPressed, runtime);
    }
  }

  dispose() {
    for (const id of [...this.instances.keys()]) {
      this.disposeInstance(id);
    }

    this.persistentInstanceIds.clear();
    this.instanceAnchors.clear();
    this.loadedChunks.clear();
  }

  buildForChunk(anchor) {
    if (this.instances.has(anchor.id)) {
      return this.instances.get(anchor.id);
    }

    const instance = this.createInstance(anchor);
    this.instances.set(anchor.id, instance);
    this.instanceAnchors.set(anchor.id, anchor);
    this.callbacks.onInstanceCreated?.(instance, anchor);
    return instance;
  }

  createInstance(anchor) {
    const instance = anchor.build({
      scene: this.scene,
      rapier: this.rapier,
      origin: anchor.origin,
      anchor,
      callbacks: this.callbacks
    });

    assertPrefabInstance(anchor.id, instance);
    return instance;
  }

  isPrefabCoveredByLoadedChunk(id) {
    for (const key of this.loadedChunks) {
      const [cx, cz] = key.split(",").map(Number);
      const overlaps = this.registry.getPlacementsOverlappingChunk(cx, cz);

      if (overlaps.some((anchor) => anchor.id === id)) {
        return true;
      }
    }

    return false;
  }

  disposeInstance(id) {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.dispose();
    this.instances.delete(id);
    const anchor = this.instanceAnchors.get(id) ?? null;
    this.instanceAnchors.delete(id);
    this.callbacks.onInstanceDisposed?.(instance, anchor);
  }
}

function assertPrefabInstance(id, instance) {
  if (!instance || typeof instance !== "object") {
    throw new TypeError(`Prefab '${id}' build() must return an instance object.`);
  }

  if (typeof instance.dispose !== "function") {
    throw new TypeError(`Prefab '${id}' instance must provide dispose().`);
  }

  if (instance.update !== undefined && typeof instance.update !== "function") {
    throw new TypeError(`Prefab '${id}' instance update must be a function when provided.`);
  }

  if (
    instance.isPlayerNearInteractable !== undefined &&
    typeof instance.isPlayerNearInteractable !== "function"
  ) {
    throw new TypeError(`Prefab '${id}' instance isPlayerNearInteractable must be a function when provided.`);
  }

  if (instance.hearthlights !== undefined && !Array.isArray(instance.hearthlights)) {
    throw new TypeError(`Prefab '${id}' instance hearthlights must be an array when provided.`);
  }

  if (instance.bossArenas !== undefined && !Array.isArray(instance.bossArenas)) {
    throw new TypeError(`Prefab '${id}' instance bossArenas must be an array when provided.`);
  }
}

function isActiveBossArena(arena) {
  if (!arena || typeof arena !== "object") return false;
  if (arena.active === true) return true;
  if (arena.state === "active") return true;
  if (typeof arena.isActive === "function") return arena.isActive();
  return false;
}

function formatHearthlightName(instanceId, index) {
  const label = String(instanceId)
    .split(/[_\-.:]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return index === 0 ? `${label} Hearthlight` : `${label} Hearthlight ${index + 1}`;
}

function prefabChunkKey(cx, cz) {
  return `${cx},${cz}`;
}
