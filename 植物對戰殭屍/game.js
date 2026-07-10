import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#game');
const sunEl = document.querySelector('#sun');
const scoreEl = document.querySelector('#score');
const waveEl = document.querySelector('#wave');
const msg = document.querySelector('#message');
const startBtn = document.querySelector('#startBtn');
const cards = document.querySelectorAll('.plant-card');

const COLS = 9, ROWS = 5, CELL = 1.55;
const costs = { pea: 50, nut: 75, ice: 100 };
const state = { sun: 150, score: 0, wave: 1, selected: 'pea', running: false, plants: [], zombies: [], bullets: [], spawnLeft: 0 };
const modelUrls = {
  plant: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF-Binary/Avocado.glb',
  zombie: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMan/glTF-Binary/CesiumMan.glb'
};
const loaded = { plant: null, zombie: null };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x102316);
scene.fog = new THREE.Fog(0x102316, 11, 23);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
camera.position.set(0, 8.5, 10.8); camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const gridGroup = new THREE.Group();
scene.add(gridGroup);

scene.add(new THREE.HemisphereLight(0xdfffd4, 0x1b2415, 2.3));
const sunLight = new THREE.DirectionalLight(0xfff1b0, 3.2);
sunLight.position.set(-5, 9, 7); sunLight.castShadow = true; scene.add(sunLight);

const loader = new GLTFLoader();
loader.load(modelUrls.plant, gltf => loaded.plant = gltf.scene, undefined, () => note('植物模型載入失敗，已使用備援模型。'));
loader.load(modelUrls.zombie, gltf => loaded.zombie = gltf.scene, undefined, () => note('殭屍模型載入失敗，已使用備援模型。'));

buildBoard(); resize(); window.addEventListener('resize', resize);
cards.forEach(card => card.addEventListener('click', () => selectPlant(card.dataset.plant)));
startBtn.addEventListener('click', startWave);
canvas.addEventListener('pointerdown', placePlant);
setInterval(() => { state.sun += 25; updateHud(); floatText('+25 陽光'); }, 6000);
renderer.setAnimationLoop(tick);

