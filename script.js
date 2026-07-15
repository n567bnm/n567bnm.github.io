// 燈箱畫廊：點擊圖片放大，並可在同一組作品內前後瀏覽
const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");
const lightboxCount = lightbox.querySelector(".lightbox-count");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");

let currentGroup = [];
let currentIndex = 0;
let touchStartX = null;

function showImage(index) {
  const total = currentGroup.length;
  currentIndex = ((index % total) + total) % total;
  const image = currentGroup[currentIndex];

  lightboxImage.src = image.dataset.full || image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.alt;
  lightboxCount.textContent = total > 1 ? `${currentIndex + 1} / ${total}` : "";

  const showNav = total > 1;
  lightboxPrev.style.display = showNav ? "" : "none";
  lightboxNext.style.display = showNav ? "" : "none";
}

function openLightbox(group, index) {
  currentGroup = group;
  showImage(index);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  currentGroup = [];
  document.body.style.overflow = "";
}

// 每個圖片格（作品分類或專案縮圖）自成一組畫廊
document.querySelectorAll(".work-grid, .thumb-grid").forEach((grid) => {
  const images = [...grid.querySelectorAll("img")];
  images.forEach((image, index) => {
    image.addEventListener("click", () => openLightbox(images, index));
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => showImage(currentIndex - 1));
lightboxNext.addEventListener("click", () => showImage(currentIndex + 1));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showImage(currentIndex - 1);
  if (event.key === "ArrowRight") showImage(currentIndex + 1);
});

// 手機滑動切換
lightbox.addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0]?.clientX ?? null;
}, { passive: true });

