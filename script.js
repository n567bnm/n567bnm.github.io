const root = document.documentElement;
const glow = document.querySelector(".cursor-glow");
const cosmicCursor = document.querySelector(".cosmic-cursor");
const stage = document.querySelector("#modelStage");
const parallaxItems = document.querySelectorAll("[data-float]");
const maxTilt = 18;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let pointerFrame = 0;
let stageFrame = 0;
let stagePointerEvent = null;
let lastRippleTime = 0;
let lastRippleX = pointerX;
let lastRippleY = pointerY;

stage.innerHTML = `
  <div class="css-scene" aria-hidden="true">
    <div class="orbit orbit-a"><span></span><span></span><span></span></div>
    <div class="orbit orbit-b"><span></span><span></span><span></span></div>
    <div class="model-core planet-mode">
      <i></i><i></i><i></i><i></i><i></i><i></i>
    </div>
    <div class="model-shadow"></div>
  </div>
`;

const scene = stage.querySelector(".css-scene");
const core = stage.querySelector(".model-core");

function updatePointerEffects() {
  pointerFrame = 0;
  const px = pointerX / window.innerWidth - 0.5;
  const py = pointerY / window.innerHeight - 0.5;

  root.style.setProperty("--x", `${pointerX}px`);
  root.style.setProperty("--y", `${pointerY}px`);
  root.style.setProperty("--mx", px.toFixed(4));
  root.style.setProperty("--my", py.toFixed(4));
  root.style.setProperty("--panel-tilt-x", `${(-py * maxTilt * 0.22).toFixed(2)}deg`);
  root.style.setProperty("--panel-tilt-y", `${(px * maxTilt * 0.22).toFixed(2)}deg`);
  if (glow) glow.style.opacity = "1";
  cosmicCursor?.classList.add("is-visible");

  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.float || 1);
    item.style.setProperty("--float-x", `${(px * depth).toFixed(2)}px`);
    item.style.setProperty("--float-y", `${(py * depth).toFixed(2)}px`);
  });
}

function spawnCursorRipple(x, y) {
  const ripple = document.createElement("span");
  ripple.className = "cursor-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

window.addEventListener(
  "pointermove",
  (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointerEffects);

    const now = performance.now();
    const dx = pointerX - lastRippleX;
    const dy = pointerY - lastRippleY;
    if (now - lastRippleTime > 95 && dx * dx + dy * dy > 900) {
      lastRippleTime = now;
      lastRippleX = pointerX;
      lastRippleY = pointerY;
      spawnCursorRipple(pointerX, pointerY);
    }
  },
  { passive: true }
);

window.addEventListener("pointerleave", () => {
  cosmicCursor?.classList.remove("is-visible");
});

function updateStageTilt() {
  stageFrame = 0;
  if (!stagePointerEvent) return;
  const rect = stage.getBoundingClientRect();
  const x = ((stagePointerEvent.clientX - rect.left) / rect.width - 0.5) * 26;
  const y = ((stagePointerEvent.clientY - rect.top) / rect.height - 0.5) * -18;
  scene.style.setProperty("--rx", `${y}deg`);
  scene.style.setProperty("--ry", `${x}deg`);
}

stage.addEventListener(
  "pointermove",
  (event) => {
    stagePointerEvent = event;
    if (!stageFrame) stageFrame = requestAnimationFrame(updateStageTilt);
  },
  { passive: true }
);

stage.addEventListener("pointerleave", () => {
  scene.style.setProperty("--rx", "0deg");
  scene.style.setProperty("--ry", "0deg");
});

const processItems = [
  {
    title: "概念與比例",
    text: "先建立剪影、視覺重心與世界觀關鍵字，讓後續模型細節都有一致方向。",
  },
  {
    title: "模型與拓撲",
    text: "依展示需求切分大型、中型與微細節，讓模型在近看與遠看時都有穩定層次。",
  },
  {
    title: "材質與光影",
    text: "用粗糙度、邊緣磨耗、發光與冷暖光源建立材質語言，強化作品辨識度。",
  },
  {
    title: "互動與呈現",
    text: "將模型放進可旋轉、可切換狀態的展示介面，讓觀看者主動探索作品。",
  },
];

document.querySelectorAll(".step").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.step);
    document.querySelectorAll(".step").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector("#processNumber").textContent = String(index + 1).padStart(2, "0");
    document.querySelector("#processTitle").textContent = processItems[index].title;
    document.querySelector("#processText").textContent = processItems[index].text;
  });
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".work-card").forEach((card) => {
      card.classList.toggle("is-hidden", filter !== "all" && card.dataset.category !== filter);
    });
  });
});

document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    core.className = `model-core ${mode}-mode`;
  });
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const galleryImages = ["mediator-01.jpg", "mediator-02.jpg", "mediator-03.jpg", "mediator-04.jpg"];

document.querySelectorAll(".gallery-shot").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.shot);
    lightboxImage.src = galleryImages[index];
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

document.querySelector(".lightbox-close")?.addEventListener("click", () => {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }
});
