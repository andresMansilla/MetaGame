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

// Game State
let currentTurn = 0; // 0: Player, 1: Left, 2: Top, 3: Right
let isTurnInProgress = false;
let activeCenterCard = null;
let isGameOver = false;
let isGameReady = false;
let unoCalled = false;
let penaltyTimer = null;

// Scene globals
let scene, camera, renderer, raycaster, mouse, loader;
let handGroup, playedGroup;
const cardFiles = [
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
        // Clean up scene if needed? initGame clears container.
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
    isGameOver = false;
    isGameReady = false;
    unoCalled = false;
    if (penaltyTimer) clearTimeout(penaltyTimer);

    // Show UNO button
    if (unoButton) unoButton.classList.remove('hidden');

    // Clear existing content if any
    gameContainer.innerHTML = '';
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';

    // Scene setup
    scene = new THREE.Scene();
    // scene.background = null; // Transparent to show CSS background

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

    // Create Hands
    // 1. Player Hand (Bottom) - Index 0
    createHand(0, 5, 2.5, 0, -Math.PI / 2, 7, 0);

    // 2. Top Hand (Opponent) - Index 2
    createHand(0, -25, 2.5, 0, Math.PI / 2, 7, 2);

    // 3. Left Hand (Opponent) - Index 1
    createHand(-25, -15, 0, 2.5, -60, 7, 1);

    // 4. Right Hand (Opponent) - Index 3
    createHand(25, -15, 0, 2.5, 82, 7, 3);

    // Create Robots behind opponents
    createRobot(0, -15, -35, 29.9, 'modelos/robot.glb', 3.5);           // Top
    createRobot(-35, -15, -15, 0, 'modelos/robot.glb', 3.5); // Left
    createRobot(35, -15, -15, 34.5, 'modelos/robot.glb', 3.5); // Right

    // Initial UI update (will show 7 cards because isGameReady is false)
    updateUI();

    // Set Game Ready after delay (to allow cards to load)
    setTimeout(() => {
        isGameReady = true;
        updateUI(); // Update again to confirm counts
    }, 1000);

    // Start Animation Loop
    animate();

    // Add Interaction Listener
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
}

// Helper to create a hand
function createHand(offsetX, offsetZ, stepX, stepZ, rotationY, count, playerIndex) {
    const startX = offsetX - ((count - 1) * stepX) / 2;
    const startZ = offsetZ - ((count - 1) * stepZ) / 2;
    const isPlayer = (playerIndex === 0);

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
            model.rotation.x = isPlayer ? -0.3 : 0;
            model.rotation.y = rotationY;

            // Metadata
            model.userData = {
                playerIndex: playerIndex, // 0-3
                isPlayer: isPlayer,
                isInHand: true,
                originalY: -2,
                isMoving: false,
                velocity: new THREE.Vector3(),
                targetPos: null,
                targetRot: null
            };

            handGroup.add(model);
        }, undefined, (error) => {
            console.error(`Error loading ${randomCard}:`, error);
        });
    }
}

function addCards(playerIndex, count) {
    // Reuse createHand to add cards. They will overlap but it works for logic.
    switch (playerIndex) {
        case 0: createHand(0, 5, 2.5, 0, -Math.PI / 2, count, 0); break;
        case 1: createHand(-25, -15, 0, 2.5, -60, count, 1); break;
        case 2: createHand(0, -25, 2.5, 0, Math.PI / 2, count, 2); break;
        case 3: createHand(25, -15, 0, 2.5, 82, count, 3); break;
    }
    setTimeout(updateUI, 1000);
}

function onMouseClick(event) {
    // Only allow click if it's Player's turn (0) and no turn is in progress
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
            playCard(object);
        }
    }
}

