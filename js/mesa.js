import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true // <--- ¡CRÍTICO! HABILITAR TRANSPARENCIA
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Asegura que el fondo sea transparente, no negro sólido
renderer.setClearColor(0x000000, 0); 

// Escena y cámara
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xe6ffe6); // COMENTADO/ELIMINADO: Usaremos el fondo CSS

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Posición Inicial y de Scroll de la Cámara
const INITIAL_CAMERA_Y = 15;
const SCROLL_CAMERA_Y = 5; 
camera.position.set(0, INITIAL_CAMERA_Y, 25); 
camera.lookAt(0, 0, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const shadow = new THREE.DirectionalLight(0xffffff, 0.9);
shadow.position.set(10, 20, 10);
scene.add(shadow);

const loader = new GLTFLoader();

let clickableObjects = [];
let mesa; 
let mandoObject; // Referencia para el mando

// Variables de Posición del Mando
const INITIAL_MANDO_Y = -15.0; // MUCHO MÁS ABAJO: Posición inicial oculta
const FINAL_MANDO_Y = 7.0;    // POSICIÓN FINAL: Visible sobre la mesa
const MESA_Y_POSITION = -3.0; // Posición de la mesa

// -------------------------------------------
// CARGAR MESA (Estática)
// -------------------------------------------
loader.load("modelos/billar5glb.glb", (gltf) => {
    mesa = gltf.scene;
    mesa.scale.set(6, 6, 6); 
    mesa.position.set(0, MESA_Y_POSITION, 0); 
    scene.add(mesa);
    loadObjects();
    loadMando(); 
});

// -------------------------------------------
// CARGAR OBJETOS SOBRE LA MESA (Dado y 1verde)
// -------------------------------------------
function loadObjects() {
    const forcedYPosition = FINAL_MANDO_Y; // Usamos la misma Y final que el mando
    
    // DADO (Juego UNO)
    loader.load("modelos/dado2.glb", (gltf) => {
        const obj = gltf.scene;
        obj.scale.set(1.5, 1.5, 1.5); 
        obj.position.set(2.0, forcedYPosition, 0); 
        obj.rotation.y = Math.PI / 8;
        scene.add(obj); 
        clickableObjects.push({ obj, url: "ocaInicio.html" });
    });

    // 1VERDE (Juego Oca)
    loader.load("modelos/1verde.glb", (gltf) => {
        const obj = gltf.scene;
        obj.scale.set(1.5, 1.5, 1.5); 
        obj.position.set(-2.0, forcedYPosition, 0); 
        obj.rotation.y = -Math.PI / 8;
        scene.add(obj); 
        clickableObjects.push({ obj, url: "uno.html" });
    });
}

// -------------------------------------------
// CARGAR MODELO MANDO (Juego Futuro)
// -------------------------------------------
function loadMando() {
    loader.load("modelos/Mando.glb", (gltf) => {
        mandoObject = gltf.scene;
        mandoObject.scale.set(1.8, 1.8, 1.8);      
        // Inicializamos en la posición oculta
        mandoObject.position.set(0.0, INITIAL_MANDO_Y, 0); 
        mandoObject.rotation.x = Math.PI / 2; 
        
        mandoObject.targetY = FINAL_MANDO_Y; // Posición destino
        mandoObject.initialY = INITIAL_MANDO_Y; // Posición inicial
        scene.add(mandoObject); 
        
        // Añadir a objetos clickeables para abrir el modal
        clickableObjects.push({ obj: mandoObject, url: "#modal" });
    });
}


// -------------------------------------------
// FUNCIÓN DE SCROLL (Zoom y Aparición del Mando)
// -------------------------------------------
const SCROLL_THRESHOLD = 50; 
const MANDO_SCROLL_OFFSET = 25; 

window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    
    // Interpolación de la cámara (zoom-in suave)
    const tCamera = Math.min(1, scrollY / SCROLL_THRESHOLD);
    camera.position.y = THREE.MathUtils.lerp(INITIAL_CAMERA_Y, SCROLL_CAMERA_Y, tCamera);
    
    // Mover el mando si está cargado
    if (mandoObject) {
        // Calculamos t para el mando, asegurando que solo suba después del offset
        const mandoScrollValue = Math.max(0, scrollY - MANDO_SCROLL_OFFSET);
        const tMando = Math.min(1, mandoScrollValue / SCROLL_THRESHOLD);
        
        // Mueve el mando desde INITIAL_MANDO_Y (oculto) a FINAL_MANDO_Y (visible) 
        mandoObject.position.y = THREE.MathUtils.lerp(
            mandoObject.initialY, 
            mandoObject.targetY, 
            tMando
        ); 
    }
});

// -------------------------------------------
// CLICK 3D → redirección / modal
// -------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const gameModal = document.getElementById('game-not-available-modal');


window.addEventListener("click", (e) => {
    if (gameModal && gameModal.classList.contains('visible')) return; 

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

        if (found) {
            if (found.url === "#modal") {
                if (gameModal) {
                    gameModal.classList.add('visible');
                }
            } else {
                window.location.href = found.url;
            }
        }
    }
});

// -------------------------------------------
// LOOP DE RENDER (Rotación Individual)
// -------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    // ROTACIÓN INDIVIDUAL
    clickableObjects.forEach(item => {
        if (item.obj !== mandoObject) {
            item.obj.rotation.y += 0.01; 
        }
    });
    
    // Pequeña rotación al mando si está visible
    if (mandoObject && window.scrollY > MANDO_SCROLL_OFFSET) {
        mandoObject.rotation.z += 0.005;
    }
    
    renderer.render(scene, camera);
}
animate();

// Ajuste ventana
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Cuando cargues el modelo de la carta y el dado, usa el mismo valor de escala.
// Ejemplo:
loadModel('model-carta', './modelos/carta.glb', 1.6);
loadModel('model-dado', './modelos/dado.glb', 1.6);