import { PerspectiveCamera, Vector3 } from "three";

export function createCamera(container) {
  const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
  const camera = new PerspectiveCamera(60, aspect, 0.1, 200);
  const target = new Vector3(0, 0.8, 0);
  camera.position.set(5.5, 4.2, 7.5);
  camera.lookAt(target);
  return { camera, target };
}

export function updateCameraAspect(camera, container) {
  camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
  camera.updateProjectionMatrix();
}
