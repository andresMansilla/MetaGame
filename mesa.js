// Importar Three.js y OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Variables globales
let scene, camera, renderer, controls, mesa;

// Inicializar la escena
function init() {

    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    // Crear cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 3, 5);

    // Crear renderer
    const canvas = document.getElementById('three-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Agregar luces
    addLights();

    // Cargar modelo mesa.glb
    loadMesaModel();

    // Controles de cámara
    setupOrbitControls();

    // Resize
    window.addEventListener('resize', onWindowResize);

    animate();
}

// Cargar el modelo .glb
function loadMesaModel() {
    const loader = new GLTFLoader();

    loader.load('mesa.glb', (gltf) => {
        mesa = gltf.scene;
        mesa.position.set(0, -1, 0); // Ajusta la altura si queda hundida
        mesa.scale.set(1, 1, 1);     // Cambia el tamaño si hace falta
        mesa.castShadow = true;
        mesa.receiveShadow = true;
        scene.add(mesa);
    }, undefined, (error) => {
        console.error("ERROR al cargar mesa.glb:", error);
    });
}

// Luces
function addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    scene.add(directional);
}

// Orbit Controls
function setupOrbitControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
}

// Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animación
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}

// Iniciar
window.addEventListener('DOMContentLoaded', init);
