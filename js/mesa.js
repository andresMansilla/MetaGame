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
let mandoObject; // NUEVA REFERENCIA: para el mando

// -------------------------------------------
// CARGAR MESA (Estática)
// -------------------------------------------
loader.load("modelos/billar5glb.glb", (gltf) => {
    mesa = gltf.scene;
    mesa.scale.set(6, 6, 6); 
    const MESA_Y_POSITION = -3.0; 
    mesa.position.set(0, MESA_Y_POSITION, 0); 
    scene.add(mesa);
    loadObjects();
    loadMando(); // Llama a la carga del mando
});

// -------------------------------------------
// CARGAR OBJETOS SOBRE LA MESA (Dado y 1verde)
// -------------------------------------------
function loadObjects() {
    const forcedYPosition = 7.0; 
    
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
// NUEVO: CARGAR MODELO MANDO (Juego Futuro)
// -------------------------------------------
function loadMando() {
    const INITIAL_MANDO_Y = -5.0; // Inicialmente oculto bajo la mesa
    const FINAL_MANDO_Y = 7.0; // Posición final sobre la mesa

    loader.load("modelos/Mando.glb", (gltf) => {
        mandoObject = gltf.scene;
        mandoObject.scale.set(1.8, 1.8, 1.8); 
        mandoObject.position.set(0.0, INITIAL_MANDO_Y, 0); 
        mandoObject.rotation.x = Math.PI / 2; 
        
        mandoObject.targetY = FINAL_MANDO_Y; // Guarda la posición destino
        scene.add(mandoObject); 
        
        // Añadir a objetos clickeables, usa un identificador único para el modal
        clickableObjects.push({ obj: mandoObject, url: "#modal" });
    });
}


// -------------------------------------------
// NUEVO: FUNCIÓN DE SCROLL
// -------------------------------------------
const SCROLL_THRESHOLD = 50; 

window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    
    // Interpolación de la cámara (zoom-in suave)
    const t = Math.min(1, scrollY / SCROLL_THRESHOLD);
    camera.position.y = THREE.MathUtils.lerp(INITIAL_CAMERA_Y, SCROLL_CAMERA_Y, t);
    
    // Mover el mando si está cargado
    if (mandoObject) {
        const mandoT = Math.min(1, (scrollY - 20) / SCROLL_THRESHOLD);
        // Mueve el mando desde INITIAL_MANDO_Y a FINAL_MANDO_Y 
        mandoObject.position.y = THREE.MathUtils.lerp(-5.0, mandoObject.targetY, mandoT); 
    }
});

// -------------------------------------------
// MODIFICADO: CLICK 3D → redirección / modal
// -------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Obtiene la referencia al modal del HTML
const gameModal = document.getElementById('game-not-available-modal');


window.addEventListener("click", (e) => {
    // No procesar clics 3D si el modal está abierto
    if (gameModal && gameModal.classList.contains('visible')) return; 

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersect = raycaster.intersectObjects(
        clickableObjects.map(o => o.obj), true
    );

    if (intersect.length > 0) {
        const found = clickableObjects.find(clickable => {
            // Bucle para encontrar el objeto principal que es clickeable
            let current = intersect[0].object;
            while (current) {
                if (current === clickable.obj) return true;
                current = current.parent;
            }
            return false;
        });

        if (found) {
            if (found.url === "#modal") {
                // Muestra el modal al hacer clic en el mando
                gameModal.classList.add('visible');
            } else {
                // Redirección normal para otros objetos
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
        // Solo rotamos el dado y el 1verde
        if (item.obj !== mandoObject) {
            item.obj.rotation.y += 0.01; 
        }
    });
    
    // Pequeña rotación al mando si está visible
    if (mandoObject && window.scrollY > SCROLL_THRESHOLD / 2) {
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