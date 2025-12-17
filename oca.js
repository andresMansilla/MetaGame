import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function loadModel(containerId, modelPath, escala = 2.6, ajusteDesplazamiento = null, ajusteRotacion = null, rotationSpeed = 0.04, spotlightConfig = null) {
    console.log('Cargando modelo:', containerId, modelPath);
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Contenedor no encontrado:', containerId);
        return;
    }

    const width = container.clientWidth || 100;
    const height = container.clientHeight || 100;

    const scene = new THREE.Scene();
    scene.background = null; // Fondo transparente

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Luces mejoradas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    // Spotlight si se configura
    if (spotlightConfig) {
        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = spotlightConfig.intensity || 50;
        spotLight.angle = spotlightConfig.angle || Math.PI / 6;
        spotLight.penumbra = spotlightConfig.penumbra || 0.3;
        spotLight.decay = spotlightConfig.decay || 1;
        spotLight.distance = spotlightConfig.distance || 0; // 0 = infinito

        // Posición
        const px = spotlightConfig.position?.x ?? 5;
        const py = spotlightConfig.position?.y ?? 10;
        const pz = spotlightConfig.position?.z ?? 5;
        spotLight.position.set(px, py, pz);

        // Habilitar sombras si se desea (opcional, requiere configurar renderer shadowMap)
        spotLight.castShadow = true;

        // Target
        if (spotlightConfig.target) {
            spotLight.target.position.set(
                spotlightConfig.target.x || 0,
                spotlightConfig.target.y || 0,
                spotlightConfig.target.z || 0
            );
            scene.add(spotLight.target);
        }

        scene.add(spotLight);
        console.log(`Spotlight añadido a ${containerId}`);
    }

    // Cargar modelo GLB
    const loader = new GLTFLoader();

    loader.load(
        modelPath,
        (gltf) => {
            console.log('Modelo cargado exitosamente:', gltf);
            const model = gltf.scene;

            // Centrar el modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            // Escalar para llenar el contenedor
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = escala / maxDim; // Escala más grande para llenar el espacio

            model.scale.setScalar(scale);

            // Ajuste de posición si se proporciona.
            if (ajusteDesplazamiento == null) {
                model.position.set(model.position.x, model.position.y, model.position.z);
            } else {
                model.position.set(model.position.x + ajusteDesplazamiento.x, model.position.y + ajusteDesplazamiento.y, model.position.z + ajusteDesplazamiento.z);
            }
            if (ajusteRotacion == null) {
                model.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z);
            } else {
                model.rotation.set(model.rotation.x + ajusteRotacion.x, model.rotation.y + ajusteRotacion.y, model.rotation.z + ajusteRotacion.z);
            }

            // Crear un grupo para rotar el modelo centrado
            const group = new THREE.Group();
            group.add(model);
            scene.add(group);

            // Animación de rotación para el grupo
            (function animate() {
                group.rotation.y += rotationSpeed;
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            })();
        },
        (progress) => {
            console.log('Progreso de carga:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
        },
        (error) => {
            console.error('Error cargando el modelo GLB:', error);
            console.error('Ruta intentada:', modelPath);
        }
    );

    // Responsive
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}

// --- DADO ANIMADO Y RESULTADOS EN ESTADÍSTICAS ---

function lanzarDadoAnimado(callback) {
    // Buscar el renderer y el grupo del dado
    let renderer, scene, camera, group;
    // Si no hay acceso directo, buscar en window (por compatibilidad)
    if (!renderer || !scene || !camera || !group) {
        // No se puede animar el dado si no se tiene acceso
        callback && callback();
        return;
    }
}
function mostrarResultadosDado() {
    // Generar un número aleatorio para cada jugador (1-6)
    const resultados = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    // Mostrar el número en los span de estadísticas
    const spans = [
        document.querySelector('#model-cuboA').nextElementSibling,
        document.querySelector('#model-cuboR').nextElementSibling,
        document.querySelector('#model-cuboAz').nextElementSibling,
        document.querySelector('#model-cuboV').nextElementSibling
    ];
    spans.forEach((span, i) => {
        if (span) {
            span.textContent += ` (${resultados[i]})`;
        }
    });
}
// Evento click en el dado
setTimeout(() => {
    const dadoDiv = document.getElementById('model-dado');
    if (dadoDiv) {
        dadoDiv.style.cursor = 'pointer';
        dadoDiv.addEventListener('click', () => {
            lanzarDadoAnimado(() => {
                mostrarResultadosDado();
            });
        });
    }
}, 1000);
// --- MODAL PATO AMARILLO ---
let patoModalRenderer, patoModalScene, patoModalCamera, patoModalModel, isDragging = false, prevX = 0, prevY = 0;

