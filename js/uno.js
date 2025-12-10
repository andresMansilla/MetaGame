import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Select elements
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('btn-start');
const gameContainer = document.getElementById('game-container');
const gameOverModal = document.getElementById('game-over-modal');
const winnerMessage = document.getElementById('winner-message');
const restartButton = document.getElementById('btn-restart');
const unoButton = document.getElementById('btn-uno');

// Game Constants
const COLORS = ['green', 'red', 'blue', 'yellow'];
const COLOR_HEX = {
    'green': 0x55aa55,
    'red': 0xff5555,
    'blue': 0x5555ff,
    'yellow': 0xffaa00
};

// Game State
let currentTurn = 0; // 0: Player, 1: Left, 2: Top, 3: Right
let isTurnInProgress = false;
let activeCenterCard = null; // Visual object
let activeCardData = null;   // Logic object { color, value }
let isGameOver = false;
let isGameReady = false;
let unoCalled = false;
let penaltyTimer = null;

// Scene globals
let scene, camera, renderer, raycaster, mouse, loader;
let handGroup, playedGroup;
let robots = [];

// Base models (only Green exists, we will recolor)
const baseCardFiles = [
    '0verde.glb', '1verde.glb', '2verde.glb',
    '3verde.glb', '4verde.glb', '5verde.glb',
    '6verde.glb', '7verde.glb', '8verde.glb', '9verde.glb'
];

// Listeners
if (startButton) {
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none'; // Hide start screen
        initGame(); // Initialize game
    });
}

if (restartButton) {
    restartButton.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        startScreen.style.display = 'flex'; // Go back to start screen
    });
}

if (unoButton) {
    unoButton.addEventListener('click', () => {
        unoCalled = true;
        // Visual feedback
        const originalBg = unoButton.style.background;
        unoButton.style.background = 'radial-gradient(circle at 30% 30%, #55ff55, #00cc00)';
        setTimeout(() => {
            unoButton.style.background = '';
        }, 500);
    });
}

function initGame() {
    // Reset State
    currentTurn = 0;
    isTurnInProgress = false;
    activeCenterCard = null;
    activeCardData = null;
    isGameOver = false;
    isGameReady = false;
    unoCalled = false;
    if (penaltyTimer) clearTimeout(penaltyTimer);
    robots = [];

    // Show UNO button
    if (unoButton) unoButton.classList.remove('hidden');

    // Clear existing content if any
    gameContainer.innerHTML = '';
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';

    // Scene setup
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 6, 12); // Camera further back and higher
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
    gameContainer.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Loader
    loader = new GLTFLoader();

    handGroup = new THREE.Group();
    scene.add(handGroup);

    playedGroup = new THREE.Group();
    scene.add(playedGroup);

    // Initial Hands
    // 1. Player (0)
    createHand(0, 7);
    // 2. Left (1)
    createHand(1, 7);
    // 3. Top (2)
    createHand(2, 7);
    // 4. Right (3)
    createHand(3, 7);

    // Initial Center Card
    spawnCenterCard();

    // Create Robots
    createRobot(0, -15, -35, 29.9, 'modelos/robot.glb', 3.5, 0xffaa00, 'yellow');   // Top
    createRobot(-35, -15, -15, 0, 'modelos/robot.glb', 3.5, 0xff5555, 'red');       // Left
    createRobot(35, -15, -15, 34.5, 'modelos/robot.glb', 3.5, 0x55ff55, 'green');   // Right

    // Initial UI update
    updateUI();

    // Set Game Ready
    setTimeout(() => {
        isGameReady = true;
        updateUI();
    }, 1000);

    // Start Animation Loop
    animate();

    // Add Interaction Listener
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
}

// Generate a random card data object
function generateRandomCard() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const value = Math.floor(Math.random() * 10);
    return { color, value };
}

