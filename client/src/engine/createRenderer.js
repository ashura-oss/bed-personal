import {
  ACESFilmicToneMapping,
  NoToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  WebGLRenderer
} from "three";

export function createRenderer(container) {
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping ?? NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);
  return renderer;
}

export function resizeRenderer(renderer, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  const canvas = renderer.domElement;
  const needsResize =
    canvas.width !== Math.floor(width * renderer.getPixelRatio())
    || canvas.height !== Math.floor(height * renderer.getPixelRatio());

  if (needsResize) {
    renderer.setSize(width, height, false);
  }

  return needsResize;
}