function buildBoard() {
  const ground = new THREE.Mesh(new THREE.BoxGeometry(COLS * CELL + .6, .18, ROWS * CELL + .6), new THREE.MeshStandardMaterial({ color: 0x315d25, roughness: .8 }));
  ground.receiveShadow = true; ground.position.y = -.12; scene.add(ground);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(CELL * .94, .08, CELL * .88), new THREE.MeshStandardMaterial({ color: (r + c) % 2 ? 0x4d8b33 : 0x5aa23d, roughness: .9 }));
    tile.position.set(xFor(c), 0, zFor(r)); tile.userData = { row: r, col: c, occupied: false }; tile.receiveShadow = true; gridGroup.add(tile);
  }
  const house = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, ROWS * CELL + .3), new THREE.MeshStandardMaterial({ color: 0x7a4b2b }));
  house.position.set(xFor(-1), .72, 0); house.castShadow = true; scene.add(house);
}
function selectPlant(type) { state.selected = type; cards.forEach(c => c.classList.toggle('active', c.dataset.plant === type)); }
function placePlant(e) {
  const rect = canvas.getBoundingClientRect(); pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(gridGroup.children)[0];
  if (!hit || hit.object.userData.occupied) return;
  const type = state.selected, cost = costs[type]; if (state.sun < cost) return note('陽光不足！');
  hit.object.userData.occupied = true; state.sun -= cost;
  const plant = makePlant(type); plant.position.copy(hit.object.position); plant.position.y = .18; plant.userData = { type, row: hit.object.userData.row, hp: type === 'nut' ? 520 : 160, cool: 0, tile: hit.object };
  scene.add(plant); state.plants.push(plant); updateHud();
}
function makePlant(type) {
  const g = new THREE.Group();
  if (loaded.plant) { const m = loaded.plant.clone(); m.scale.setScalar(type === 'nut' ? 2.8 : 1.8); m.position.y = .42; tint(m, type === 'ice' ? 0x9fe8ff : type === 'nut' ? 0xc28c4f : 0x6ee05f); g.add(m); }
  else { const body = new THREE.Mesh(new THREE.SphereGeometry(type === 'nut' ? .48 : .34, 18, 14), new THREE.MeshStandardMaterial({ color: type === 'ice' ? 0x88ddff : type === 'nut' ? 0xa86c32 : 0x4ed35f })); body.castShadow = true; body.position.y = .58; g.add(body); }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .52, 16), new THREE.MeshStandardMaterial({ color: 0x204420 })); barrel.rotation.z = Math.PI / 2; barrel.position.set(.38, .72, 0); g.add(barrel); return g;
}
function makeZombie(row) {
  const z = new THREE.Group();
  if (loaded.zombie) { const m = loaded.zombie.clone(); m.scale.setScalar(.008); m.rotation.y = -Math.PI / 2; tint(m, 0x86d36d); z.add(m); }
  else { const mat = new THREE.MeshStandardMaterial({ color: 0x86d36d }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .9, 6, 12), mat); body.position.y = .7; z.add(body); }
  z.position.set(xFor(COLS) + Math.random() * 1.2, .05, zFor(row)); z.userData = { row, hp: 120 + state.wave * 28, speed: .18 + state.wave * .018, bite: 0, slow: 0 }; scene.add(z); state.zombies.push(z);
}
function startWave() { if (state.running) return; state.running = true; state.spawnLeft = 5 + state.wave * 3; note(`第 ${state.wave} 波殭屍來襲！`); }
let last = 0, spawnTimer = 0;
function tick(now) { const dt = Math.min((now - last) / 1000 || 0, .04); last = now; spawnTimer -= dt; if (state.running && state.spawnLeft > 0 && spawnTimer <= 0) { makeZombie(Math.floor(Math.random() * ROWS)); state.spawnLeft--; spawnTimer = Math.max(.85, 2.1 - state.wave * .08); } updatePlants(dt); updateBullets(dt); updateZombies(dt); renderer.render(scene, camera); }
function updatePlants(dt) { for (const p of state.plants) { p.userData.cool -= dt; p.rotation.y = Math.sin(performance.now()/420 + p.position.x) * .08; if (p.userData.type !== 'nut' && p.userData.cool <= 0 && state.zombies.some(z => z.userData.row === p.userData.row && z.position.x > p.position.x)) { shoot(p); p.userData.cool = p.userData.type === 'ice' ? 1.8 : 1.05; } } }
function shoot(p) { const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), new THREE.MeshStandardMaterial({ color: p.userData.type === 'ice' ? 0x9defff : 0xb3ff4f, emissive: p.userData.type === 'ice' ? 0x175e77 : 0x326600 })); b.position.set(p.position.x + .55, .82, p.position.z); b.userData = { row: p.userData.row, damage: p.userData.type === 'ice' ? 30 : 42, ice: p.userData.type === 'ice' }; scene.add(b); state.bullets.push(b); }
function updateBullets(dt) { for (const b of [...state.bullets]) { b.position.x += dt * 4.2; const hit = state.zombies.find(z => z.userData.row === b.userData.row && Math.abs(z.position.x - b.position.x) < .35); if (hit) { hit.userData.hp -= b.userData.damage; if (b.userData.ice) hit.userData.slow = 3; remove(state.bullets, b); scene.remove(b); } else if (b.position.x > xFor(COLS + 1)) { remove(state.bullets, b); scene.remove(b); } } }
function updateZombies(dt) { for (const z of [...state.zombies]) { const blocker = state.plants.find(p => p.userData.row === z.userData.row && Math.abs(p.position.x - z.position.x) < .62); z.rotation.z = Math.sin(performance.now()/180 + z.position.x) * .04; if (blocker) { z.userData.bite -= dt; if (z.userData.bite <= 0) { blocker.userData.hp -= 35; z.userData.bite = .75; } if (blocker.userData.hp <= 0) { blocker.userData.tile.userData.occupied = false; remove(state.plants, blocker); scene.remove(blocker); } } else z.position.x -= z.userData.speed * (z.userData.slow > 0 ? .42 : 1) * dt; z.userData.slow -= dt; if (z.userData.hp <= 0) { state.score += 100; remove(state.zombies, z); scene.remove(z); updateHud(); } if (z.position.x < xFor(-1.35)) { note('殭屍闖入溫室，遊戲結束！重新整理可再挑戰。'); renderer.setAnimationLoop(null); } }
  if (state.running && state.spawnLeft === 0 && state.zombies.length === 0) { state.running = false; state.wave++; state.sun += 75; note('守住了！獎勵 75 陽光。'); updateHud(); }
}
function tint(root, color) { root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = new THREE.MeshStandardMaterial({ color, roughness: .72 }); } }); }
function xFor(c) { return (c - (COLS - 1) / 2) * CELL; } function zFor(r) { return (r - (ROWS - 1) / 2) * CELL; }
function remove(arr, item) { const i = arr.indexOf(item); if (i >= 0) arr.splice(i, 1); }
function updateHud() { sunEl.textContent = state.sun; scoreEl.textContent = state.score; waveEl.textContent = state.wave; }
function note(text) { msg.textContent = text; } function floatText(text) { note(text + '｜' + msg.textContent.replace(/^.*｜/, '')); }
function resize() { const rect = canvas.parentElement.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); }