function openPatoModal() {
    const overlay = document.getElementById('modal-pato-overlay');
    overlay.style.display = 'block';

    const container = document.getElementById('modal-pato-model');
    container.innerHTML = '';

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    patoModalScene = new THREE.Scene();
    patoModalScene.background = null;

    patoModalCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    patoModalCamera.position.set(0, 0, 3);
    patoModalCamera.lookAt(0, 0, 0);

    patoModalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    patoModalRenderer.setSize(width, height);
    patoModalRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(patoModalRenderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    patoModalScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    patoModalScene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load('./modelos/patoamarillo.glb', (gltf) => {
        patoModalModel = gltf.scene;
        // Centrar y escalar
        const box = new THREE.Box3().setFromObject(patoModalModel);
        const center = box.getCenter(new THREE.Vector3());
        patoModalModel.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.6 / maxDim;
        patoModalModel.scale.setScalar(scale);

        patoModalScene.add(patoModalModel);
        patoModalRenderer.render(patoModalScene, patoModalCamera);
    });

    // Animación de render
    function animate() {
        patoModalRenderer.render(patoModalScene, patoModalCamera);
        if (overlay.style.display === 'block') requestAnimationFrame(animate);
    }
    animate();

    // Rotación con mouse
    container.onmousedown = function (e) {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    };
    container.onmouseup = function () {
        isDragging = false;
    };
    container.onmouseleave = function () {
        isDragging = false;
    };
    container.onmousemove = function (e) {
        if (isDragging && patoModalModel) {
            const deltaX = (e.clientX - prevX) * 0.01;
            const deltaY = (e.clientY - prevY) * 0.01;
            patoModalModel.rotation.y += deltaX;
            patoModalModel.rotation.x += deltaY;
            prevX = e.clientX;
            prevY = e.clientY;
        }
    };
}

function closePatoModal() {
    document.getElementById('modal-pato-overlay').style.display = 'none';
    // Limpia el modelo y renderer
    const container = document.getElementById('modal-pato-model');
    container.innerHTML = '';
    patoModalRenderer = null;
    patoModalScene = null;
    patoModalCamera = null;
    patoModalModel = null;
}

// Evento para abrir modal al hacer click en el pato amarillo
setTimeout(() => {
    const patoDiv = document.getElementById('model-yellow');
    if (patoDiv) {
        patoDiv.style.cursor = 'pointer';
        patoDiv.addEventListener('click', openPatoModal);
        patoDiv.title = 'Haz clic para ver el pato en grande';
    }
    const closeBtn = document.getElementById('close-modal-pato');
    if (closeBtn) {
        closeBtn.onclick = closePatoModal;
    }
    // También cerrar al hacer click fuera del modal
    const overlay = document.getElementById('modal-pato-overlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePatoModal();
        });
    }
}, 1000);
// --- MODAL MODELOS JUGADORES ---
let modalRenderer, modalScene, modalCamera, modalModel;

