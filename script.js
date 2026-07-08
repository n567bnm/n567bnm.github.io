const book = document.querySelector("#book");
const dots = [...document.querySelectorAll(".nav-dot")];
const pages = [...document.querySelectorAll(".page")];
const logoParallax = document.querySelector("#logoParallax");
const logoLayers = [...document.querySelectorAll("[data-logo-layer]")];
const coverPage = document.querySelector(".cover-page");
const stardustCanvas = document.querySelector("#stardustCanvas");
const artPreviewImage = document.querySelector("#artPreviewImage");
const artPreviewTitle = document.querySelector("#artPreviewTitle");
const artPreview = document.querySelector(".art-preview");
const artGallery = document.querySelector(".art-gallery");
const artThumbs = [...document.querySelectorAll(".art-thumb")];
const workSubtitleItems = [...document.querySelectorAll("[data-work-subtitle]")];
const workPanels = [...document.querySelectorAll("[data-work-panel]")];
const sceneTopics = [...document.querySelectorAll(".scene-topic")];
const projectTabs = [...document.querySelectorAll("[data-project-tab]")];
const projectPanels = [...document.querySelectorAll("[data-project-panel]")];
const projectDetails = [...document.querySelectorAll("[data-project-detail]")];
const landscapeButton = document.querySelector(".landscape-button");
const orientationStatus = document.querySelector(".orientation-status");

async function openLandscapeView() {
  if (!screen.orientation?.lock) {
    if (orientationStatus) orientationStatus.textContent = "此瀏覽器無法自動旋轉，請手動將手機轉為橫向。";
    return;
  }

  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    await screen.orientation.lock("landscape");
  } catch {
    if (orientationStatus) orientationStatus.textContent = "無法鎖定方向；請允許全螢幕後手動轉為橫向。";
  }
}

landscapeButton?.addEventListener("click", openLandscapeView);

document.documentElement.classList.add("js-ready");

let activePage = 0;
let wheelLocked = false;
let artAutoTimer = null;
let artAutoPaused = false;
let activeWorkSubsection = 0;
let activeProject = null;
let deviceMotionEnabled = false;
const sceneManualTimers = new WeakMap();

function goToPage(index) {
  const nextIndex = Math.max(0, Math.min(index, pages.length - 1));
  setActivePage(nextIndex);
  book.scrollTo({ top: nextIndex * book.clientHeight, behavior: "smooth" });
}

function setActivePage(index) {
  activePage = index;
  document.documentElement.style.setProperty("--active-page", index);
  dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => goToPage(Number(dot.dataset.page)));
});

function setWorkSubsection(index) {
  const nextIndex = Math.max(0, Math.min(index, workPanels.length - 1));
  activeWorkSubsection = nextIndex;
  workSubtitleItems.forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.workSubtitle) === nextIndex);
  });
  workPanels.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.workPanel) === nextIndex);
  });
}

workSubtitleItems.forEach((item) => {
  item.addEventListener("click", () => setWorkSubsection(Number(item.dataset.workSubtitle)));
});

function setProject(index) {
  const requestedIndex = Math.max(0, Math.min(index, projectPanels.length - 1));
  const nextIndex = activeProject === requestedIndex ? null : requestedIndex;
  activeProject = nextIndex;
  const hasActiveProject = nextIndex !== null;
  document.documentElement.classList.toggle("project-expanded", hasActiveProject);

  projectTabs.forEach((tab) => {
    const isActive = hasActiveProject && Number(tab.dataset.projectTab) === nextIndex;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-expanded", String(isActive));
  });
  projectPanels.forEach((panel) => {
    const isActive = hasActiveProject && Number(panel.dataset.projectPanel) === nextIndex;
    panel.classList.toggle("active", isActive);
    panel.classList.toggle("is-collapsed", hasActiveProject && !isActive);
  });
  projectDetails.forEach((detail) => {
    detail.classList.toggle("active", hasActiveProject && Number(detail.dataset.projectDetail) === nextIndex);
  });
}

projectTabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.stopPropagation();
    setProject(Number(tab.dataset.projectTab));
  });
});

projectPanels.forEach((panel) => {
  panel.addEventListener("click", (event) => {
    if (!panel.classList.contains("active")) return;
    if (event.target.closest("a")) return;
    setProject(Number(panel.dataset.projectPanel));
  });
});

function setSceneSlide(topic, index) {
  const slides = [...topic.querySelectorAll(".topic-slides img")];
  if (slides.length <= 1) return;

  const nextIndex = ((index % slides.length) + slides.length) % slides.length;
  topic.dataset.activeSlide = String(nextIndex);
  topic.classList.add("is-manual");
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === nextIndex);
  });

  window.clearTimeout(sceneManualTimers.get(topic));
  sceneManualTimers.set(
    topic,
    window.setTimeout(() => {
      topic.classList.remove("is-manual");
    }, 1800),
  );
}

sceneTopics.forEach((topic) => {
  const slides = [...topic.querySelectorAll(".topic-slides img")];
  if (slides.length <= 1) return;

  topic.dataset.activeSlide = "0";
  slides[0].classList.add("active");

  topic.addEventListener("click", () => {
    const activeIndex = Number(topic.dataset.activeSlide || "0");
    setSceneSlide(topic, activeIndex + 1);
  });

  topic.addEventListener("mouseleave", () => {
    window.clearTimeout(sceneManualTimers.get(topic));
    topic.classList.remove("is-manual");
  });
});

function selectArtwork(thumb) {
  const src = thumb.dataset.src;
  const title = thumb.dataset.title;
  if (!src || !artPreviewImage || !artPreviewTitle) return;

  artPreviewImage.src = src;
  artPreviewImage.alt = title;
  artPreviewTitle.textContent = title;
  artPreviewImage.dataset.staticSrc = src;
  artPreviewImage.dataset.gifSrc = thumb.dataset.gif || "";
  artThumbs.forEach((item) => item.classList.toggle("active", item === thumb));
}

function startArtAutoplay() {
  if (!artThumbs.length || artAutoTimer) return;

  artAutoTimer = window.setInterval(() => {
    if (artAutoPaused || activePage !== 3) return;

    const activeIndex = Math.max(0, artThumbs.findIndex((thumb) => thumb.classList.contains("active")));
    const nextThumb = artThumbs[(activeIndex + 1) % artThumbs.length];
    selectArtwork(nextThumb);
  }, 3600);
}

artThumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    selectArtwork(thumb);
  });

  thumb.addEventListener("mouseenter", () => {
    const gif = thumb.dataset.gif;
    if (!gif) return;

    const thumbImage = thumb.querySelector("img");
    if (thumbImage) thumbImage.src = gif;

    if (artPreviewImage && artPreviewImage.dataset.staticSrc === thumb.dataset.src) {
      artPreviewImage.src = gif;
    }
  });

  thumb.addEventListener("mouseleave", () => {
    const gif = thumb.dataset.gif;
    const src = thumb.dataset.src;
    if (!gif || !src) return;

    const thumbImage = thumb.querySelector("img");
    if (thumbImage) thumbImage.src = src;

    if (artPreviewImage && artPreviewImage.dataset.staticSrc === src) {
      artPreviewImage.src = src;
    }
  });
});

if (artGallery) {
  artGallery.addEventListener("mouseenter", () => {
    artAutoPaused = true;
  });

  artGallery.addEventListener("mouseleave", () => {
    artAutoPaused = false;
  });
}

if (artPreviewImage) {
  artPreviewImage.dataset.staticSrc = artPreviewImage.getAttribute("src") || "";
  artPreviewImage.dataset.gifSrc = "";
  startArtAutoplay();
}

if (artPreview) {
  artPreview.addEventListener("mouseenter", () => {
    if (!artPreviewImage?.dataset.gifSrc) return;
    artPreviewImage.src = artPreviewImage.dataset.gifSrc;
  });

  artPreview.addEventListener("mouseleave", () => {
    if (!artPreviewImage?.dataset.staticSrc) return;
    artPreviewImage.src = artPreviewImage.dataset.staticSrc;
  });
}

const pageObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const index = pages.indexOf(visible.target);
    if (index !== -1 && index !== activePage) setActivePage(index);
  },
  {
    root: book,
    threshold: [0.52, 0.66, 0.8],
  },
);

pages.forEach((page) => pageObserver.observe(page));

book.addEventListener("scroll", () => {
  const index = Math.round(book.scrollTop / book.clientHeight);
  if (index !== activePage) setActivePage(index);
});

book.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (wheelLocked) return;

    const direction = event.deltaY > 0 ? 1 : -1;
    if (direction === 0) return;

    wheelLocked = true;
    if (activePage === 2 && workPanels.length) {
      const nextSubsection = activeWorkSubsection + direction;
      if (nextSubsection >= 0 && nextSubsection < workPanels.length) {
        setWorkSubsection(nextSubsection);
      } else {
        goToPage(activePage + direction);
      }
    } else {
      goToPage(activePage + direction);
    }
    window.setTimeout(() => {
      wheelLocked = false;
    }, 780);
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown") {
    if (activePage === 2 && activeWorkSubsection < workPanels.length - 1) setWorkSubsection(activeWorkSubsection + 1);
    else goToPage(activePage + 1);
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    if (activePage === 2 && activeWorkSubsection > 0) setWorkSubsection(activeWorkSubsection - 1);
    else goToPage(activePage - 1);
  }
});

logoLayers.forEach((layer) => {
  const depth = Number(layer.dataset.depth);
  if (Number.isFinite(depth)) layer.style.setProperty("--layer-depth", depth);
});

function isCoverVisible() {
  if (!logoParallax) return;
  const coverRect = coverPage?.getBoundingClientRect();
  return coverRect && coverRect.top <= 0 && coverRect.bottom >= window.innerHeight * 0.55;
}

function applyLogoParallax(x, y) {
  if (!logoParallax || !isCoverVisible()) return;

  const limitedX = Math.max(-0.5, Math.min(0.5, x));
  const limitedY = Math.max(-0.5, Math.min(0.5, y));

  logoParallax.style.setProperty("--logo-x", `${limitedX * -52}px`);
  logoParallax.style.setProperty("--logo-y", `${limitedY * -38}px`);
  logoParallax.style.setProperty("--logo-tilt", `${limitedX * -2.8}deg`);
  logoParallax.style.setProperty("--aura-x", `${limitedX * 42}px`);
  logoParallax.style.setProperty("--aura-y", `${limitedY * 32}px`);
  logoParallax.style.setProperty("--spark-x", `${limitedX * -56}px`);
  logoParallax.style.setProperty("--spark-y", `${limitedY * -40}px`);
  logoParallax.style.transform = "translate3d(0, 0, 0)";
}

function resetLogoParallax() {
  if (!logoParallax) return;
  logoParallax.style.transform = "translate3d(0, 0, 0)";
  logoParallax.style.setProperty("--logo-x", "0px");
  logoParallax.style.setProperty("--logo-y", "0px");
  logoParallax.style.setProperty("--logo-tilt", "0deg");
  logoParallax.style.setProperty("--aura-x", "0px");
  logoParallax.style.setProperty("--aura-y", "0px");
  logoParallax.style.setProperty("--spark-x", "0px");
  logoParallax.style.setProperty("--spark-y", "0px");
}

window.addEventListener("mousemove", (event) => {
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;
  applyLogoParallax(x, y);
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (!touch) return;

  const x = touch.clientX / window.innerWidth - 0.5;
  const y = touch.clientY / window.innerHeight - 0.5;
  applyLogoParallax(x, y);
}, { passive: true });