function playCard(card) {
    isTurnInProgress = true; // Lock interaction

    // Mark as moving
    card.userData.isMoving = true;
    card.userData.isPlayer = false;
    card.userData.isInHand = false;

    // Set target position (Center of table)
    const stackHeight = playedGroup.children.length * 0.01;
    card.userData.targetPos = new THREE.Vector3(0, -2 + stackHeight, -8);

    // Set target rotation
    const targetEuler = new THREE.Euler(0, -30, 59.5);
    card.userData.targetRot = new THREE.Quaternion().setFromEuler(targetEuler);

    // Set target scale
    card.userData.targetScale = new THREE.Vector3(3.5, 3.5, 3.5);

    // Update UI immediately to reflect card count change
    updateUI();

    // UNO Logic for Player
    if (card.userData.playerIndex === 0) {
        const remaining = handGroup.children.filter(c => c.userData.playerIndex === 0 && c.userData.isInHand).length;
        if (remaining === 1) {
            // Start 5s timer
            if (penaltyTimer) clearTimeout(penaltyTimer);
            penaltyTimer = setTimeout(() => {
                if (!unoCalled) {
                    alert("¡No dijiste UNO! +2 Cartas");
                    addCards(0, 2);
                }
                unoCalled = false; // Reset
            }, 5000);
        } else {
            unoCalled = false; // Reset if not 1 card
        }
    }

    // Trigger next turn after a delay (allow animation to start/finish)
    if (!isGameOver) {
        setTimeout(() => {
            nextTurn();
        }, 1500); // 1.5 seconds delay
    }
}

function nextTurn() {
    if (isGameOver) return;

    // Increment turn
    currentTurn = (currentTurn + 1) % 4;
    isTurnInProgress = false;

    updateUI();

    // If Bot turn, play automatically
    if (currentTurn !== 0 && !isGameOver) {
        isTurnInProgress = true; // Lock
        setTimeout(botPlay, 1000); // Wait 1s before bot plays
    }
}

function botPlay() {
    if (isGameOver) return;

    // Find cards for current bot
    const botCards = handGroup.children.filter(c =>
        c.userData.playerIndex === currentTurn && c.userData.isInHand
    );

    if (botCards.length > 0) {
        const randomCard = botCards[Math.floor(Math.random() * botCards.length)];
        playCard(randomCard);
    } else {
        // Bot has no cards? (Shouldn't happen in this demo, but handle it)
        console.log(`Bot ${currentTurn} has no cards!`);
        nextTurn();
    }
}

function updateUI() {
    const playerCards = document.querySelectorAll('.player-card');

    playerCards.forEach((card, index) => {
        // Toggle active class
        if (index === currentTurn) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }

        // Update Card Count
        // Count cards in handGroup for this playerIndex that are isInHand
        if (handGroup) {
            const count = handGroup.children.filter(c =>
                c.userData.playerIndex === index && c.userData.isInHand
            ).length;

            const countEl = card.querySelector('.card-count');

            // Only update text if count > 0 or game is ready (to avoid showing 0 during loading)
            if (count > 0 || isGameReady) {
                if (countEl) {
                    countEl.textContent = `${count} Cartas`;
                }
            }

            // Check Win Condition
            // Only check if game is ready to avoid premature win on load
            if (count === 0 && !isGameOver && isGameReady) {
                endGame(index);
            }
        }

        // Update Badge
        // Remove existing badge if any
        const existingBadge = card.querySelector('.badge');
        if (existingBadge) existingBadge.remove();

        // Add badge if active turn
        if (index === currentTurn && !isGameOver) {
            const infoDiv = card.querySelector('.info');
            if (infoDiv) {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = index === 0 ? 'Tu Turno' : 'Jugando...';
                // Insert after h3
                const h3 = infoDiv.querySelector('h3');
                if (h3) h3.after(badge);
            }
        }
    });
}

function endGame(winnerIndex) {
    isGameOver = true;
    isTurnInProgress = true; // Lock everything

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

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (handGroup) {
        handGroup.children.forEach((card, index) => {
            if (card.userData.isMoving) {
                // Lerp position
                card.position.lerp(card.userData.targetPos, 0.08);
                // Slerp rotation
                card.quaternion.slerp(card.userData.targetRot, 0.08);
                // Lerp scale
                if (card.userData.targetScale) {
                    card.scale.lerp(card.userData.targetScale, 0.08);
                }

                // Check if arrived
                if (card.position.distanceTo(card.userData.targetPos) < 0.1) {
                    if (activeCenterCard && activeCenterCard !== card) {
                        activeCenterCard.visible = false;
                    }
                    activeCenterCard = card;
                    card.userData.isMoving = false;
                }

            } else if (card.userData.isInHand) {
                // Float animation for all cards in hands
                card.position.y = card.userData.originalY + Math.sin(Date.now() * 0.002 + index) * 0.1;
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

function createRobot(x, y, z, rotationY, modelPath, scale = 4) {
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale); // Scaled
        model.position.set(x, y, z); // Use passed Position
        model.rotation.y = rotationY;
        scene.add(model);
        console.log(`Loaded robot from ${modelPath}`);
    }, undefined, (error) => {
        console.error(`Error loading robot from ${modelPath}:`, error);
    });
}
