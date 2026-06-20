const canvas = document.querySelector("#starfield");
const ctx = canvas?.getContext("2d", { alpha: true });

if (canvas && ctx) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    active: false,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let animationFrame = 0;
  let lastTime = performance.now();

  const config = {
    maxStars: prefersReducedMotion ? 44 : 118,
    minStars: prefersReducedMotion ? 32 : 72,
    neighborRadius: 74,
    separationRadius: 24,
    pointerRadius: 210,
    pointerMinDistance: 58,
    maxSpeed: 0.58,
    maxForce: 0.018,
  };

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: randomRange(-0.18, 0.18),
      vy: randomRange(-0.18, 0.18),
      size: randomRange(0.8, 2.2),
      glow: randomRange(0.35, 0.95),
      phase: randomRange(0, Math.PI * 2),
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = Math.round(Math.min(config.maxStars, Math.max(config.minStars, (width * height) / 14500)));
    if (stars.length < targetCount) {
      while (stars.length < targetCount) stars.push(createStar());
    } else {
      stars = stars.slice(0, targetCount);
    }
  }

  function limitVelocity(star) {
    const speed = Math.hypot(star.vx, star.vy);
    if (speed > config.maxSpeed) {
      const scale = config.maxSpeed / speed;
      star.vx *= scale;
      star.vy *= scale;
    }
  }

  function applyBoids(star, index) {
    let separationX = 0;
    let separationY = 0;
    let cohesionX = 0;
    let cohesionY = 0;
    let alignX = 0;
    let alignY = 0;
    let neighbors = 0;

    for (let i = index + 1; i < stars.length; i += 1) {
      const other = stars[i];
      const dx = other.x - star.x;
      const dy = other.y - star.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > config.neighborRadius * config.neighborRadius || distanceSq < 0.01) continue;

      const distance = Math.sqrt(distanceSq);
      const weight = 1 - distance / config.neighborRadius;
      cohesionX += other.x;
      cohesionY += other.y;
      alignX += other.vx;
      alignY += other.vy;
      neighbors += 1;

      if (distance < config.separationRadius) {
        const push = (config.separationRadius - distance) / config.separationRadius;
        separationX -= (dx / distance) * push;
        separationY -= (dy / distance) * push;
        other.vx += (dx / distance) * push * 0.004;
        other.vy += (dy / distance) * push * 0.004;
      }

      if (distance < 56) {
        const lineAlpha = 0.08 * weight;
        ctx.strokeStyle = `rgba(130, 216, 209, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    if (neighbors > 0) {
      cohesionX = cohesionX / neighbors - star.x;
      cohesionY = cohesionY / neighbors - star.y;
      alignX = alignX / neighbors - star.vx;
      alignY = alignY / neighbors - star.vy;

      star.vx += cohesionX * 0.00008 + alignX * 0.006 + separationX * 0.012;
      star.vy += cohesionY * 0.00008 + alignY * 0.006 + separationY * 0.012;
    }
  }

  function applyPointerGravity(star) {
    if (!pointer.active) return;
    const dx = pointer.x - star.x;
    const dy = pointer.y - star.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSq = config.pointerRadius * config.pointerRadius;
    if (distanceSq > radiusSq || distanceSq < 0.01) return;

    const distance = Math.sqrt(distanceSq);
    const directionX = dx / distance;
    const directionY = dy / distance;

    if (distance < config.pointerMinDistance) {
      const repel = (config.pointerMinDistance - distance) / config.pointerMinDistance;
      star.vx -= directionX * repel * 0.09;
      star.vy -= directionY * repel * 0.09;
      return;
    }

    const gravity = (1 - distance / config.pointerRadius) * config.maxForce;
    star.vx += directionX * gravity;
    star.vy += directionY * gravity;
  }

  function wrap(star) {
    const margin = 24;
    if (star.x < -margin) star.x = width + margin;
    if (star.x > width + margin) star.x = -margin;
    if (star.y < -margin) star.y = height + margin;
    if (star.y > height + margin) star.y = -margin;
  }

  function drawStar(star, time) {
    const twinkle = 0.62 + Math.sin(time * 0.002 + star.phase) * 0.28;
    ctx.fillStyle = `rgba(244, 239, 229, ${star.glow * twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now) {
    const delta = Math.min((now - lastTime) / 16.67, 2);
    lastTime = now;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    if (pointer.active) {
      const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, config.pointerRadius);
      gradient.addColorStop(0, "rgba(216, 75, 75, 0.16)");
      gradient.addColorStop(0.32, "rgba(130, 216, 209, 0.07)");
      gradient.addColorStop(1, "rgba(130, 216, 209, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(pointer.x - config.pointerRadius, pointer.y - config.pointerRadius, config.pointerRadius * 2, config.pointerRadius * 2);
    }

    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      applyBoids(star, i);
      applyPointerGravity(star);
      star.vx += Math.sin(now * 0.00018 + star.phase) * 0.0009;
      star.vy += Math.cos(now * 0.00016 + star.phase) * 0.0009;
      limitVelocity(star);
      star.x += star.vx * delta;
      star.y += star.vy * delta;
      wrap(star);
      drawStar(star, now);
    }

    animationFrame = requestAnimationFrame(frame);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!animationFrame) {
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(frame);
    }
  });

  resize();
  animationFrame = requestAnimationFrame(frame);
}