lightbox.addEventListener("touchend", (event) => {
  if (touchStartX === null || currentGroup.length <= 1) return;
  const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  if (Math.abs(deltaX) > 48) showImage(currentIndex + (deltaX < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 封面 Logo 視差：滑鼠移動時各層輕微位移
const hero = document.querySelector(".hero");
const logoParallax = document.querySelector("#logoParallax");
const logoLayers = [...document.querySelectorAll("[data-depth]")];

logoLayers.forEach((layer) => {
  const depth = Number(layer.dataset.depth);
  if (Number.isFinite(depth)) layer.style.setProperty("--layer-depth", depth);
});

function isHeroVisible() {
  const rect = hero?.getBoundingClientRect();
  return rect && rect.bottom > 0 && rect.top < window.innerHeight * 0.6;
}

function applyLogoParallax(x, y) {
  if (!logoParallax || prefersReducedMotion || !isHeroVisible()) return;
  const limitedX = Math.max(-0.5, Math.min(0.5, x));
  const limitedY = Math.max(-0.5, Math.min(0.5, y));
  logoParallax.style.setProperty("--logo-x", `${limitedX * -44}px`);
  logoParallax.style.setProperty("--logo-y", `${limitedY * -32}px`);
}

function resetLogoParallax() {
  logoParallax?.style.setProperty("--logo-x", "0px");
  logoParallax?.style.setProperty("--logo-y", "0px");
}

window.addEventListener("mousemove", (event) => {
  applyLogoParallax(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
});

document.documentElement.addEventListener("mouseleave", resetLogoParallax);

// 封面星塵：微光粒子緩慢漂浮，滑鼠靠近會輕輕排開
const stardustCanvas = document.querySelector("#stardustCanvas");

if (stardustCanvas && hero && !prefersReducedMotion) {
  initStardust();
}

function initStardust() {
  const ctx = stardustCanvas.getContext("2d");
  const particles = [];
  const mouse = { x: -9999, y: -9999, active: false };
  const particleCount = Math.min(220, Math.max(110, Math.floor((window.innerWidth * window.innerHeight) / 7000)));
  let width = 0;
  let height = 0;

  function randomParticle() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    return {
      x,
      y,
      homeX: x,
      homeY: y,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      size: Math.random() * 2.4 + 0.75,
      alpha: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  function resizeStardust() {
    const rect = stardustCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    stardustCanvas.width = Math.floor(width * pixelRatio);
    stardustCanvas.height = Math.floor(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(randomParticle());
    }
  }

  function drawParticle(particle) {
    const pulse = Math.sin(particle.twinkle) * 0.28 + 0.72;
    const radius = particle.size * pulse;
    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 5);
    gradient.addColorStop(0, `rgba(237, 239, 245, ${particle.alpha})`);
    gradient.addColorStop(0.35, `rgba(159, 176, 255, ${particle.alpha * 0.34})`);
    gradient.addColorStop(1, "rgba(159, 176, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function animateStardust() {
    // 捲離封面時暫停繪製，節省效能
    if (!isHeroVisible()) {
      requestAnimationFrame(animateStardust);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const distance = Math.hypot(dx, dy);
      const repelRadius = 170;

      if (mouse.active && distance < repelRadius) {
        const force = (1 - distance / repelRadius) * 3.2;
        const angle = Math.atan2(dy, dx);
        particle.vx += Math.cos(angle) * force;
        particle.vy += Math.sin(angle) * force;
      }

      particle.vx += (particle.homeX - particle.x) * 0.002;
      particle.vy += (particle.homeY - particle.y) * 0.002;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.homeX += Math.sin(particle.twinkle * 0.24) * 0.014;
      particle.homeY += Math.cos(particle.twinkle * 0.2) * 0.012;
      particle.twinkle += 0.02;

      drawParticle(particle);
    }

    requestAnimationFrame(animateStardust);
  }

  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  });

  hero.addEventListener("mouseleave", () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener("resize", resizeStardust);
  resizeStardust();
  animateStardust();
}

// Logo 煙霧光暈：多團柔光緩慢流動，並隨滑鼠方向整片飄移
const hazeCanvas = document.querySelector("#logoHaze");

if (hazeCanvas && hero) {
  initLogoHaze();
}

function initLogoHaze() {
  const ctx = hazeCanvas.getContext("2d");
  const blobs = [];
  const BLOB_COUNT = 6;
  // 霧色：白、淡藍紫、淡紫
  const hazeColors = [
    [237, 239, 245],
    [159, 176, 255],
    [179, 168, 240],
  ];
  const flow = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 0;
  let height = 0;
  let time = Math.random() * 100;

  function buildBlobs() {
    blobs.length = 0;
    for (let index = 0; index < BLOB_COUNT; index += 1) {
      // 沿著 logo 的橫向帶狀區域散布
      const angle = (index / BLOB_COUNT) * Math.PI * 2;
      blobs.push({
        homeX: width * 0.5 + Math.cos(angle) * width * (0.07 + Math.random() * 0.1),
        homeY: height * 0.5 + Math.sin(angle) * height * (0.05 + Math.random() * 0.09),
        x: 0,
        y: 0,
        radius: Math.min(width, height) * (0.11 + Math.random() * 0.09),
        alpha: 0.08 + Math.random() * 0.08,
        color: hazeColors[index % hazeColors.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        depth: 0.35 + Math.random() * 0.65,
      });
    }
    // 中央常駐大光暈：撐起整體暈染感
    blobs.push({
      homeX: width * 0.5,
      homeY: height * 0.52,
      x: 0,
      y: 0,
      radius: Math.min(width, height) * 0.46,
      alpha: 0.12,
      color: [200, 214, 255],
      phase: Math.random() * Math.PI * 2,
      speed: 0.3,
      depth: 0.22,
    });

    blobs.forEach((blob) => {
      blob.x = blob.homeX;
      blob.y = blob.homeY;
    });
  }

  function resizeHaze() {
    const rect = hazeCanvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    hazeCanvas.width = Math.floor(width * pixelRatio);
    hazeCanvas.height = Math.floor(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildBlobs();
  }

  function drawHaze() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    for (const blob of blobs) {
      const breathe = Math.sin(time * blob.speed + blob.phase);
      const targetX =
        blob.homeX +
        Math.sin(time * blob.speed + blob.phase) * width * 0.03 +
        flow.x * blob.depth * width * 0.07;
      const targetY =
        blob.homeY +
        Math.cos(time * blob.speed * 0.8 + blob.phase * 1.7) * height * 0.04 +
        flow.y * blob.depth * height * 0.06;

      // 緩慢逼近目標位置，形成煙霧的延遲飄移感
      blob.x += (targetX - blob.x) * 0.045;
      blob.y += (targetY - blob.y) * 0.045;

      const radius = blob.radius * (1 + breathe * 0.18);
      const alpha = blob.alpha * (0.8 + breathe * 0.2);
      const [r, g, b] = blob.color;
      const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animateHaze() {
    if (!isHeroVisible()) {
      requestAnimationFrame(animateHaze);
      return;
    }

    time += 0.008;
    // 滑鼠方向緩慢滲入霧的流向
    flow.x += (flow.targetX - flow.x) * 0.03;
    flow.y += (flow.targetY - flow.y) * 0.03;
    drawHaze();
    requestAnimationFrame(animateHaze);
  }

  window.addEventListener("mousemove", (event) => {
    flow.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    flow.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  document.documentElement.addEventListener("mouseleave", () => {
    flow.targetX = 0;
    flow.targetY = 0;
  });

  window.addEventListener("resize", resizeHaze);
  resizeHaze();

  if (prefersReducedMotion) {
    drawHaze(); // 靜態光暈：不動畫，但保留塗層效果
  } else {
    animateHaze();
  }
}

// 技能條：捲動到 About 區塊時緩慢展開
const skillList = document.querySelector(".skill-list");

if (skillList) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        skillList.classList.add("revealed");
        observer.disconnect();
      }
    },
    { threshold: 0.4 },
  );
  observer.observe(skillList);
}
