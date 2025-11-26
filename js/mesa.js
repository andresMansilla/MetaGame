import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Escena y cámara
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6ffe6);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 12, 20);
camera.lookAt(0, 0, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const shadow = new THREE.DirectionalLight(0xffffff, 0.9);
shadow.position.set(10, 20, 10);
scene.add(shadow);

const loader = new GLTFLoader();

let clickableObjects = [];

// -------------------------------------------
// FUNCIÓN: convierte un DIV a punto 3D exacto
// -------------------------------------------
function divTo3D(divId) {
  const div = document.getElementById(divId);
  const rect = div.getBoundingClientRect();

  // centro del div
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // normalizar a coordenadas (-1,1)
  const x = (cx / window.innerWidth) * 2 - 1;
  const y = - (cy / window.innerHeight) * 2 + 1;

  // convertir a vector 3D enfrente de la cámara
  const vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  const distance = (0 - camera.position.y) / dir.y;  // plano Y = 0
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  return pos;
}

// -------------------------------------------
// CARGAR MESA
// -------------------------------------------
loader.load("modelos/mesa.glb", (gltf) => {
  const mesa = gltf.scene;
  mesa.scale.set(6, 6, 6);
  mesa.position.set(0, -2, 0);
  scene.add(mesa);

  loadObjects();
});

// -------------------------------------------
// CARGAR OBJETOS SOBRE LOS DIVS
// -------------------------------------------
function loadObjects() {

  // 📌 posición exacta sobre el div UNO (bloque)
  const p1 = divTo3D("uno1");

  loader.load("modelos/1verde.glb", (gltf) => {
    const obj = gltf.scene;
    obj.scale.set(1.4, 1.4, 1.4);
    obj.position.copy(p1);
    obj.rotation.y = Math.PI / 8;
    scene.add(obj);
    clickableObjects.push({ obj, url: "uno.html" });
  });

  // 📌 posición exacta sobre el div DOS (pato)
  const p2 = divTo3D("uno2");

  loader.load("modelos/patoamarillo.glb", (gltf) => {
    const obj = gltf.scene;
    obj.scale.set(1.6, 1.6, 1.6);
    obj.position.copy(p2);
    obj.rotation.y = -Math.PI / 8;
    scene.add(obj);
    clickableObjects.push({ obj, url: "oca.html" });
  });
}

// -------------------------------------------
// CLICK 3D → redirección
// -------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersect = raycaster.intersectObjects(
    clickableObjects.map(o => o.obj), true
  );

  if (intersect.length > 0) {
    const found = clickableObjects.find(o =>
      intersect[0].object === o.obj ||
      intersect[0].object.parent === o.obj
    );
    if (found) window.location.href = found.url;
  }
});

// -------------------------------------------
// LOOP DE RENDER (estático)
// -------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Ajuste ventana
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
