// basic three.js scene with moving boxes
let scene, camera, renderer, items = [];
function initScene() {
  scene = new THREE.Scene();
  const container = document.getElementById('scene-container');
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const planeGeo = new THREE.PlaneGeometry(20, 5);
  const planeMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const beltGeo = new THREE.BoxGeometry(20, 0.2, 2);
  const beltMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.1;
  scene.add(belt);

  for (let i = 0; i < 5; i++) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0x3498db });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-8 + i * 4, 0.6, 0);
    scene.add(box);
    items.push(box);
  }

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  items.forEach(box => {
    box.position.x += 0.02;
    if (box.position.x > 10) box.position.x = -10;
  });
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const container = document.getElementById('scene-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

initScene();

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = role;
  div.textContent = text;
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = '';
  const loading = document.createElement('div');
  loading.className = 'bot';
  loading.textContent = '處理中...';
  loading.id = 'loading';
  document.getElementById('messages').appendChild(loading);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
  setTimeout(() => {
    document.getElementById('loading').remove();
    addMessage('bot', '（範例回覆）');
  }, 1000);
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);

document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.remove('hidden');
  document.getElementById('grafanaToken').value = localStorage.getItem('grafanaToken') || '';
  document.getElementById('influxKey').value = localStorage.getItem('influxKey') || '';
  document.getElementById('llmKey').value = localStorage.getItem('llmKey') || '';
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.add('hidden');
});

document.getElementById('saveSettings').addEventListener('click', () => {
  localStorage.setItem('grafanaToken', document.getElementById('grafanaToken').value);
  localStorage.setItem('influxKey', document.getElementById('influxKey').value);
  localStorage.setItem('llmKey', document.getElementById('llmKey').value);
  document.getElementById('settingsModal').classList.add('hidden');
});
