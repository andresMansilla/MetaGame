import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1️⃣ Canvas y Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 2️⃣ Escena y cámara
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

// 3️⃣ Luces
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 0.9);
directional.position.set(10, 20, 10);
scene.add(directional);

// 4️⃣ Loader
const loader = new GLTFLoader();

// Objetos clicables
let clickableObjects = [];

// 4a️⃣ Mesa
let mesa;
loader.load(
    'modelos/mesa.glb',
    (gltf) => {
        mesa = gltf.scene;
        mesa.scale.set(6, 6, 6); // más grande
        mesa.position.set(0, -2, 0);
        scene.add(mesa);

        // Después de cargar mesa, cargamos objetos
        cargarObjetos();
    },
    undefined,
    (err) => console.error('Error cargando mesa.glb:', err)
);

// 4b️⃣ Función para cargar los objetos encima de la mesa
function cargarObjetos() {
    // Bloque Verde (lleva a uno.html)
   // Bloque Verde (lleva a uno.html)
loader.load(
    'modelos/bloquoverde.glb',
    (gltf) => {
        const bloque = gltf.scene;
        bloque.scale.set(1.5, 1.5, 1.5);

        // Subimos por encima de la mesa
        bloque.position.set(-3, 4, 0); // y=4 para que esté arriba
        bloque.rotation.y = Math.PI / 8;
        scene.add(bloque);

        clickableObjects.push({ obj: bloque, url: 'uno.html' });
    },
    undefined,
    (err) => console.error('Error cargando bloquoverde.glb:', err)
);

// Tablero Oca (lleva a oca.html)
loader.load(
    'modelos/tableroOca.glb',
    (gltf) => {
        const tablero = gltf.scene;
        tablero.scale.set(1.8, 1.8, 1.8);

        // Subimos por encima de la mesa
        tablero.position.set(3, 4, 0); // y=4 para que esté arriba
        tablero.rotation.y = -Math.PI / 8;
        scene.add(tablero);

        clickableObjects.push({ obj: tablero, url: 'oca.html' });
    },
    undefined,
    (err) => console.error('Error cargando tableroOca.glb:', err)
);

}

// 5️⃣ Raycaster para clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
    // Convertir coordenadas del mouse a rango [-1,1]
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
        clickableObjects.map(o => o.obj), true
    );

    if (intersects.length > 0) {
        const clicked = clickableObjects.find(o => o.obj === intersects[0].object || intersects[0].object.parent === o.obj);
        if (clicked) {
            window.location.href = clicked.url;
        }
    }
}
window.addEventListener('click', onClick);

// 6️⃣ Animación
function animate() {
    requestAnimationFrame(animate);

    // Rotación lenta de la mesa
    if (mesa) mesa.rotation.y += 0.002;

    renderer.render(scene, camera);
}
animate();

// 7️⃣ Ajuste de ventana
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});