function spawnCenterCard() {
    const cardData = generateRandomCard();
    activeCardData = cardData;

    const fileName = `${cardData.value}verde.glb`; // Base model

    loader.load(`modelos/UNO cartas/${fileName}`, (gltf) => {
        const model = gltf.scene;
        model.scale.set(3.5, 3.5, 3.5);
        model.position.set(0, -2, -8);
        const targetEuler = new THREE.Euler(-0.5, -Math.PI / 2, 0); // Flat-ish facing player
        model.quaternion.setFromEuler(targetEuler);

        recolorCard(model, cardData.color);

        playedGroup.add(model);
        activeCenterCard = model;
    });
}

function getHandProps(playerIndex) {
    switch (playerIndex) {
        case 0: return { offsetX: 0, offsetZ: 5, stepX: 2.5, stepZ: 0, rotY: -Math.PI / 2 };
        case 1: return { offsetX: -25, offsetZ: -15, stepX: 0, stepZ: 2.5, rotY: -60 };
        case 2: return { offsetX: 0, offsetZ: -25, stepX: 2.5, stepZ: 0, rotY: Math.PI / 2 };
        case 3: return { offsetX: 25, offsetZ: -15, stepX: 0, stepZ: 2.5, rotY: 82 };
    }
    return {};
}

function updateHandLayout(playerIndex) {
    const cards = handGroup.children.filter(c => c.userData.playerIndex === playerIndex && c.userData.isInHand);
    const count = cards.length;
    const props = getHandProps(playerIndex);

    let totalLength = 0;
    if (Math.abs(props.stepX) > 0) totalLength = (count - 1) * props.stepX;
    else totalLength = (count - 1) * props.stepZ;

    const startX = props.offsetX - (Math.abs(props.stepX) > 0 ? totalLength / 2 * Math.sign(props.stepX) : 0);
    const startZ = props.offsetZ - (Math.abs(props.stepZ) > 0 ? totalLength / 2 * Math.sign(props.stepZ) : 0);

    cards.forEach((card, i) => {
        const newX = startX + (i * props.stepX);
        const newZ = startZ + (i * props.stepZ);
        card.position.x = newX;
        card.position.z = newZ;
    });
}

function createHand(playerIndex, count) {
    addCardsToHand(playerIndex, count);
}

function addCardsToHand(playerIndex, count) {
    const props = getHandProps(playerIndex);

    for (let i = 0; i < count; i++) {
        const cardData = generateRandomCard();
        const fileName = `${cardData.value}verde.glb`;

        loader.load(`modelos/UNO cartas/${fileName}`, (gltf) => {
            const model = gltf.scene;
            model.scale.set(2, 2, 2);

            model.position.set(props.offsetX, -2, props.offsetZ);

            model.rotation.x = playerIndex === 0 ? -0.3 : 0;
            model.rotation.y = props.rotY;

            recolorCard(model, cardData.color);

            model.userData = {
                playerIndex: playerIndex,
                isPlayer: (playerIndex === 0),
                isInHand: true,
                originalY: -2,
                isMoving: false,
                // These will be used for animation
                velocity: new THREE.Vector3(),
                targetPos: null,
                targetRot: null,
                cardValue: cardData.value,
                cardColor: cardData.color
            };

            handGroup.add(model);

            updateHandLayout(playerIndex);
        });
    }
}

function recolorCard(model, colorName) {
    if (colorName === 'green') return;

    model.traverse((node) => {
        if (node.isMesh && node.material && node.material.map) {

            try {
                const texture = node.material.map;
                node.material = node.material.clone();
                const cacheKey = `${texture.uuid}_${colorName}`;

                if (texture.image) {
                    const newTexture = processTexture(texture, colorName);
                    if (newTexture) {
                        node.material.map = newTexture;
                    }
                }
                node.material.color.setHex(0xffffff);
                node.material.needsUpdate = true;

            } catch (e) {
                console.error("Failed to recolor card texture:", e);
            }
        }
    });
}

