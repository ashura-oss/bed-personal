const DEFAULT_BIOME_LABEL = "Uncharted Wilds";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeId(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }

  return text
    .split(/[_\-.:\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readNumber(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function readPoint(source = {}) {
  const nestedChunk = source.chunk && typeof source.chunk === "object" ? source.chunk : {};
  const nestedPosition = source.position && typeof source.position === "object" ? source.position : {};
  const chunkX = readNumber(
    source.chunkX,
    source.cx,
    source.x,
    nestedChunk.x,
    nestedChunk.chunkX,
    nestedPosition.chunkX,
    nestedPosition.cx
  );
  const chunkZ = readNumber(
    source.chunkZ,
    source.cz,
    source.z,
    source.y,
    nestedChunk.z,
    nestedChunk.y,
    nestedChunk.chunkZ,
    nestedPosition.chunkZ,
    nestedPosition.cz
  );

  if (chunkX === null || chunkZ === null) {
    return null;
  }

  return {
    chunkX: Math.floor(chunkX),
    chunkZ: Math.floor(chunkZ)
  };
}

function readBiomeId(source = {}) {
  return normalizeText(source.biomeId)
    || normalizeText(source.biome?.id)
    || normalizeText(typeof source.biome === "string" ? source.biome : "");
}

function readBiomeName(source = {}) {
  const biomeId = readBiomeId(source);

  return normalizeText(source.biomeName)
    || normalizeText(source.biomeLabel)
    || normalizeText(source.biome?.label)
    || normalizeText(source.biome?.name)
    || humanizeId(biomeId)
    || DEFAULT_BIOME_LABEL;
}

function readArrayPayload(payload, keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readWorldMapUnlocked(payload = {}) {
  const mapPayload = payload.map && typeof payload.map === "object" ? payload.map : {};
  const worldMapPayload = payload.worldMap && typeof payload.worldMap === "object" ? payload.worldMap : {};
  const nestedWorldMapPayload = mapPayload.worldMap && typeof mapPayload.worldMap === "object"
    ? mapPayload.worldMap
    : {};

  return readBoolean(
    payload.worldMapUnlocked,
    payload.isWorldMapUnlocked,
    worldMapPayload.unlocked,
    worldMapPayload.worldMapUnlocked,
    mapPayload.worldMapUnlocked,
    mapPayload.isWorldMapUnlocked,
    nestedWorldMapPayload.unlocked,
    nestedWorldMapPayload.worldMapUnlocked
  );
}

function normalizeChunk(chunk, index = 0) {
  if (!chunk || typeof chunk !== "object") {
    return null;
  }

  const point = readPoint(chunk);
  if (!point) {
    return null;
  }

  const biomeId = readBiomeId(chunk);

  return Object.freeze({
    id: normalizeText(chunk.id) || `${point.chunkX}:${point.chunkZ}`,
    index,
    chunkX: point.chunkX,
    chunkZ: point.chunkZ,
    biomeId,
    biomeName: readBiomeName(chunk)
  });
}

function normalizePlayer(payload = {}) {
  const source = payload.playerChunk
    ?? payload.player
    ?? payload.playerPosition
    ?? payload.position;
  const point = readPoint(source ?? {});

  if (!point) {
    return null;
  }

  return Object.freeze(point);
}

function normalizeMarker(marker, index = 0) {
  if (!marker || typeof marker !== "object") {
    return null;
  }

  const markerType = normalizeText(marker.type || marker.kind);
  if (markerType && markerType.toLowerCase() !== "hearthlight") {
    return null;
  }

  const point = readPoint(marker);
  if (!point) {
    return null;
  }

  const id = normalizeText(marker.hearthlightId)
    || normalizeText(marker.markerId)
    || normalizeText(marker.id)
    || `hearthlight:${point.chunkX}:${point.chunkZ}`;
  const discovered = readBoolean(
    marker.discovered,
    marker.isDiscovered,
    marker.unlocked,
    marker.isUnlocked
  ) ?? false;

  return Object.freeze({
    id,
    index,
    chunkX: point.chunkX,
    chunkZ: point.chunkZ,
    name: normalizeText(marker.name) || normalizeText(marker.label) || humanizeId(id) || "Hearthlight",
    discovered,
    source: marker
  });
}

function readCurrentBiomeName(payload = {}, chunks = [], player = null) {
  const explicit = normalizeText(payload.currentBiomeName)
    || normalizeText(payload.currentBiomeLabel)
    || normalizeText(payload.biomeName)
    || normalizeText(payload.currentBiome?.label)
    || normalizeText(payload.currentBiome?.name)
    || normalizeText(payload.biome?.label)
    || normalizeText(payload.biome?.name)
    || normalizeText(typeof payload.currentBiome === "string" ? payload.currentBiome : "");
  if (explicit) {
    return explicit;
  }

  const id = normalizeText(payload.currentBiomeId)
    || normalizeText(payload.biomeId)
    || normalizeText(payload.currentBiome?.id)
    || normalizeText(payload.biome?.id);
  if (id) {
    return humanizeId(id);
  }

  if (player) {
    const playerChunk = chunks.find((chunk) => (
      chunk.chunkX === player.chunkX && chunk.chunkZ === player.chunkZ
    ));
    if (playerChunk) {
      return playerChunk.biomeName;
    }
  }

  return DEFAULT_BIOME_LABEL;
}

export function buildMinimapView(payload = {}) {
  const mapPayload = payload.map && typeof payload.map === "object" ? payload.map : {};
  const chunks = readArrayPayload(payload, ["exploredChunks", "chunks", "tiles"])
    .concat(readArrayPayload(mapPayload, ["exploredChunks", "chunks", "tiles"]))
    .map(normalizeChunk)
    .filter(Boolean);
  const markers = readArrayPayload(payload, ["hearthlights", "hearthlightMarkers", "markers"])
    .concat(readArrayPayload(mapPayload, ["hearthlights", "hearthlightMarkers", "markers"]))
    .map(normalizeMarker)
    .filter(Boolean);
  const player = normalizePlayer(payload) ?? normalizePlayer(mapPayload);

  return Object.freeze({
    chunks: Object.freeze(chunks),
    markers: Object.freeze(markers),
    player,
    currentBiomeName: readCurrentBiomeName(payload, chunks, player),
    worldMapUnlocked: readWorldMapUnlocked(payload) ?? false
  });
}

function buildBounds(view) {
  const points = [
    ...view.chunks,
    ...view.markers,
    ...(view.player ? [view.player] : [])
  ];

  if (points.length === 0) {
    return Object.freeze({
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
      width: 1,
      height: 1
    });
  }

  const xs = points.map((point) => point.chunkX);
  const zs = points.map((point) => point.chunkZ);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return Object.freeze({
    minX,
    maxX,
    minZ,
    maxZ,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxZ - minZ + 1)
  });
}

function setTilePosition(element, point, bounds) {
  const width = 100 / bounds.width;
  const height = 100 / bounds.height;

  element.style.left = `${(point.chunkX - bounds.minX) * width}%`;
  element.style.top = `${(point.chunkZ - bounds.minZ) * height}%`;
  element.style.width = `${width}%`;
  element.style.height = `${height}%`;
}

function setMarkerPosition(element, point, bounds) {
  const width = 100 / bounds.width;
  const height = 100 / bounds.height;

  element.style.left = `${((point.chunkX - bounds.minX) + 0.5) * width}%`;
  element.style.top = `${((point.chunkZ - bounds.minZ) + 0.5) * height}%`;
}

export class Minimap {
  constructor(bus, options = {}) {
    if (!bus || typeof bus.on !== "function" || typeof bus.emit !== "function") {
      throw new TypeError("Minimap: bus with on() and emit() is required");
    }

    const documentRef = options.document ?? (typeof document !== "undefined" ? document : null);
    if (!documentRef) {
      throw new Error("Minimap: document is required");
    }

    this.bus = bus;
    this.document = documentRef;
    this.unsubs = [];
    this.domCleanups = [];
    this.isOpen = options.isOpen !== false;
    const initialPayload = options.view && typeof options.view === "object"
      ? { ...options, ...options.view }
      : options;
    this.view = buildMinimapView(initialPayload);
    this.mount = options.mount ?? this.document.getElementById("app") ?? this.document.body;

    if (!this.mount) {
      throw new Error("Minimap: mount element is required");
    }

    this.root = this.createDOM();
    this.mount.appendChild(this.root);
    this.titleLabel = this.requireWithin(this.root, "[data-minimap-title]");
    this.biomeLabel = this.requireWithin(this.root, "[data-minimap-biome]");
    this.map = this.requireWithin(this.root, "[data-minimap-map]");
    this.tilesLayer = this.requireWithin(this.root, "[data-minimap-tiles]");
    this.markersLayer = this.requireWithin(this.root, "[data-minimap-markers]");
    this.playerIndicator = this.requireWithin(this.root, "[data-minimap-player]");
    this.emptyState = this.requireWithin(this.root, "[data-minimap-empty]");
    this.hearthlightCount = this.requireWithin(this.root, "[data-minimap-hearthlight-count]");

    this.bindDOM();
    this.bindUIBus();
    this.applyVisibility();
    this.render();
  }

  dispose() {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;

    for (const cleanup of this.domCleanups) {
      cleanup();
    }
    this.domCleanups.length = 0;

    this.root.remove();
  }

  setMinimap(payload = {}) {
    const worldMapUnlocked = readWorldMapUnlocked(payload);
    const nextView = buildMinimapView(payload);
    this.view = worldMapUnlocked === null
      ? Object.freeze({
        ...nextView,
        worldMapUnlocked: this.view.worldMapUnlocked
      })
      : nextView;
    this.render();
  }

  unlockWorldMap() {
    this.view = Object.freeze({
      ...this.view,
      worldMapUnlocked: true
    });
    this.open();
    this.render();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.applyVisibility();
    this.bus.emit("minimap:opened", {});
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.applyVisibility();
    this.bus.emit("minimap:closed", {});
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  applyVisibility() {
    this.root.hidden = !this.isOpen;
    this.root.setAttribute("aria-hidden", String(!this.isOpen));
  }

  requireWithin(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`Minimap: missing element "${selector}"`);
    }

    return element;
  }

  bindDOM() {
    const onMarkerClick = (event) => {
      const button = event.target.closest("[data-minimap-hearthlight-id]");
      if (!button || button.disabled) {
        return;
      }

      const marker = this.view.markers.find((candidate) => (
        candidate.id === button.dataset.minimapHearthlightId
      ));
      if (!marker || !marker.discovered) {
        return;
      }

      this.bus.emit("minimap:fastTravelRequested", {
        id: marker.id,
        markerId: marker.id,
        hearthlightId: marker.id,
        chunkX: marker.chunkX,
        chunkZ: marker.chunkZ,
        marker
      });
    };

    this.markersLayer.addEventListener("click", onMarkerClick);
    this.domCleanups.push(() => {
      this.markersLayer.removeEventListener("click", onMarkerClick);
    });
  }

  bindUIBus() {
    this.unsubs.push(
      this.bus.on("minimap:set", (payload) => {
        this.setMinimap(payload ?? {});
      }),
      this.bus.on("minimap:open", () => {
        this.open();
      }),
      this.bus.on("minimap:close", () => {
        this.close();
      }),
      this.bus.on("minimap:toggle", () => {
        this.toggle();
      }),
      this.bus.on("worldmap:unlocked", () => {
        this.unlockWorldMap();
      })
    );
  }

  render() {
    const bounds = buildBounds(this.view);
    const hasChunks = this.view.chunks.length > 0;
    const discoveredCount = this.view.markers.filter((marker) => marker.discovered).length;
    const mapTitle = this.view.worldMapUnlocked ? "World Map" : "Minimap";
    const mapLabel = this.view.worldMapUnlocked ? "world map" : "minimap";

    this.root.dataset.worldMapUnlocked = String(this.view.worldMapUnlocked);
    this.root.dataset.empty = String(!hasChunks);
    this.root.setAttribute("aria-label", mapTitle);
    this.titleLabel.textContent = mapTitle;
    this.biomeLabel.textContent = this.view.currentBiomeName;
    this.hearthlightCount.textContent = String(discoveredCount);
    this.emptyState.hidden = hasChunks;
    this.map.setAttribute("aria-label", `${this.view.currentBiomeName} ${mapLabel}`);

    this.renderTiles(bounds);
    this.renderMarkers(bounds);
    this.renderPlayer(bounds);
  }

  renderTiles(bounds) {
    this.tilesLayer.replaceChildren();

    for (const chunk of this.view.chunks) {
      const tile = this.document.createElement("div");
      tile.className = "minimap-tile";
      tile.dataset.chunkX = String(chunk.chunkX);
      tile.dataset.chunkZ = String(chunk.chunkZ);
      tile.dataset.biomeId = chunk.biomeId;
      tile.dataset.biomeName = chunk.biomeName;
      tile.title = chunk.biomeName;
      tile.setAttribute("aria-label", `Explored chunk ${chunk.chunkX}, ${chunk.chunkZ}, ${chunk.biomeName}`);
      setTilePosition(tile, chunk, bounds);
      this.tilesLayer.appendChild(tile);
    }
  }

  renderMarkers(bounds) {
    this.markersLayer.replaceChildren();

    for (const marker of this.view.markers) {
      const button = this.document.createElement("button");
      button.type = "button";
      button.className = "minimap-hearthlight";
      button.dataset.minimapHearthlightId = marker.id;
      button.dataset.chunkX = String(marker.chunkX);
      button.dataset.chunkZ = String(marker.chunkZ);
      button.dataset.discovered = String(marker.discovered);
      button.disabled = !marker.discovered;
      button.title = marker.discovered ? marker.name : "Undiscovered Hearthlight";
      button.setAttribute(
        "aria-label",
        marker.discovered ? `${marker.name} Hearthlight` : "Undiscovered Hearthlight"
      );
      setMarkerPosition(button, marker, bounds);
      this.markersLayer.appendChild(button);
    }
  }

  renderPlayer(bounds) {
    if (!this.view.player) {
      this.playerIndicator.hidden = true;
      return;
    }

    this.playerIndicator.hidden = false;
    this.playerIndicator.dataset.chunkX = String(this.view.player.chunkX);
    this.playerIndicator.dataset.chunkZ = String(this.view.player.chunkZ);
    setMarkerPosition(this.playerIndicator, this.view.player, bounds);
  }

  createDOM() {
    const root = this.document.createElement("section");
    root.id = "minimap-ui";
    root.dataset.gameInputBlocker = "true";
    root.setAttribute("aria-label", "Minimap");
    root.innerHTML = `
      <div class="minimap-header">
        <span class="minimap-title" data-minimap-title>Minimap</span>
        <span class="minimap-biome" data-minimap-biome></span>
      </div>
      <div class="minimap-map" role="img" data-minimap-map>
        <div class="minimap-tiles" data-minimap-tiles></div>
        <div class="minimap-markers" data-minimap-markers></div>
        <span class="minimap-player" data-minimap-player aria-label="Player position"></span>
        <span class="minimap-empty" data-minimap-empty>No mapped chunks</span>
      </div>
      <div class="minimap-footer">
        <span>Hearthlights</span>
        <span data-minimap-hearthlight-count>0</span>
      </div>
    `;

    return root;
  }
}
