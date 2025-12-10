/* script.js
 - Restored original green Three.js terrain (old animation feel)
 - Touch/small-screen detection disables 3D for mobile
 - IntersectionObserver reveals services with pop effect
 - Badge pulse + micro-interaction
*/

(() => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // device checks (disable 3D on touch/small screens)
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width:600px)').matches;
  const disable3D = isTouch || smallScreen;

  if (disable3D) {
    container.style.display = 'none';
  } else {
    // --- Restored original green terrain scene ---
    let scene, camera, renderer, plane;
    let mouseX = 0, mouseY = 0;
    let frame = 0;
    let animId;

    function init() {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x071126, 0.0025);

      const width = window.innerWidth;
      const height = window.innerHeight;
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 25, 55);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x071126, 1);
      container.appendChild(renderer.domElement);

      // lights
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(-1, 1, 1).normalize();
      scene.add(dirLight);
      const ambient = new THREE.AmbientLight(0x9fcbe6, 0.35);
      scene.add(ambient);

      // geometry
      const cols = 160;
      const rows = 160;
      const geom = new THREE.PlaneGeometry(160, 140, cols, rows);
      geom.rotateX(-Math.PI / 2);

      // initial vertex colors: green palette
      const colors = [];
      const topColor = new THREE.Color(0x14f0b0); // bright greenish
      for (let i = 0; i < geom.attributes.position.count; i++) {
        const t = (Math.random() * 0.16);
        colors.push(topColor.r + t, topColor.g + t, topColor.b + t);
      }
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.86,
        metalness: 0.02,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.96,
      });

      plane = new THREE.Mesh(geom, mat);
      plane.position.y = -8;
      scene.add(plane);

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
    }

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
      frame += 0.012;
      const pos = plane.geometry.attributes.position;
      const count = pos.count;

      // original wave pattern
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const x = pos.array[ix];
        const z = pos.array[ix + 2];
        pos.array[ix + 1] = Math.sin((x * 0.06) + frame) * 1.8 + Math.cos((z * 0.045) + frame * 0.84) * 1.3;
      }
      pos.needsUpdate = true;
      plane.geometry.computeVertexNormals();

      // camera follow
      camera.position.x += (mouseX * 30 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 20 + 26 - camera.position.y) * 0.03;
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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else animId = requestAnimationFrame(animate);
    }, { passive: true });
  }

  // -------- UI: badge micro-interaction ----------
  const badge = document.getElementById('status-badge');
  if (badge) {
    badge.classList.add('pulse');
    badge.addEventListener('click', () => {
      const pressed = badge.getAttribute('aria-pressed') === 'true';
      badge.setAttribute('aria-pressed', (!pressed).toString());
      if (!pressed) badge.classList.remove('pulse'); else badge.classList.add('pulse');
      badge.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-6px) scale(1.02)' },
        { transform: 'translateY(0) scale(1)' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
    });
  }

  // -------- reveal services with IntersectionObserver ----------
  const services = document.querySelectorAll('.service');
  if (services && services.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          const idx = Array.from(services).indexOf(entry.target);
          entry.target.style.transitionDelay = `${idx * 70}ms`;
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    services.forEach(s => obs.observe(s));
  }
})();
