// IMPORTAR THREE Y GLTF LOADER DESDE CDN (si no usas Node)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

// --------------------
// CONFIGURAR ESCENA
// --------------------
const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();

// Luz ambiental suave
scene.add(new THREE.AmbientLight(0xffffff, 2));

// Cámara
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 4);

// --------------------
// CARGAR MODELO GLB
// --------------------
const loader = new GLTFLoader();

loader.load(
  "assets/mesa.glb",  // ← Ruta relativa para Git y Live Server
  (gltf) => {
    const model = gltf.scene;
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);
  },
  undefined,
  (err) => console.error("Error cargando GLB:", err)
);

// --------------------
// ANIMACIÓN
// --------------------
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// --------------------
// RESPONSIVE
// --------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
