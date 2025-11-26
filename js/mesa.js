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

// AJUSTE DE CÁMARA (Mantenido en vista general)
camera.position.set(0, 15, 25); 
camera.lookAt(0, 0, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const shadow = new THREE.DirectionalLight(0xffffff, 0.9);
shadow.position.set(10, 20, 10);
scene.add(shadow);

const loader = new GLTFLoader();

let clickableObjects = [];
let mesa; 

// -------------------------------------------
// CARGAR MESA (Estática)
// -------------------------------------------
loader.load("modelos/mesa.glb", (gltf) => {
    mesa = gltf.scene;
    mesa.scale.set(6, 6, 6); 
    
    // 💥 MESA BAJA: Mantenemos la mesa en Y = -3.0
    const MESA_Y_POSITION = -3.0; 
    mesa.position.set(0, MESA_Y_POSITION, 0); 
    
    scene.add(mesa);

    loadObjects();
});

// -------------------------------------------
// CARGAR OBJETOS SOBRE LA MESA (Dado y 1verde)
// -------------------------------------------
function loadObjects() {
    // 💥 CRÍTICO: POSICIÓN Y MUY ELEVADA.
    // Subimos la posición Y a 7.0 (anteriormente era 4.0) para asegurar que 
    // el dado y el 1 verde estén flotando claramente por encima de la mesa.
    const forcedYPosition = 7.0; 
    
    // COORDENADAS 3D MANUALES
    const X_DADO = 2.0; 
    const Z_DADO = 0; 
    
    const X_1VERDE = -2.0; 
    const Z_1VERDE = 0; 
    
    // 📌 OBJETO 1: DADO (Juego UNO)
    loader.load("modelos/dado.glb", (gltf) => {
        const obj = gltf.scene;
        obj.scale.set(1.5, 1.5, 1.5); 
        
        // Se aplica la nueva Y
        obj.position.set(X_DADO, forcedYPosition, Z_DADO); 
        
        obj.rotation.y = Math.PI / 8;

        scene.add(obj); 
        clickableObjects.push({ obj, url: "uno.html" });
    });

    // 📌 OBJETO 2: 1VERDE (Juego Oca)
    loader.load("modelos/1verde.glb", (gltf) => {
        const obj = gltf.scene;
        obj.scale.set(1.5, 1.5, 1.5); 
        
        // Se aplica la nueva Y
        obj.position.set(X_1VERDE, forcedYPosition, Z_1VERDE); 
        
        obj.rotation.y = -Math.PI / 8;

        scene.add(obj); 
        clickableObjects.push({ obj, url: "oca.html" });
    });
}

// -------------------------------------------
// CLICK 3D → redirección (para los modelos GLB)
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
        const found = clickableObjects.find(clickable => {
            let current = intersect[0].object;
            while (current) {
                if (current === clickable.obj) return true;
                current = current.parent;
            }
            return false;
        });

        if (found) window.location.href = found.url;
    }
});

// -------------------------------------------
// LOOP DE RENDER (Rotación Individual)
// -------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    // ROTACIÓN INDIVIDUAL
    clickableObjects.forEach(item => {
        item.obj.rotation.y += 0.01; 
    });
    
    renderer.render(scene, camera);
}
animate();

// Ajuste ventana
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});