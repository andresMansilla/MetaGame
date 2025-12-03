import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Canvas
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true // HABILITAR TRANSPARENCIA
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0); 

// Escena y cámara
const scene = new THREE.Scene();
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
const INITIAL_MANDO_Y = -15.0; // Posición inicial oculta
const FINAL_MANDO_Y = 7.0;    // Posición final: Visible sobre la mesa
const MESA_Y_POSITION = -3.0; // Posición de la mesa

// -------------------------------------------
// OBTENER REFERENCIAS DE ELEMENTOS HTML
// -------------------------------------------
const futureGamesTable = document.getElementById('future-games-table');

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
    const forcedYPosition = FINAL_MANDO_Y; 
    
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
        mandoObject.position.set(0.0, INITIAL_MANDO_Y, 0); 
        mandoObject.rotation.x = Math.PI / 2; 
        
        mandoObject.targetY = FINAL_MANDO_Y; 
        mandoObject.initialY = INITIAL_MANDO_Y; 
        scene.add(mandoObject); 
        
        clickableObjects.push({ obj: mandoObject, url: "#modal" });
    });
}


// -------------------------------------------
// FUNCIÓN DE SCROLL (Zoom, Aparición Mando, Aparición Tabla)
// -------------------------------------------
const SCROLL_THRESHOLD = 50; 
const MANDO_SCROLL_OFFSET = 25; 
const TABLE_SCROLL_TRIGGER = 100; // El scroll necesario para mostrar la tabla

window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    
    // 1. Zoom de la cámara
    const tCamera = Math.min(1, scrollY / SCROLL_THRESHOLD);
    camera.position.y = THREE.MathUtils.lerp(INITIAL_CAMERA_Y, SCROLL_CAMERA_Y, tCamera);
    
    // 2. Mover el mando
    if (mandoObject) {
        const mandoScrollValue = Math.max(0, scrollY - MANDO_SCROLL_OFFSET);
        const tMando = Math.min(1, mandoScrollValue / SCROLL_THRESHOLD);
        
        mandoObject.position.y = THREE.MathUtils.lerp(
            mandoObject.initialY, 
            mandoObject.targetY, 
            tMando
        ); 
    }
    
    // 3. Lógica de Aparición de la Tabla
    if (futureGamesTable) {
        if (scrollY >= TABLE_SCROLL_TRIGGER) {
            futureGamesTable.style.bottom = '50px'; 
            futureGamesTable.style.opacity = '1';
            futureGamesTable.style.pointerEvents = 'auto';
        } else {
            futureGamesTable.style.bottom = '-100px'; 
            futureGamesTable.style.opacity = '0';
            futureGamesTable.style.pointerEvents = 'none';
        }
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