function processTexture(originalTexture, colorName) {
    const image = originalTexture.image;
    if (!image) return null;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.drawImage(image, 0, 0);

    let imageData;
    try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
        return null;
    }
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (g > r + 30 && g > b + 30) {
            if (colorName === 'red') {
                data[i] = g; data[i + 1] = r; data[i + 2] = b;
            }
            else if (colorName === 'blue') {
                data[i] = r; data[i + 1] = b; data[i + 2] = g;
            }
            else if (colorName === 'yellow') {
                data[i] = g; data[i + 1] = g; data[i + 2] = b;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.flipY = originalTexture.flipY;
    newTexture.colorSpace = originalTexture.colorSpace || THREE.SRGBColorSpace;
    return newTexture;
}

function isValidMove(cardData) {
    if (!activeCardData) return true;
    return (cardData.color === activeCardData.color || cardData.value === activeCardData.value);
}

function onMouseClick(event) {
    if (currentTurn !== 0 || isTurnInProgress || isGameOver) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(handGroup.children, true);

    if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && object.parent !== handGroup) {
            object = object.parent;
        }

        if (object.userData.isPlayer && !object.userData.isMoving) {
            if (isValidMove({ color: object.userData.cardColor, value: object.userData.cardValue })) {
                playCard(object);
            } else {
                shakeCard(object);
            }
        }
    }
}

function shakeCard(card) {
    const originalX = card.position.x;
    const startTime = Date.now();
    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
            card.position.x = originalX + Math.sin(elapsed * 0.1) * 0.2;
            requestAnimationFrame(shake);
        } else {
            card.position.x = originalX;
        }
    }
    shake();
}

function checkPlayerCanPlay() {
    const myCards = handGroup.children.filter(c => c.userData.playerIndex === 0 && c.userData.isInHand);
    const hasMove = myCards.some(c => isValidMove({ color: c.userData.cardColor, value: c.userData.cardValue }));

    if (!hasMove) {
        showNotification("No tienes jugada. Robando carta...", "info");
        setTimeout(() => {
            addCardsToHand(0, 1);
            setTimeout(() => {
                const myCardsNew = handGroup.children.filter(c => c.userData.playerIndex === 0 && c.userData.isInHand);
                const hasMoveNew = myCardsNew.some(c => isValidMove({ color: c.userData.cardColor, value: c.userData.cardValue }));
                if (!hasMoveNew) {
                    showNotification("Sigues sin jugada. Pasando turno...", "info");
                    setTimeout(nextTurn, 1000);
                }
            }, 1000);
        }, 1000);
    }
}

function playCard(card) {
    isTurnInProgress = true;

    activeCardData = { color: card.userData.cardColor, value: card.userData.cardValue };

    card.userData.isMoving = true;
    card.userData.isPlayer = false;
    card.userData.isInHand = false;

    // Setup for "Natural" animation
    card.userData.moveStartTime = Date.now();
    card.userData.startPos = card.position.clone();
    card.userData.startRot = card.quaternion.clone();
    card.userData.startScale = card.scale.clone();

    updateHandLayout(card.userData.playerIndex);

    // Target Pos
    const stackHeight = playedGroup.children.length * 0.01;
    card.userData.targetPos = new THREE.Vector3(0, -2 + stackHeight, -8);

    // Target Rot (Face player)
    const randomRotZ = (Math.random() - 0.5) * 0.2;
    const targetEuler = new THREE.Euler(-0.5, -Math.PI / 2, randomRotZ);
    card.userData.targetRot = new THREE.Quaternion().setFromEuler(targetEuler);

    card.userData.targetScale = new THREE.Vector3(3.5, 3.5, 3.5);

    updateUI();

    if (card.userData.playerIndex === 0) {
        const remaining = handGroup.children.filter(c => c.userData.playerIndex === 0 && c.userData.isInHand).length;
        if (remaining === 1) {
            if (penaltyTimer) clearTimeout(penaltyTimer);
            penaltyTimer = setTimeout(() => {
                if (!unoCalled) {
                    showNotification("¡No dijiste UNO! +2 Cartas", "warning");
                    addCardsToHand(0, 2);
                }
                unoCalled = false;
            }, 5000);
        }
    }

    if (!isGameOver) {
        setTimeout(nextTurn, 1500);
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400); // match css transition
    }, 4000);
}

