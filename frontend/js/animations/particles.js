export function startAmbientParticles(canvas) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  const context = canvas.getContext("2d");
  const particles = createParticles(44);
  let animationFrame = 0;
  let width = 0;
  let height = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += Math.sin(Date.now() * 0.0004 + particle.phase) * 0.12;

      if (particle.y < -20) {
        particle.y = height + Math.random() * 120;
        particle.x = Math.random() * width;
      }

      context.beginPath();
      context.fillStyle = particle.color;
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  function handleVisibility() {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      return;
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    stop() {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}

function createParticles(count) {
  const colors = [
    "rgba(216, 175, 98, 0.32)",
    "rgba(232, 105, 47, 0.24)",
    "rgba(84, 169, 183, 0.18)",
    "rgba(245, 234, 214, 0.16)"
  ];

  return Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: 0.8 + Math.random() * 2.2,
    speed: 0.12 + Math.random() * 0.38,
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
}
