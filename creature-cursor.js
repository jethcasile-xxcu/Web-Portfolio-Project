const canvas = document.getElementById('creature-canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

// Handle window resizing dynamically
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Cursor position tracking
const mouse = { x: width / 2, y: height / 2 };
const targetMouse = { x: width / 2, y: height / 2 };

// Sweep wave animation controls
let sweepProgress = 1;   // Start at 1 (hidden) so it doesn't streak on initial page load
let targetSweep = 1;     // Start hidden
let idleTimer = null;    // Detects when cursor movement stops

// Segment chain setup (Inverse Kinematics Spine)
const numSegments = 24;
const segmentLength = 11;
const segments = Array.from({ length: numSegments }, () => ({
  x: width / 2,
  y: height / 2,
}));

window.addEventListener('mousemove', (e) => {
  // FIX: If creature was hidden/swept away, snap all body joints instantly 
  // to the current mouse position. This eliminates stretching from the old location.
  if (sweepProgress > 0.8) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    targetMouse.x = e.clientX;
    targetMouse.y = e.clientY;

    for (let i = 0; i < numSegments; i++) {
      segments[i].x = e.clientX;
      segments[i].y = e.clientY;
    }
  } else {
    targetMouse.x = e.clientX;
    targetMouse.y = e.clientY;
  }

  // Reactivate creature immediately on mouse move
  targetSweep = 0;

  // Start tail-to-head sweep fade 250ms after cursor stops
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    targetSweep = 1;
  }, 250);
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Smooth lerp for sweep progress (fast recovery when moving, majestic sweep when idle)
  const sweepSpeed = targetSweep === 1 ? 0.035 : 0.25;
  sweepProgress += (targetSweep - sweepProgress) * sweepSpeed;

  // Only render when the sweep hasn't fully consumed the head segment
  if (sweepProgress < 1.05) {
    // Smooth lerp for head segment tracking cursor
    mouse.x += (targetMouse.x - mouse.x) * 0.28;
    mouse.y += (targetMouse.y - mouse.y) * 0.28;

    segments[0].x = mouse.x;
    segments[0].y = mouse.y;

    // Calculate distance constraints for each spine joint
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

    // Pre-calculate per-segment opacity wave (Tail tip fades first -> Head fades last)
    const segmentAlphas = new Float32Array(numSegments);
    for (let i = 0; i < numSegments; i++) {
      const normI = i / (numSegments - 1); // 0.0 = Head, 1.0 = Tail tip
      const fadeStart = (1 - normI) * 0.6;  // Tail starts fading at 0.0, Head starts at 0.6
      const fadeEnd = fadeStart + 0.4;      // Tail fully gone at 0.4, Head fully gone at 1.0
      
      const alpha = (fadeEnd - sweepProgress) / (fadeEnd - fadeStart);
      segmentAlphas[i] = Math.max(0, Math.min(1, alpha));
    }

    // Render tail segments from back (tail) to front (head)
    for (let i = numSegments - 1; i >= 0; i--) {
      const currentAlpha = segmentAlphas[i];
      if (currentAlpha <= 0) continue; // Skip rendering completely extinguished segments

      const curr = segments[i];
      const ratio = 1 - i / numSegments;
      const radius = Math.max(1.5, 8.5 * ratio);

      // Draw connecting body segment line if adjacent segment is visible
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

      // Draw joint node circle
      ctx.beginPath();
      ctx.arc(curr.x, curr.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.45 * ratio + 0.05) * currentAlpha})`;

      // Head glow effect
      if (i === 0) {
        ctx.shadowBlur = 14 * currentAlpha;
        ctx.shadowColor = `rgba(255, 255, 255, ${0.8 * currentAlpha})`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fill();
    }
  }

  requestAnimationFrame(animate);
}

animate();