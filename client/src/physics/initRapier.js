export async function initRapier() {
  const rapierModule = await import(
    /* webpackChunkName: "rapier" */
    "@dimforge/rapier3d-compat"
  );
  const rapier = rapierModule.default ?? rapierModule;

  await rapier.init({});

  return {
    module: rapier,
    world: new rapier.World({
      x: 0,
      y: -9.81,
      z: 0
    })
  };
}