function openPlayerModal(modelPath) {
    const overlay = document.getElementById('modal-pato-overlay');
    if (!overlay) return;
    overlay.style.display = 'block';

    const container = document.getElementById('modal-pato-model');
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    modalScene = new THREE.Scene();
    modalScene.background = null;

    modalCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    modalCamera.position.set(0, 0, 3);
    modalCamera.lookAt(0, 0, 0);

    modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    modalRenderer.setSize(width, height);
    modalRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(modalRenderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    modalScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    modalScene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        modalModel = gltf.scene;
        // Centrar y escalar
        const box = new THREE.Box3().setFromObject(modalModel);
        const center = box.getCenter(new THREE.Vector3());
        modalModel.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        // Escala más pequeña para el modal
        const scale = 1.2 / maxDim;
        modalModel.scale.setScalar(scale);
        modalScene.add(modalModel);
        modalRenderer.render(modalScene, modalCamera);
    });
}

function closePlayerModal() {
    const overlay = document.getElementById('modal-pato-overlay');
    if (overlay) overlay.style.display = 'none';
    const container = document.getElementById('modal-pato-model');
    if (container) container.innerHTML = '';
    modalRenderer = null;
    modalScene = null;
    modalCamera = null;
    modalModel = null;
}

// Evento para abrir modal al hacer click en los modelos de los jugadores
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Amarillo
        const yellowDiv = document.getElementById('model-yellow');
        if (yellowDiv) {
            yellowDiv.style.cursor = 'pointer';
            yellowDiv.addEventListener('click', () => openPlayerModal('./modelos/patoamarillo1.glb'));
            yellowDiv.title = 'Haz clic para ver el pato en grande';
        }
        // Rojo
        const redDiv = document.getElementById('model-red');
        if (redDiv) {
            redDiv.style.cursor = 'pointer';
            redDiv.addEventListener('click', () => openPlayerModal('./modelos/pokeballrojo2.glb'));
            redDiv.title = 'Haz clic para ver el modelo rojo en grande';
        }
        // Azul
        const blueDiv = document.getElementById('model-blue');
        if (blueDiv) {
            blueDiv.style.cursor = 'pointer';
            blueDiv.addEventListener('click', () => openPlayerModal('./modelos/diamante.glb'));
            blueDiv.title = 'Haz clic para ver el modelo azul en grande';
        }
        // Verde
        const greenDiv = document.getElementById('model-green');
        if (greenDiv) {
            greenDiv.style.cursor = 'pointer';
            greenDiv.addEventListener('click', () => openPlayerModal('./modelos/nave1.glb'));
            greenDiv.title = 'Haz clic para ver el modelo verde en grande';
        }
        // Cerrar modal
        const closeBtn = document.getElementById('close-modal-pato');
        if (closeBtn) {
            closeBtn.onclick = closePlayerModal;
        }
        const overlay = document.getElementById('modal-pato-overlay');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closePlayerModal();
            });
        }
    }, 500);
});

// Ejecutar cuando el DOM esté listo
{
    loadModel('model-yellow', './modelos/patoamarillo1.glb', 1.8);
    loadModel('model-red', './modelos/pokeballrojo2.glb', 1.8);
    loadModel('model-blue', './modelos/diamante.glb', 1.8, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    loadModel('model-green', './modelos/nave1.glb', 3, { x: 0, y: -0.1, z: 0 });
    loadModel('model-cuboA', './modelos/cuboamarillo1.glb', 1.8, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    loadModel('model-cuboR', './modelos/cuborojo1.glb', 1.8, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    loadModel('model-cuboAz', './modelos/cuboazul1.glb', 1.9, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    loadModel('model-cuboV', './modelos/cuboverde1.glb', 2, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    // Dado con Spotlight intenso y enfocado
    loadModel('model-dado', './modelos/dado9.glb', 1.6, { x: 0, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 }, 0.04, {
        intensity: 80,
        position: { x: 2, y: 5, z: 2 },
        angle: 0.5,
        penumbra: 0.4
    });

    // Tablero con Spotlight más amplio para iluminarlo todo
    loadModel('model-tablero', './modelos/tablerooca2.glb', 1.7, { x: 0, y: 0.5, z: 0 }, { x: 0.6, y: 3.14, z: 0 }, 0, {
        intensity: 10,
        position: { x: 0, y: 10, z: 5 }, // Desde arriba y un poco al frente
        angle: 0.8,
        penumbra: 0.5,
        target: { x: 0, y: 0, z: 0 }
    });
}