/* ============================================================
   HIMANSHU KUMAR – 3D ANIMATED PORTFOLIO – script.js
   ============================================================ */

// ===== LOADER =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2200);
});

// ===== THREE.JS – 3D PARTICLE SYSTEM =====
(function initThreeJS() {
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // --- Particle System ---
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color(0x6c63ff), // Purple
    new THREE.Color(0x00d4ff), // Cyan
    new THREE.Color(0xff6b9d), // Pink
    new THREE.Color(0x00e676), // Green
    new THREE.Color(0xffd740), // Gold
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Distribute particles in a sphere
    const radius = 25 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = Math.random() * 2.5 + 0.5;

    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom shader material for glowing particles
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform vec2 uMouse;

      void main() {
        vColor = color;

        vec3 pos = position;

        // Gentle wave motion
        pos.x += sin(uTime * 0.3 + position.y * 0.05) * 0.8;
        pos.y += cos(uTime * 0.2 + position.x * 0.05) * 0.8;
        pos.z += sin(uTime * 0.25 + position.z * 0.05) * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;

        // Distance-based alpha
        float dist = length(mvPosition.xyz);
        vAlpha = smoothstep(60.0, 10.0, dist) * 0.8;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Soft circle
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // --- Geometric shapes floating ---
  const geometries = [
    new THREE.TorusGeometry(2, 0.5, 16, 32),
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.IcosahedronGeometry(1.8, 0),
    new THREE.TorusKnotGeometry(1.5, 0.4, 64, 8),
    new THREE.DodecahedronGeometry(1.5, 0),
  ];

  const shapeMeshes = [];
  const shapeColors = [0x6c63ff, 0x00d4ff, 0xff6b9d, 0x00e676, 0xffd740];

  geometries.forEach((geo, i) => {
    const material = new THREE.MeshBasicMaterial({
      color: shapeColors[i],
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const mesh = new THREE.Mesh(geo, material);

    const angle = (i / geometries.length) * Math.PI * 2;
    const radius = 18 + Math.random() * 8;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 20,
      Math.sin(angle) * radius - 10
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    scene.add(mesh);
    shapeMeshes.push({
      mesh,
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.005,
      },
      floatSpeed: 0.2 + Math.random() * 0.3,
      floatAmplitude: 1 + Math.random() * 2,
      initialY: mesh.position.y,
    });
  });

  // --- Connection Lines ---
  const lineCount = 60;
  const linePositions = new Float32Array(lineCount * 6);
  const lineColors = new Float32Array(lineCount * 6);

  for (let i = 0; i < lineCount; i++) {
    const i6 = i * 6;
    const r1 = 15 + Math.random() * 20;
    const theta1 = Math.random() * Math.PI * 2;
    const phi1 = Math.acos(2 * Math.random() - 1);

    linePositions[i6] = r1 * Math.sin(phi1) * Math.cos(theta1);
    linePositions[i6 + 1] = r1 * Math.sin(phi1) * Math.sin(theta1);
    linePositions[i6 + 2] = r1 * Math.cos(phi1);

    const r2 = 15 + Math.random() * 20;
    const theta2 = theta1 + (Math.random() - 0.5) * 0.5;
    const phi2 = phi1 + (Math.random() - 0.5) * 0.5;

    linePositions[i6 + 3] = r2 * Math.sin(phi2) * Math.cos(theta2);
    linePositions[i6 + 4] = r2 * Math.sin(phi2) * Math.sin(theta2);
    linePositions[i6 + 5] = r2 * Math.cos(phi2);

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    lineColors[i6] = color.r;
    lineColors[i6 + 1] = color.g;
    lineColors[i6 + 2] = color.b;
    lineColors[i6 + 3] = color.r;
    lineColors[i6 + 4] = color.g;
    lineColors[i6 + 5] = color.b;
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // --- Mouse interaction ---
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;

  document.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- Scroll tracking ---
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // --- Animation loop ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Smooth mouse follow
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Update uniforms
    particleMaterial.uniforms.uTime.value = elapsedTime;
    particleMaterial.uniforms.uMouse.value.set(mouseX, mouseY);

    // Rotate particle system
    particleSystem.rotation.y = elapsedTime * 0.03 + mouseX * 0.15;
    particleSystem.rotation.x = mouseY * 0.08;

    // Scroll-based camera movement
    const scrollFactor = scrollY * 0.001;
    camera.position.y = -scrollFactor * 5;
    camera.position.z = 30 + scrollFactor * 3;

    // Animate lines
    lines.rotation.y = elapsedTime * 0.02;
    lines.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;

    // Animate shapes
    shapeMeshes.forEach((shape) => {
      shape.mesh.rotation.x += shape.rotSpeed.x;
      shape.mesh.rotation.y += shape.rotSpeed.y;
      shape.mesh.rotation.z += shape.rotSpeed.z;
      shape.mesh.position.y = shape.initialY + Math.sin(elapsedTime * shape.floatSpeed) * shape.floatAmplitude;
    });

    renderer.render(scene, camera);
  }

  animate();

  // --- Resize handler ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


// ===== CUSTOM CURSOR =====
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;

  let curX = 0, curY = 0;
  let folX = 0, folY = 0;

  document.addEventListener('mousemove', (e) => {
    curX = e.clientX;
    curY = e.clientY;
  });

  function animateCursor() {
    folX += (curX - folX) * 0.12;
    folY += (curY - folY) * 0.12;

    cursor.style.left = curX - 10 + 'px';
    cursor.style.top = curY - 10 + 'px';
    follower.style.left = folX - 20 + 'px';
    follower.style.top = folY - 20 + 'px';

    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  // Hover effect on interactive elements
  const hoverElements = document.querySelectorAll('a, button, .skill-tag, .stat-card, .project-card, .contact-link');
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
})();


// ===== TYPING EFFECT =====
(function initTypingEffect() {
  const words = ['server.', 'backend.', 'APIs.', 'databases.', 'cloud.', 'web.'];
  const typedElement = document.getElementById('typedText');
  if (!typedElement) return;

  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function type() {
    const currentWord = words[wordIndex];

    if (isDeleting) {
      typedElement.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      typedElement.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 120;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      typeSpeed = 2000; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 400; // Pause before new word
    }

    setTimeout(type, typeSpeed);
  }

  // Start after loader
  setTimeout(type, 2500);
})();


// ===== NAVBAR SCROLL EFFECT =====
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    // Scrolled state
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active section highlighting
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
})();


// ===== MOBILE MENU =====
(function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    links.classList.toggle('open');
  });

  // Close menu on link click
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      btn.classList.remove('active');
      links.classList.remove('open');
    });
  });
})();