function nextTurn() {
    if (isGameOver) return;
    currentTurn = (currentTurn + 1) % 4;
    isTurnInProgress = false;
    updateUI();

    if (currentTurn === 0) {
        checkPlayerCanPlay();
    } else {
        isTurnInProgress = true;
        setTimeout(botPlay, 1000);
    }
}

function botPlay() {
    if (isGameOver) return;
    const botCards = handGroup.children.filter(c => c.userData.playerIndex === currentTurn && c.userData.isInHand);
    const validMoves = botCards.filter(c => isValidMove({ color: c.userData.cardColor, value: c.userData.cardValue }));

    if (validMoves.length > 0) {
        const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
        playCard(chosen);
    } else {
        console.log(`Bot ${currentTurn} draws a card.`);
        addCardsToHand(currentTurn, 1);
        setTimeout(nextTurn, 1000);
    }
}

function updateUI() {
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach((card, index) => {
        if (index === currentTurn) card.classList.add('active');
        else card.classList.remove('active');

        if (handGroup) {
            const count = handGroup.children.filter(c => c.userData.playerIndex === index && c.userData.isInHand).length;
            const countEl = card.querySelector('.card-count');
            if (count > 0 || isGameReady) {
                if (countEl) countEl.textContent = `${count} Cartas`;
            }
            if (count === 0 && !isGameOver && isGameReady) endGame(index);
        }

        const existingBadge = card.querySelector('.badge');
        if (existingBadge) existingBadge.remove();

        if (index === currentTurn && !isGameOver) {
            const infoDiv = card.querySelector('.info');
            if (infoDiv) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = index === 0 ? 'Tu Turno' : 'Jugando...';
                const h3 = infoDiv.querySelector('h3');
                if (h3) h3.after(badge);
            }
        }
    });
}

function endGame(winnerIndex) {
    isGameOver = true;
    isTurnInProgress = true;
    let winnerName = '';
    switch (winnerIndex) {
        case 0: winnerName = '¡Tú!'; break;
        case 1: winnerName = 'Bot Izquierda'; break;
        case 2: winnerName = 'Bot Frente'; break;
        case 3: winnerName = 'Bot Derecha'; break;
    }
    winnerMessage.textContent = `El ganador es: ${winnerName}`;
    gameOverModal.classList.remove('hidden');
}

