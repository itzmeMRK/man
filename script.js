/* script.js
 - Three.js animated terrain (disabled on touch/small screens)
 - UI interactions: badge animation toggle, IntersectionObserver reveal for services,
   notify form (front-end only) with localStorage fallback
*/

(() => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // -------- device checks (disable heavy 3D on touch & small screens) ----------
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width:600px)').matches;
  const disable3D = isTouch || smallScreen;

  if (disable3D) {
    container.style.display = 'none';
  } else {
    // Lightweight Three.js terrain
    let scene, camera, renderer, plane, animId;
    let mouseX = 0, mouseY = 0;
    let frame = 0;

    const init = () => {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x071126, 0.0028);

      const width = window.innerWidth;
      const height = window.innerHeight;
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 30, 60);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x071126, 1);
      container.appendChild(renderer.domElement);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.position.set(-2, 4, 1).normalize();
      scene.add(dirLight);
      const amb = new THREE.AmbientLight(0xb1e0d9, 0.35);
      scene.add(amb);

      const cols = 120;
      const rows = 120;
      const geom = new THREE.PlaneGeometry(140, 120, cols, rows);
      geom.rotateX(-Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.03,
        flatShading: false,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
      });

      // initial vertex colors
      const colors = [];
      const cTop = new THREE.Color(0x0ff3d0);
      for (let i = 0; i < geom.attributes.position.count; i++) {
        const t = Math.random() * 0.12;
        colors.push(cTop.r + t, cTop.g + t, cTop.b + t);
      }
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      plane = new THREE.Mesh(geom, mat);
      plane.position.y = -8;
      scene.add(plane);

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

      // subtle wave
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const x = pos.array[ix];
        const z = pos.array[ix + 2];
        pos.array[ix + 1] = Math.sin((x * 0.07) + frame) * 1.4 + Math.cos((z * 0.05) + frame * 0.95) * 0.95;
      }
      pos.needsUpdate = true;
      plane.geometry.computeVertexNormals();

      // camera follow
      camera.position.x += (mouseX * 30 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 20 + 28 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }

    try {
      init();
      animate();
    } catch (err) {
      console.error('3D init error:', err);
      if (renderer && renderer.domElement) container.removeChild(renderer.domElement);
      container.style.display = 'none';
    }

    // pause on tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animId = requestAnimationFrame(animate);
    }, { passive: true });
  }

  // -------- UI: badge animation toggle & small interaction ----------
  const badge = document.getElementById('status-badge');
  if (badge) {
    // start with pulse to attract attention
    badge.classList.add('pulse');

    // toggle pulse on click for a gentle interactive feel
    badge.addEventListener('click', () => {
      const pressed = badge.getAttribute('aria-pressed') === 'true';
      badge.setAttribute('aria-pressed', (!pressed).toString());
      if (!pressed) badge.classList.remove('pulse');
      else badge.classList.add('pulse');

      // small micro animation
      badge.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-6px) scale(1.02)' },
        { transform: 'translateY(0) scale(1)' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
    });
  }

  // -------- IntersectionObserver to reveal .service items with pop effect ----------
  const services = document.querySelectorAll('.service');
  if (services && services.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-visible');
          // slight stagger: set transition delay proportionally
          const idx = Array.from(services).indexOf(ent.target);
          ent.target.style.transitionDelay = `${idx * 80}ms`;
          obs.unobserve(ent.target);
        }
      });
    }, { threshold: 0.18 });

    services.forEach(s => obs.observe(s));
  }

  // -------- simple notify form (frontend-only) ----------
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
      msg.textContent = 'Thanks! We will notify you when the site is live.';
      msg.style.color = '#c9ffd9';
      emailInput.value = '';

      // save to localStorage as a small backup
      try {
        const key = 'maq_notify';
        let arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push({ email, ts: Date.now() });
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (e) { /* ignore */ }
    });
  }
})();
