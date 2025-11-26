import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function loadModel(containerId, modelPath, escala=2.6, ajusteDesplazamiento=null) {
    console.log('Cargando modelo:', containerId, modelPath);
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Contenedor no encontrado:', containerId);
        return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

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
            
            // Escalem.
            model.scale.setScalar(scale);

            // Ajuste de posición si se proporciona.
            if (ajusteDesplazamiento == null){
                model.position.set(model.position.x, model.position.y, model.position.z);
            } else {
                model.position.set(model.position.x + ajusteDesplazamiento.x, model.position.y + ajusteDesplazamiento.y, model.position.z + ajusteDesplazamiento.z);
            }

            scene.add(model);

            // Renderizar una vez (sin animación)
            renderer.render(scene, camera);
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

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadModel('model-yellow', './modelos/patoamarillo.glb');
        loadModel('model-red', './modelos/pokeballrojo.glb');
        loadModel('model-blue', './modelos/diamante.glb');
        loadModel('model-green', './modelos/nave1.glb');
        loadModel('model-cuboA', './modelos/cuboamarillo.glb');
        loadModel('model-cuboR', './modelos/cuborojo.glb');
        loadModel('model-cuboAz', './modelos/cuboazul.glb');
        loadModel('model-cuboV', './modelos/cuboverde.glb');
    });
} else {
    loadModel('model-yellow', './modelos/patoamarillo.glb');
    loadModel('model-red', './modelos/pokeballrojo.glb');
    loadModel('model-blue', './modelos/diamante.glb', 1.8);
    loadModel('model-green', './modelos/nave1.glb');
    loadModel('model-cuboA', './modelos/cuboamarillo.glb', 2.5, {x:-0.8, y:-0.2, z:0});
    loadModel('model-cuboR', './modelos/cuborojo1.glb');
    loadModel('model-cuboAz', './modelos/cuboazul.glb');
    loadModel('model-cuboV', './modelos/cuboverde.glb', 2, {x:-3, y:-0.2, z:0});
}