function animate() {
    requestAnimationFrame(animate);

    if (handGroup) {
        handGroup.children.forEach((card, index) => {
            if (card.userData.isMoving) {
                const now = Date.now();
                const duration = 700; // Animation Duration ms
                const elapsed = now - card.userData.moveStartTime;
                let t = elapsed / duration;

                if (t >= 1) {
                    t = 1;
                    card.userData.isMoving = false;
                    card.position.copy(card.userData.targetPos);
                    card.quaternion.copy(card.userData.targetRot);
                    card.scale.copy(card.userData.targetScale);

                    if (activeCenterCard && activeCenterCard !== card) {
                        activeCenterCard.visible = false;
                    }
                    activeCenterCard = card;
                } else {
                    // Ease Out Cubic
                    const ease = 1 - Math.pow(1 - t, 3);

                    // Position Lerp
                    card.position.lerpVectors(card.userData.startPos, card.userData.targetPos, ease);

                    // Parabolic Arc (Throw Effect) - height 3 units at peak
                    card.position.y += Math.sin(t * Math.PI) * 3;

                    // Rotation Lerp + Spin
                    // Transition to target orientation
                    const currentQ = new THREE.Quaternion().copy(card.userData.startRot).slerp(card.userData.targetRot, ease);

                    // Add 360 Spin (1 full rotation) around Global Y
                    // spin matches ease so it ends at 360 (Identity) exactly when ease ends
                    const spinQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ease * Math.PI * 2);

                    // Apply spin on top of transition
                    card.quaternion.multiplyQuaternions(spinQ, currentQ);

                    // Scale Lerp
                    card.scale.lerpVectors(card.userData.startScale, card.userData.targetScale, ease);
                }
            } else if (card.userData.isInHand) {
                card.position.y = card.userData.originalY + Math.sin(Date.now() * 0.002 + index) * 0.1;
            }
        });
    }

    if (robots && robots.length > 0) {
        const time = Date.now();
        robots.forEach(robot => {
            if (robot.userData) {
                robot.position.y = robot.userData.initialY + Math.sin(time * robot.userData.speed + robot.userData.offset) * 0.5;
                robot.rotation.y = robot.userData.initialRotY + Math.sin(time * 0.001 + robot.userData.offset) * 0.05;
            }
        });
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (gameContainer && camera && renderer) {
        const width = gameContainer.clientWidth;
        const height = gameContainer.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

function createRobot(x, y, z, rotationY, modelPath, scale = 4, lightColor = 0xffffff, colorName = 'red') {
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(x, y, z);
        model.rotation.y = rotationY;

        const light = new THREE.PointLight(lightColor, 10, 30);
        light.position.set(0, 3, 1);
        light.castShadow = true;
        light.shadow.bias = -0.0001;
        model.add(light);

        const coreGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: lightColor });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(0, 3, 1);
        model.add(coreMesh);

        // Apply Robot Recoloring
        recolorRobot(model, colorName);

        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    node.material.roughness = 0.3;
                    node.material.metalness = 0.8;
                    node.material.needsUpdate = true;
                }
            }
        });

        model.userData = {
            initialY: y,
            initialRotY: rotationY,
            speed: 0.0015 + Math.random() * 0.001,
            offset: Math.random() * 100
        };

        scene.add(model);
        robots.push(model);
    });
}

function recolorRobot(model, colorName) {
    if (colorName === 'red') return; // Default is red

    model.traverse((node) => {
        if (node.isMesh && node.material) {
            try {
                node.material = node.material.clone();
                const targetHex = (colorName === 'yellow') ? 0xffaa00 :
                    (colorName === 'green') ? 0x55ff55 : 0xffffff;

                // Tint
                const col = node.material.color;
                if ((col.r > col.g + 0.05 && col.r > col.b + 0.05) || (col.r > 0.8 && col.g < 0.5)) {
                    node.material.color.setHex(targetHex);
                }

                // Texture
                if (node.material.map && node.material.map.image) {
                    const newTexture = processRobotTexture(node.material.map, colorName);
                    if (newTexture) {
                        node.material.map = newTexture;
                        node.material.color.setHex(0xffffff);
                    }
                }
                node.material.needsUpdate = true;

            } catch (e) {
                console.warn("Failed to recolor robot:", e);
            }
        }
    });
}

function processRobotTexture(originalTexture, colorName) {
    const image = originalTexture.image;
    if (!image) return null;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.drawImage(image, 0, 0);

    let imageData;
    try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) { return null; }

    const data = imageData.data;
    let hasRedPixels = false;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Broader Red Detection
        if (r > g + 15 && r > b + 15) {
            hasRedPixels = true;
            if (colorName === 'yellow') {
                data[i + 1] = r;
            } else if (colorName === 'green') {
                data[i] = g;
                data[i + 1] = r;
            }
        }
    }

    if (!hasRedPixels) return null;
    ctx.putImageData(imageData, 0, 0);

    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.flipY = originalTexture.flipY;
    newTexture.colorSpace = originalTexture.colorSpace || THREE.SRGBColorSpace;

    return newTexture;
}