window.addEventListener("deviceorientation", (event) => {
  if (!isCoverVisible()) return;

  const gamma = Number(event.gamma) || 0;
  const beta = Number(event.beta) || 0;
  const x = Math.max(-1, Math.min(1, gamma / 34)) * 0.5;
  const y = Math.max(-1, Math.min(1, (beta - 45) / 38)) * 0.5;
  applyLogoParallax(x, y);
});

window.addEventListener("mouseleave", () => {
  resetLogoParallax();
});

window.addEventListener("touchend", resetLogoParallax);

window.addEventListener("touchstart", async () => {
  if (deviceMotionEnabled || typeof DeviceOrientationEvent === "undefined") return;
  deviceMotionEnabled = true;

  if (typeof DeviceOrientationEvent.requestPermission !== "function") return;

  try {
    await DeviceOrientationEvent.requestPermission();
  } catch {
    deviceMotionEnabled = false;
  }
}, { passive: true });

const canvas = document.querySelector("#modelCanvas");

if (canvas) {
  initModelPreview();
}

if (stardustCanvas) {
  initStardust();
}

function initStardust() {
  const ctx = stardustCanvas.getContext("2d");
  const particles = [];
  const mouse = { x: -9999, y: -9999, active: false };
  const particleCount = Math.min(300, Math.max(150, Math.floor((window.innerWidth * window.innerHeight) / 5200)));
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function randomParticle() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    return {
      x,
      y,
      homeX: x,
      homeY: y,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      size: Math.random() * 2.4 + 0.75,
      alpha: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  function resizeStardust() {
    const rect = stardustCanvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
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
    gradient.addColorStop(0, `rgba(246, 248, 255, ${particle.alpha})`);
    gradient.addColorStop(0.35, `rgba(159, 219, 255, ${particle.alpha * 0.34})`);
    gradient.addColorStop(1, "rgba(159, 219, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function animateStardust() {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const distance = Math.hypot(dx, dy);
      const repelRadius = 190;

      if (mouse.active && distance < repelRadius) {
        const force = (1 - distance / repelRadius) * 3.8;
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
      particle.homeX += Math.sin(particle.twinkle * 0.24) * 0.016;
      particle.homeY += Math.cos(particle.twinkle * 0.2) * 0.014;
      particle.twinkle += 0.025;

      drawParticle(particle);
    }

    requestAnimationFrame(animateStardust);
  }

  coverPage.addEventListener("mousemove", (event) => {
    const rect = coverPage.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  });

  coverPage.addEventListener("mouseleave", () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener("resize", resizeStardust);
  resizeStardust();
  animateStardust();
}

async function initModelPreview() {
  let THREE;
  let FBXLoader;

  try {
    [THREE, { FBXLoader }] = await Promise.all([
      import("https://unpkg.com/three@0.165.0/build/three.module.js"),
      import("https://unpkg.com/three@0.165.0/examples/jsm/loaders/FBXLoader.js"),
    ]);
  } catch {
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
  camera.position.set(0, 1.2, 6);

  const group = new THREE.Group();
  scene.add(group);

  const hemiLight = new THREE.HemisphereLight(0xd8f4ff, 0x101421, 2.2);
  const keyLight = new THREE.DirectionalLight(0x9bdfff, 3);
  keyLight.position.set(3, 4, 4);
  const rimLight = new THREE.DirectionalLight(0xb9a4ff, 2.6);
  rimLight.position.set(-4, 2, -3);
  scene.add(hemiLight, keyLight, rimLight);

  const loader = new FBXLoader();
  loader.setPath("./axe/source/");
  loader.load(
    "axe.fbx",
    (object) => {
      object.scale.setScalar(0.018);
      object.rotation.set(-0.26, 0.45, -0.2);
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(object);
    },
    undefined,
    () => {
      const geometry = new THREE.OctahedronGeometry(1.5, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x9fdbff,
        metalness: 0.65,
        roughness: 0.32,
        wireframe: true,
      });
      group.add(new THREE.Mesh(geometry, material));
    },
  );

  function resizeRenderer() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }

  function animate() {
    resizeRenderer();
    group.rotation.y += 0.006;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
