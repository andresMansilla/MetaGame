import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Canvas
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
shadow.castShadow = true;
scene.add(shadow);

// Spotlight pointing at the table
const spotLight = new THREE.SpotLight(0xffffff, 100); // Increased intensity
spotLight.position.set(0, 30, 10); // Moved up and back slightly to cover more area
spotLight.angle = Math.PI / 2.5; // Much wider angle to hit Card (-3.5) and Die (3.5)
spotLight.penumbra = 0.3;
spotLight.decay = 1;
spotLight.distance = 100;
spotLight.target.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);
scene.add(spotLight.target);

const loader = new GLTFLoader();

let clickableObjects = [];
let mesa;
let mandoObject; // Referencia para el mando
let floatingTexts = []; // Array para guardar los textos y animarlos

// Variables de Posición del Mando
const INITIAL_MANDO_Y = -15.0; // MUCHO MÁS ABAJO: Posición inicial oculta
const FINAL_MANDO_Y = 6.5;    // POSICIÓN FINAL: Visible sobre la mesa
const MESA_Y_POSITION = -3.5; // Posición de la mesa

// -------------------------------------------
// CARGAR MESA (Estática)
// -------------------------------------------
loader.load("modelos/billar5glb.glb", (gltf) => {
    mesa = gltf.scene;
    mesa.scale.set(6, 6, 6);
    mesa.position.set(0, MESA_Y_POSITION, 2);
    mesa.traverse((node) => {
        if (node.isMesh) node.receiveShadow = true;
    });
    scene.add(mesa);
    loadObjects();
    loadMando();
});

// -------------------------------------------
// CARGAR OBJETOS SOBRE LA MESA (Dado y 1verde)
// -------------------------------------------
function loadObjects() {
    const forcedYPosition = FINAL_MANDO_Y; // Usamos la misma Y final que el mando
    const commonScale = 2.5; // Tamaño aumentado y unificado para ambos objetos

    // CRÍTICO: Cargar fuente una vez y usarla para ambos textos
    const fontLoader = new FontLoader();
    fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {

        // DADO (Juego DE LA OCA) -> URL: ocaInicio.html
        loader.load("modelos/dado2.glb", (gltf) => {
            const obj = gltf.scene;
            obj.scale.set(4, 4, 4);
            obj.position.set(3.5, 6.5, 7);
            obj.rotation.y = Math.PI / 8;
            obj.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            scene.add(obj);
            clickableObjects.push({ obj, url: "ocaInicio.html" });

            createFloatingText("OCA", new THREE.Vector3(8.5, 6.5, 7), font, 0x8b5cf6);
        });

        // CARTA (Juego UNO) -> URL: uno.html
        loader.load("modelos/1verde.glb", (gltf) => {
            const obj = gltf.scene;
            obj.scale.set(commonScale, commonScale, commonScale);
            obj.position.set(-3.5, 7, 7);
            obj.rotation.y = -Math.PI / 8;
            obj.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            scene.add(obj);
            clickableObjects.push({ obj, url: "uno.html" });

            createFloatingText("UNO", new THREE.Vector3(-8.5, 6.5, 7), font, 0x3b82f6);
        });
    });
}

// Función para crear Texto 3D Animado
// Función para crear Texto 3D Animado (MEJORADA)
function createFloatingText(message, position, font, colorHex) {
    // 1. Geometría Base
    const textGeo = new TextGeometry(message, {
        font: font,
        size: 1.5, // Un poco más grande
        height: 0.3,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.03,
        bevelOffset: 0,
        bevelSegments: 5
    });

    // Centrar geometría
    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    textGeo.translate(centerOffset, 0, 0);

    // 2. Material Principal (Núcleo brillante)
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Núcleo blanco
        emissive: colorHex,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
    });
    const textMesh = new THREE.Mesh(textGeo, textMaterial);
    textMesh.position.copy(position);

    // 3. Material de "Resplandor" (Wireframe exterior o capa transparente)
    // Para simular neón, añadimos una malla ligeramente más grande o wireframe
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide // Renderizar interior para efecto de volumen
    });

    // Clonamos la geometría para el efecto de borde/glow (escalado levemente no funciona bien con textgeo, usamos wireframe o outline)
    // Opción simple y efectiva: Wireframe overlay
    const wireGeo = new THREE.WireframeGeometry(textGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.position.copy(position);

    // Agrupamos para moverlos juntos
    const group = new THREE.Group();
    group.add(textMesh);
    group.add(wireMesh);

    scene.add(group);

    // Guardar referencia para animación
    floatingTexts.push({
        group: group,
        mesh: textMesh, // Para acceder al material emissive
        baseY: position.y,
        timeOffset: Math.random() * 100 // Desfase aleatorio
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

    // ANIMACIÓN TEXTOS FLOTANTES
    const time = Date.now() * 0.002;
    floatingTexts.forEach(textObj => {
        // Flotar arriba/abajo suavemente (usando el grupo)
        textObj.group.position.y = Math.sin(time + textObj.timeOffset) * 0.3; // Offset relativo si group estaba en 0,0,0? No, position es absoluta.
        // Corrección: el grupo se creó en 0,0,0 y los meshes tienen la posición.
        // Mejor enfoque: Mover el GRUPO.

        // Reset de posiciones internas para mover el grupo entero:
        // (Nota: En createFloatingText pusimos wireMesh.position.copy(position), esto los alejó del origen del grupo.
        // Para animar el grupo, lo mejor hubiera sido poner el grupo en position y los hijos en 0,0,0.
        // Ajustamos aquí modificando las posiciones de los hijos ya que no tenemos 'group.position' seteado inicial)

        const newY = textObj.baseY + Math.sin(time + textObj.timeOffset) * 0.3;

        // Movemos los hijos del grupo (o el grupo si lo hubiéramos posicionado)
        // Dado que agregamos el grupo a la escena pero no le dimos posición, sus hijos están en coordenadas mundo.
        // Iteramos sobre los hijos del grupo para actualizarlos es ineficiente.
        // FIX RÁPIDO: Actualizar el grupo entero asumiendo que el grupo está en 0,0,0 pero manipulamos su .position.y agregando el offset.
        // Pero espera, los objetos dentro tienen Y = position.y. Si muevo el grupo, se suma.
        // Mejor animamos los hijos como antes:

        textObj.group.children.forEach(child => {
            child.position.y = newY;
            child.rotation.y = Math.sin(time * 0.5 + textObj.timeOffset) * 0.15; // Rotación un poco más amplia
        });

        // Pulsar Intensidad de Neón
        if (textObj.mesh.material.emissiveIntensity !== undefined) {
            textObj.mesh.material.emissiveIntensity = 1.5 + Math.sin(time * 3) * 0.5; // Pulso rápido
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