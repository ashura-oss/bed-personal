const FIXED_DELTA_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;

export function startLoop(callbacks) {
  let animationFrameId = 0;
  let previousTime = performance.now();
  let accumulator = 0;
  let isRunning = true;

  const frame = (currentTime) => {
    if (!isRunning) {
      return;
    }

    const deltaSeconds = Math.min((currentTime - previousTime) / 1000, MAX_FRAME_SECONDS);
    previousTime = currentTime;
    accumulator += deltaSeconds;

    while (accumulator >= FIXED_DELTA_SECONDS) {
      callbacks.fixedUpdate(FIXED_DELTA_SECONDS);
      accumulator -= FIXED_DELTA_SECONDS;
    }

    callbacks.render(deltaSeconds);
    animationFrameId = window.requestAnimationFrame(frame);
  };

  animationFrameId = window.requestAnimationFrame(frame);

  return {
    stop: () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrameId);
    }
  };
}
