import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const container = document.querySelector("#fbxViewer");
const status = document.querySelector("#fbxStatus");

if (!container) {
  throw new Error("FBX viewer container not found.");
}

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 2000);
camera.position.set(0, 1.4, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.8, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xcfefff, 0x35221c, 2.2));

const keyLight = new THREE.DirectionalLight(0xffe2b8, 3.2);
keyLight.position.set(4, 6, 4);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x69e7ff, 1.9);
rimLight.position.set(-4, 2.4, -3);
scene.add(rimLight);

const grid = new THREE.GridHelper(8, 24, 0x69e7ff, 0x26384f);
grid.material.transparent = true;
grid.material.opacity = 0.24;
scene.add(grid);

const loader = new FBXLoader();
let mixer = null;
let model = null;
let isUserInteracting = false;
let isViewerVisible = true;
let animationFrame = 0;
const clock = new THREE.Clock();

controls.addEventListener("start", () => {
  isUserInteracting = true;
});

controls.addEventListener("end", () => {
  isUserInteracting = false;
});

loader.load(
  "picking-up-object.fbx",
  (object) => {
    model = object;
    mixer = object.animations.length ? new THREE.AnimationMixer(object) : null;
    if (mixer) {
      mixer.clipAction(object.animations[0]).play();
    }

    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({ color: 0xd8e3f1, roughness: 0.55 });
        }
      }
    });

    fitModel(object);
    scene.add(object);
    status.textContent = "Drag to rotate / Scroll to zoom";
  },
  (event) => {
    if (event.total) {
      const progress = Math.round((event.loaded / event.total) * 100);
      status.textContent = `Loading FBX model... ${progress}%`;
    }
  },
  (error) => {
    console.error(error);
    status.textContent = "模型載入失敗。請用 node server.js 後從 http://127.0.0.1:5500/ 開啟。";
  }
);

function fitModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.8 / maxAxis;

  object.scale.multiplyScalar(scale);
  object.position.sub(center.multiplyScalar(scale));

  const scaledBox = new THREE.Box3().setFromObject(object);
  const scaledSize = scaledBox.getSize(new THREE.Vector3());
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  controls.target.copy(scaledCenter);

  const distance = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 1.75;
  camera.position.set(scaledCenter.x + distance, scaledCenter.y + distance * 0.55, scaledCenter.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.update();
}

function resize() {
  const rect = container.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function animate() {
  if (!isViewerVisible) {
    animationFrame = 0;
    return;
  }

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (model && !isUserInteracting) model.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
const observer = new IntersectionObserver(
  ([entry]) => {
    isViewerVisible = entry.isIntersecting;
    if (isViewerVisible && !animationFrame) {
      clock.getDelta();
      animate();
    }
  },
  { threshold: 0.08 }
);
observer.observe(container);
resize();
animate();
