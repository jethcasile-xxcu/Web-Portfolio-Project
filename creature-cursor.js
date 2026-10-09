document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. cursor trail ni nga part
     ========================================================================== */
  const canvas = document.getElementById('creature-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const mouse = { x: width / 2, y: height / 2 };
    const targetMouse = { x: width / 2, y: height / 2 };

    let sweepProgress = 1;
    let targetSweep = 1;
    let idleTimer = null;

    const numSegments = 24;
    const segmentLength = 11;
    const segments = Array.from({ length: numSegments }, () => ({
      x: width / 2,
      y: height / 2,
    }));

    function handlePointerInput(x, y) {
      if (sweepProgress > 0.8) {
        mouse.x = x;
        mouse.y = y;
        targetMouse.x = x;
        targetMouse.y = y;

        for (let i = 0; i < numSegments; i++) {
          segments[i].x = x;
          segments[i].y = y;
        }
      } else {
        targetMouse.x = x;
        targetMouse.y = y;
      }

      targetSweep = 0;

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        targetSweep = 1;
      }, 250);
    }

    window.addEventListener('mousemove', (e) => {
      handlePointerInput(e.clientX, e.clientY);
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointerInput(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointerInput(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      targetSweep = 1;
    });

    function animateCreature() {
      ctx.clearRect(0, 0, width, height);

      const sweepSpeed = targetSweep === 1 ? 0.035 : 0.25;
      sweepProgress += (targetSweep - sweepProgress) * sweepSpeed;

      if (sweepProgress < 1.05) {
        mouse.x += (targetMouse.x - mouse.x) * 0.28;
        mouse.y += (targetMouse.y - mouse.y) * 0.28;

        segments[0].x = mouse.x;
        segments[0].y = mouse.y;

        for (let i = 1; i < numSegments; i++) {
          const prev = segments[i - 1];
          const curr = segments[i];

          const dx = prev.x - curr.x;
          const dy = prev.y - curr.y;
          const angle = Math.atan2(dy, dx);
          const dist = Math.hypot(dx, dy);

          if (dist > segmentLength) {
            curr.x = prev.x - Math.cos(angle) * segmentLength;
            curr.y = prev.y - Math.sin(angle) * segmentLength;
          }
        }

        const segmentAlphas = new Float32Array(numSegments);
        for (let i = 0; i < numSegments; i++) {
          const normI = i / (numSegments - 1);
          const fadeStart = (1 - normI) * 0.5;
          const fadeEnd = fadeStart + 0.3;
          const alpha = (fadeEnd - sweepProgress) / (fadeEnd - fadeStart);
          segmentAlphas[i] = Math.max(0, Math.min(1, alpha));
        }

        for (let i = numSegments - 1; i >= 0; i--) {
          const currentAlpha = segmentAlphas[i];
          if (currentAlpha <= 0) continue;

          const curr = segments[i];
          const ratio = 1 - i / numSegments;
          const radius = Math.max(1.5, 8.5 * ratio);

          if (i > 0 && segmentAlphas[i - 1] > 0) {
            const prev = segments[i - 1];
            const lineAlpha = (currentAlpha + segmentAlphas[i - 1]) / 2;
            ctx.beginPath();
            ctx.moveTo(curr.x, curr.y);
            ctx.lineTo(prev.x, prev.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${(0.12 * ratio + 0.03) * lineAlpha})`;
            ctx.lineWidth = radius * 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(curr.x, curr.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.45 * ratio + 0.05) * currentAlpha})`;

          if (i === 0) {
            ctx.shadowBlur = 14 * currentAlpha;
            ctx.shadowColor = `rgba(255, 255, 255, ${0.8 * currentAlpha})`;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      requestAnimationFrame(animateCreature);
    }

    animateCreature();
  }

  /* ==========================================================================
     2. mo switch akong pfp tungod ani 
     ========================================================================== */
  const realImg = document.getElementById('realImg');
  if (realImg) {
    const isLight = document.body.classList.contains('light');
    realImg.src = isLight ? 'images/mypfplight.jpg' : 'images/mypfpdark.jpg';
  }

  /* ==========================================================================
     3. moouse glow sa project cards
     ========================================================================== */
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* ==========================================================================
     4. Theme Switcher with wipe animation ni nga part
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  let isWiping = false;

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', (e) => {
      if (isWiping) return;
      isWiping = true;

      const isLight = document.body.classList.contains('light');
      const targetIsLight = !isLight;

      const rect = themeToggleBtn.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;

      const overlay = document.createElement('div');
      overlay.className = 'theme-wipe-overlay';
      overlay.style.backgroundColor = targetIsLight ? '#f8fafc' : '#09090b';
      document.body.appendChild(overlay);

      const applyThemeChanges = () => {
        document.body.classList.toggle('light', targetIsLight);

        // pfp
        if (realImg) {
          realImg.src = targetIsLight ? 'images/mypfplight.jpg' : 'images/mypfpdark.jpg';
        }

        // lucide icon ni
        const icon = document.getElementById('theme-icon');
        if (icon) {
          icon.setAttribute('data-lucide', targetIsLight ? 'moon' : 'sun');
          if (window.lucide) lucide.createIcons();
        }
      };

      if (window.gsap) {
        gsap.fromTo(
          overlay,
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          {
            clipPath: `circle(150vmax at ${x}px ${y}px)`,
            duration: 0.65,
            ease: 'power3.inOut',
            onComplete: () => {
              applyThemeChanges();

              gsap.to(overlay, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                  overlay.remove();
                  isWiping = false;
                },
              });
            },
          }
        );
      } else {
        applyThemeChanges();
        overlay.remove();
        isWiping = false;
      }
    });
  }

  // lucode icon japon
  if (window.lucide) {
    lucide.createIcons();
  }
});

/* ==========================================================================
     5. PFP Video Hover / Touch Reveal (Light & Dark Theme)
     ========================================================================== */
  const pfpContainer = document.getElementById('pfpContainer');
  if (pfpContainer) {
    function getActiveVideo() {
      const isLight = document.body.classList.contains('light');
      return isLight
        ? pfpContainer.querySelector('.light-asset.pfp-video')
        : pfpContainer.querySelector('.dark-asset.pfp-video');
    }

    function playPfpVideo(e) {
      if (e.type === 'touchstart') e.preventDefault();
      pfpContainer.classList.add('active');

      const activeVideo = getActiveVideo();
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {});
      }
    }

    function stopPfpVideo() {
      pfpContainer.classList.remove('active');
      const videos = pfpContainer.querySelectorAll('.pfp-video');
      videos.forEach((vid) => {
        vid.pause();
        vid.currentTime = 0;
      });
    }

    // Desktop Mouse Hover
    pfpContainer.addEventListener('mouseenter', playPfpVideo);
    pfpContainer.addEventListener('mouseleave', stopPfpVideo);

    // Mobile Touch & Hold
    pfpContainer.addEventListener('touchstart', playPfpVideo, { passive: false });
    pfpContainer.addEventListener('touchend', stopPfpVideo);
    pfpContainer.addEventListener('touchcancel', stopPfpVideo);
  }