// ===== SCROLL REVEAL =====
(function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));
})();


// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Logo click scrolls to top
document.getElementById('nav-logo')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


// ===== CONTACT FORM HANDLER =====
function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const originalText = btn.textContent;

  btn.textContent = 'Sending...';
  btn.style.opacity = '0.7';

  setTimeout(() => {
    btn.textContent = '✓ Message Sent!';
    btn.style.background = 'linear-gradient(135deg, #00e676, #00d4ff)';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.opacity = '';
      e.target.reset();
    }, 2500);
  }, 1500);
}


// ===== TILT EFFECT ON CARDS =====
(function initTiltEffect() {
  const cards = document.querySelectorAll('.skill-category, .project-card, .about-info-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ===== PARALLAX ON FLOATING ORBS =====
(function initParallax() {
  const orbs = document.querySelectorAll('.floating-orb');

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 15;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
})();


// ===== MAGNETIC BUTTONS =====
(function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();


// ===== COUNTER ANIMATION =====
(function initCounterAnimation() {
  const statNumbers = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const finalText = el.textContent;
          const finalNum = parseInt(finalText);

          if (!isNaN(finalNum) && !el.dataset.animated) {
            el.dataset.animated = 'true';
            let current = 0;
            const increment = Math.ceil(finalNum / 40);
            const timer = setInterval(() => {
              current += increment;
              if (current >= finalNum) {
                el.textContent = finalText;
                clearInterval(timer);
              } else {
                el.textContent = current + '+';
              }
            }, 40);
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => observer.observe(stat));
})();
