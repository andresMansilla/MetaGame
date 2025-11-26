import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Select the container
const container = document.querySelector('.contenido');
// Clear existing content
container.innerHTML = '';
container.style.position = 'relative'; // Ensure positioning context
container.style.overflow = 'hidden';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6ffe6); // Match CSS background

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 6, 12); // Camera further back and higher
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Loader
const loader = new GLTFLoader();

// Green cards files
const cardFiles = [
    '0verde.glb', '1verde.glb', '2verde.glb',
    '3verde.glb', '4verde.glb', '5verde.glb',
    '6verde.glb', '7verde.glb', '8verde.glb', '9verde.glb'
];

const handGroup = new THREE.Group();
scene.add(handGroup);

// Helper to create a hand
function createHand(offsetX, offsetZ, stepX, stepZ, rotationY, count) {
    const startX = offsetX - ((count - 1) * stepX) / 2;
    const startZ = offsetZ - ((count - 1) * stepZ) / 2;

    for (let i = 0; i < count; i++) {
        const randomCard = cardFiles[Math.floor(Math.random() * cardFiles.length)];

        loader.load(`modelos/UNO cartas/${randomCard}`, (gltf) => {
            const model = gltf.scene;

            model.scale.set(2, 2, 2);

            // Position
            model.position.x = startX + (i * stepX);
            model.position.y = -2;
            model.position.z = startZ + (i * stepZ);

            // Rotation
            model.rotation.x = 0;
            model.rotation.y = rotationY;

            handGroup.add(model);
        }, undefined, (error) => {
            console.error(`Error loading ${randomCard}:`, error);
        });
    }
}

// 1. Player Hand (Bottom) - Faces Camera (+Z)
// Spreads along X
createHand(0, 4, 2.5, 0, Math.PI / 2, 7);

// 2. Top Hand (Opponent) - Faces Player (-Z)
// Spreads along X
createHand(0, -16, 2.5, 0, -Math.PI / 2, 7);

// 3. Left Hand (Opponent) - Faces Center (+X)
// Spreads along Z
createHand(-16, -6, 0, 2.5, 0, 7);

// 4. Right Hand (Opponent) - Faces Center (-X)
// Spreads along Z
createHand(16, -6, 0, 2.5, Math.PI, 7);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Optional: Float animation
    handGroup.children.forEach((card, index) => {
        // Simple floating effect based on index
        card.position.y = -2 + Math.sin(Date.now() * 0.002 + index) * 0.1;
    });

    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
});
