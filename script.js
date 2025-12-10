/* script.js
 - Lightweight Three.js animated terrain background
 - Detects touch devices / small screens and reduces work (pauses animation)
 - If Three.js is missing or fails, the page still works (canvas is decorative)
*/

(() => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // basic device checks
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width:600px)').matches;
  const disable3D = isTouch || smallScreen;

  // If device flagged, hide container and skip heavy initialization
  if (disable3D) {
    container.style.display = 'none';
    return;
  }

  // Scene setup
  let scene, camera, renderer, plane, animId;
  let mouseX = 0, mouseY = 0;
  let frame = 0;

  const init = () => {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x071126, 0.0025);

    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 30, 60);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x071126, 1);
    container.appendChild(renderer.domElement);

    // soft directional lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-1, 1, 1).normalize();
    scene.add(dirLight);

    const amb = new THREE.AmbientLight(0x9fcbe6, 0.35);
    scene.add(amb);

    // plane geometry (terrain)
    const cols = 120; // performance vs detail
    const rows = 120;
    const geom = new THREE.PlaneGeometry(120, 120, cols, rows);
    geom.rotateX(-Math.PI / 2);

    // basic vertex displacement and color
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: false,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });

    // set vertex colors
    const colorA = new THREE.Color(0x0ff3d0);
    const colorB = new THREE.Color(0x0a4b6b);
    const colors = [];
    for (let i = 0; i < geom.attributes.position.count; i++) {
      const v = geom.attributes.position;
      // gradient based on y (just to vary color)
      const t = Math.random() * 0.15;
      colors.push(colorA.r + t, colorA.g + t, colorA.b + t);
    }
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    plane = new THREE.Mesh(geom, mat);
    plane.position.y = -6;
    scene.add(plane);

    // mouse move listener
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  };

  function onMouseMove(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    mouseX = (e.clientX - w / 2) / w * 2;
    mouseY = (e.clientY - h / 2) / h * 2;
  }

  function onResize() {
    if (!renderer || !camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    frame += 0.01;
    const pos = plane.geometry.attributes.position;
    const count = pos.count;

    // subtle wave using sine - lightweight alternative to Perlin
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = pos.array[ix];
      const z = pos.array[ix + 2];
      // wave pattern
      pos.array[ix + 1] = Math.sin((x * 0.08) + frame) * 1.6 + Math.cos((z * 0.05) + frame * 0.9) * 1.2;
    }
    pos.needsUpdate = true;
    plane.geometry.computeVertexNormals();

    // camera slight follow mouse
    camera.position.x += (mouseX * 30 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 20 + 28 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  // start
  try {
    init();
    animate();
  } catch (err) {
    // fail gracefully: remove canvas so page remains usable
    console.error('3D init error:', err);
    if (renderer && renderer.domElement) container.removeChild(renderer.domElement);
    container.style.display = 'none';
    return;
  }

  // basic cleanup on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animId = requestAnimationFrame(animate);
    }
  }, { passive: true });

  // notify form (front-end only): show thank-you message (no backend)
  const form = document.getElementById('notify-form');
  if (form) {
    const emailInput = form.querySelector('input[type="email"]');
    const msg = document.getElementById('notify-msg');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = (emailInput.value || '').trim();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        msg.textContent = 'Please enter a valid email address.';
        msg.style.color = '#ffb3b3';
        return;
      }
      // Simple frontend-only "success" flow. Replace with backend integration if needed.
      msg.textContent = 'Thanks! We will notify you when the site is live.';
      msg.style.color = '#c9ffd9';
      emailInput.value = '';
      // optional: store in localStorage as a backup
      try {
        let pending = JSON.parse(localStorage.getItem('maq_notify') || '[]');
        pending.push({ email, ts: Date.now() });
        localStorage.setItem('maq_notify', JSON.stringify(pending));
      } catch (e) { /* ignore localStorage errors */ }
    });
  }
})();
