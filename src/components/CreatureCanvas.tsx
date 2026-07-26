import { useEffect, useRef, useCallback } from 'react';
import type { CreatureData, TailType } from '../types';
import { getSoulCoreColor, getEmotionColor } from '../utils/creatureGen';

interface CreatureCanvasProps {
  creature: CreatureData;
  interactive?: boolean;
  size?: number;
  onPet?: () => void;
}

export default function CreatureCanvas({ creature, size = 200, onPet }: CreatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const blinkRef = useRef(0);
  const idleActionRef = useRef(0);
  const idleTimerRef = useRef(0);
  const showEmotionParticlesRef = useRef(true);

  const c = creature.appearance;

  // Simplify hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgb = hexToRgb(c.baseColor);
  const accent = hexToRgb(c.accentColor);
  const eyeRgb = hexToRgb(c.eyeColor);

  const emotion = creature.emotion || 'neutral';
  const emotionRgb = hexToRgb(getEmotionColor(emotion));
  const soulRgb = hexToRgb(getSoulCoreColor(emotion));

  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 10;
    const s = size / 200; // scale factor

    ctx.clearRect(0, 0, W, H);

    // --- BREATHING ---
    const breath = Math.sin(t * 0.02) * 0.02 + 1;
    // --- IDLE ACTION ---
    const idleAction = idleActionRef.current;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(breath, breath);

    // === DYNAMIC TAIL ===
    drawTail(ctx, t, s, c.tailType);

    // === BODY ===
    ctx.save();
    if (emotion === 'angry') {
      ctx.rotate(Math.sin(t * 0.1) * 0.02);
    }

    // Body shadow
    ctx.beginPath();
    ctx.ellipse(0, 10 * s, 55 * s, 48 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,0.15)`;
    ctx.fill();

    // Main body - rounded organic shape
    ctx.beginPath();
    ctx.moveTo(0, -50 * s);
    ctx.bezierCurveTo(
      35 * s, -55 * s, 55 * s, -30 * s, 60 * s, 0
    );
    ctx.bezierCurveTo(
      62 * s, 20 * s, 55 * s, 40 * s, 40 * s, 48 * s
    );
    ctx.bezierCurveTo(
      25 * s, 55 * s, -25 * s, 55 * s, -40 * s, 48 * s
    );
    ctx.bezierCurveTo(
      -55 * s, 40 * s, -62 * s, 20 * s, -60 * s, 0
    );
    ctx.bezierCurveTo(
      -55 * s, -30 * s, -35 * s, -55 * s, 0, -50 * s
    );
    ctx.closePath();

    const bodyGrad = ctx.createRadialGradient(-15 * s, -10 * s, 5 * s, 0, 0, 70 * s);
    bodyGrad.addColorStop(0, `rgb(${rgb.r + 40}, ${rgb.g + 40}, ${rgb.b + 40})`);
    bodyGrad.addColorStop(0.6, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    bodyGrad.addColorStop(1, `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Body outline glow matching emotion
    ctx.shadowColor = `rgb(${emotionRgb.r}, ${emotionRgb.g}, ${emotionRgb.b})`;
    ctx.shadowBlur = 15 + Math.sin(t * 0.03) * 5;
    ctx.strokeStyle = `rgba(${emotionRgb.r}, ${emotionRgb.g}, ${emotionRgb.b}, 0.2)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === PATTERN MARKINGS ===
    if (c.pattern === 'spots') {
      for (let i = 0; i < c.markings; i++) {
        const angle = (i / c.markings) * Math.PI * 2 + 0.5;
        const dist = 25 * s + Math.sin(i * 2) * 5 * s;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist * 0.6, (4 + i % 3) * s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.3)`;
        ctx.fill();
      }
    }

    if (c.pattern === 'stripes') {
      for (let i = 0; i < 3; i++) {
        const y = -20 * s + i * 15 * s;
        ctx.beginPath();
        ctx.moveTo(-35 * s + Math.sin(i) * 10 * s, y);
        ctx.lineTo(35 * s + Math.cos(i) * 10 * s, y + 5 * s);
        ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.2)`;
        ctx.lineWidth = 4 * s;
        ctx.stroke();
      }
    }

    // === HORNS ===
    if (c.hornType !== 'none') {
      ctx.strokeStyle = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
      ctx.lineWidth = 4 * s;
      ctx.lineCap = 'round';
      ctx.shadowColor = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
      ctx.shadowBlur = 8;

      if (c.hornType === 'curved') {
        ctx.beginPath(); ctx.moveTo(-22 * s, -38 * s); ctx.quadraticCurveTo(-35 * s, -60 * s, -15 * s, -65 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(22 * s, -38 * s); ctx.quadraticCurveTo(35 * s, -60 * s, 15 * s, -65 * s); ctx.stroke();
      } else if (c.hornType === 'spikes') {
        ctx.beginPath(); ctx.moveTo(-20 * s, -40 * s); ctx.lineTo(-30 * s, -60 * s); ctx.lineTo(-15 * s, -45 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20 * s, -40 * s); ctx.lineTo(30 * s, -60 * s); ctx.lineTo(15 * s, -45 * s); ctx.stroke();
      } else if (c.hornType === 'glow') {
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(-15 * s, -38 * s); ctx.quadraticCurveTo(-25 * s, -55 * s, -10 * s, -55 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15 * s, -38 * s); ctx.quadraticCurveTo(25 * s, -55 * s, 10 * s, -55 * s); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // === EARS ===
    ctx.fillStyle = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
    ctx.beginPath(); ctx.ellipse(-35 * s, -30 * s, 12 * s, 16 * s, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(35 * s, -30 * s, 12 * s, 16 * s, 0.3, 0, Math.PI * 2); ctx.fill();
    // Inner ears
    ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.3)`;
    ctx.beginPath(); ctx.ellipse(-35 * s, -28 * s, 6 * s, 9 * s, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(35 * s, -28 * s, 6 * s, 9 * s, 0.3, 0, Math.PI * 2); ctx.fill();

    // === SOUL CORE (glowing chest) ===
    const pulseSpeed = emotion === 'loved' ? 0.06 : emotion === 'happy' ? 0.04 : emotion === 'sleepy' ? 0.015 : 0.025;
    const corePulse = Math.sin(t * pulseSpeed) * 0.2 + 0.8;
    const coreBrightness = emotion === 'loved' ? 1.2 : emotion === 'sleepy' ? 0.4 : 0.8;

    ctx.save();
    // Outer glow
    const glowGrad = ctx.createRadialGradient(0, 10 * s, 2 * s, 0, 10 * s, 25 * s * corePulse);
    glowGrad.addColorStop(0, `rgba(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b}, ${0.5 * coreBrightness})`);
    glowGrad.addColorStop(0.5, `rgba(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b}, ${0.2 * coreBrightness})`);
    glowGrad.addColorStop(1, `rgba(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b}, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(0, 10 * s, 25 * s * corePulse, 0, Math.PI * 2); ctx.fill();

    // Core orb
    ctx.shadowColor = `rgb(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b})`;
    ctx.shadowBlur = 20 * corePulse;
    const orbGrad = ctx.createRadialGradient(-3 * s, 7 * s, 1 * s, 0, 10 * s, 7 * s);
    orbGrad.addColorStop(0, `rgb(${Math.min(255, soulRgb.r + 100)}, ${Math.min(255, soulRgb.g + 100)}, ${Math.min(255, soulRgb.b + 100)})`);
    orbGrad.addColorStop(0.6, `rgb(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b})`);
    orbGrad.addColorStop(1, `rgb(${Math.max(0, soulRgb.r - 50)}, ${Math.max(0, soulRgb.g - 50)}, ${Math.max(0, soulRgb.b - 50)})`);
    ctx.fillStyle = orbGrad;
    ctx.beginPath(); ctx.arc(0, 10 * s, 7 * s * corePulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Orbiting stars (only when happy or loved)
    if ((emotion === 'happy' || emotion === 'loved') && creature.bondLevel > 20) {
      const starCount = emotion === 'loved' ? 3 : 2;
      for (let i = 0; i < starCount; i++) {
        const angle = (i / starCount) * Math.PI * 2 + t * 0.02;
        const dist = 16 * s + Math.sin(t * 0.01 + i) * 3 * s;
        const sx = Math.cos(angle) * dist;
        const sy = 10 * s + Math.sin(angle) * dist;
        ctx.fillStyle = `rgb(${soulRgb.r}, ${soulRgb.g}, ${soulRgb.b})`;
        ctx.globalAlpha = 0.6 + Math.sin(t * 0.05 + i) * 0.3;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2;
          const r = 3 * s;
          ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
          ctx.lineTo(sx + Math.cos(a + 0.3) * r * 0.3, sy + Math.sin(a + 0.3) * r * 0.3);
        }
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // === EYES ===
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-18 * s, -10 * s, 12 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18 * s, -10 * s, 12 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();

    // Pupils - with constellations!
    const pupilY = -10 * s;
    const pupilXOffset = Math.sin(t * 0.015) * 2 * s;
    const pupilSize = emotion === 'sleepy' ? 6 * s : 7 * s;

    // Sleepy = half-closed
    if (emotion === 'sleepy') {
      ctx.fillStyle = `rgb(${eyeRgb.r}, ${eyeRgb.g}, ${eyeRgb.b})`;
      ctx.beginPath(); ctx.ellipse(-18 * s + pupilXOffset, pupilY, pupilSize, pupilSize * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18 * s + pupilXOffset, pupilY, pupilSize, pupilSize * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      // Sleepy lids
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.beginPath(); ctx.ellipse(-18 * s, pupilY - 3 * s, 14 * s, 6 * s, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18 * s, pupilY - 3 * s, 14 * s, 6 * s, 0, Math.PI, 0); ctx.fill();
    } else {
      // Normal eyes with glow
      ctx.shadowColor = `rgb(${eyeRgb.r}, ${eyeRgb.g}, ${eyeRgb.b})`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `rgb(${eyeRgb.r}, ${eyeRgb.g}, ${eyeRgb.b})`;
      ctx.beginPath(); ctx.ellipse(-18 * s + pupilXOffset, pupilY, pupilSize, pupilSize, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18 * s + pupilXOffset, pupilY, pupilSize, pupilSize, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Pupil sparkle
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(-15 * s + pupilXOffset, -13 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(21 * s + pupilXOffset, -13 * s, 3 * s, 0, Math.PI * 2); ctx.fill();

      // Constellation in pupils (tiny dots)
      ctx.fillStyle = `rgba(255,255,255,0.5)`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = `rgb(${eyeRgb.r}, ${eyeRgb.g}, ${eyeRgb.b})`;
      const starPositions = [[-20, -8], [-16, -6], [16, -8], [20, -6]];
      starPositions.forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx * s + pupilXOffset, sy * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    // Blink
    if (blinkRef.current > 0) {
      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.beginPath(); ctx.ellipse(-18 * s, -10 * s, 14 * s, Math.max(0.5, blinkRef.current) * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18 * s, -10 * s, 14 * s, Math.max(0.5, blinkRef.current) * s, 0, 0, Math.PI * 2); ctx.fill();
    }

    // === MOUTH ===
    if (idleAction === 2) {
      // Yawn mouth
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.ellipse(0, 15 * s, 8 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    } else if (emotion === 'happy' || emotion === 'loved') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 5 * s, 12 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (emotion === 'angry') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2.5 * s;
      ctx.beginPath();
      ctx.arc(0, 20 * s, 10 * s, Math.PI + 0.3, -0.3);
      ctx.stroke();
      // Angry eyebrows
      ctx.strokeStyle = `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
      ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(-28 * s, -24 * s); ctx.lineTo(-12 * s, -20 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28 * s, -24 * s); ctx.lineTo(12 * s, -20 * s); ctx.stroke();
    }

    // === EMOTION PARTICLES ===
    if (showEmotionParticlesRef.current) {
      if (emotion === 'happy') {
        // Small sparkles floating up
        for (let i = 0; i < 3; i++) {
          const px = Math.sin(t * 0.02 + i * 2) * 30 * s;
          const py = -55 * s - (t * 0.2 + i * 20) % 30 * s;
          ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(t * 0.05 + i) * 0.2})`;
          ctx.beginPath();
          ctx.arc(px, py, 2 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (emotion === 'sleepy') {
        // Zzz
        const zOffset = (t * 0.05 + 0) % 40 * s;
        ctx.fillStyle = `rgba(135, 206, 235, ${0.5 - zOffset / 80})`;
        ctx.font = `${14 * s}px serif`;
        ctx.fillText('Z', 30 * s, -45 * s + zOffset);
        ctx.fillText('z', 38 * s, -55 * s + zOffset + 10 * s);
        ctx.fillText('z', 44 * s, -60 * s + zOffset + 20 * s);
      } else if (emotion === 'loved') {
        // Hearts
        for (let i = 0; i < 2; i++) {
          const hx = Math.cos(t * 0.01 + i * 3) * 35 * s;
          const hy = -20 * s + Math.sin(t * 0.02 + i * 2) * 15 * s;
          ctx.fillStyle = `rgba(255, 105, 180, ${0.4 + Math.sin(t * 0.03 + i) * 0.2})`;
          ctx.font = `${12 * s}px serif`;
          ctx.fillText('♥', hx, hy);
        }
      } else if (emotion === 'angry') {
        // Tiny flames
        for (let i = 0; i < 2; i++) {
          const fx = (i === 0 ? -1 : 1) * 35 * s;
          const fy = -25 * s + Math.sin(t * 0.08 + i) * 5 * s;
          ctx.shadowColor = '#FF4400';
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(255, 68, 0, ${0.6 + Math.sin(t * 0.1 + i) * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(fx, fy + 8 * s);
          ctx.quadraticCurveTo(fx - 6 * s, fy, fx, fy - 6 * s);
          ctx.quadraticCurveTo(fx + 6 * s, fy, fx, fy + 8 * s);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore(); // end body translate/scale

    // === ABOVE ALL: floating magical aura particles ===
    for (let i = 0; i < 5; i++) {
      const ax = Math.cos(t * 0.008 + i * 1.3) * 50 * s;
      const ay = Math.sin(t * 0.01 + i * 1.7) * 40 * s;
      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.1 + Math.sin(t * 0.02 + i * 2) * 0.05})`;
      ctx.beginPath();
      ctx.arc(cx + ax, cy + ay, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end creature transform
  }, [creature, size, emotion, c, rgb, accent, eyeRgb, emotionRgb, soulRgb]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const animate = () => {
      timeRef.current++;

      // Blink timer
      if (Math.random() < 0.005) blinkRef.current = 4 * (size / 200);

      if (blinkRef.current > 0) {
        blinkRef.current -= 0.15;
        if (blinkRef.current < 0) blinkRef.current = 0;
      }

      // Idle action cycling
      if (timeRef.current - idleTimerRef.current > 400 + Math.random() * 300) {
        idleActionRef.current = Math.floor(Math.random() * 3); // 0=normal, 1=stretch, 2=yawn
        idleTimerRef.current = timeRef.current;
      }

      draw(ctx, timeRef.current);

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [draw, size]);

  const handleClick = () => {
    onPet?.();
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('soft');
    } catch {}
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
      }}
    />
  );
}

// === DYNAMIC TAIL RENDERERS ===
function drawTail(ctx: CanvasRenderingContext2D, t: number, s: number, tailType: TailType) {
  ctx.save();
  const sway = Math.sin(t * 0.025) * 8 * s;

  switch (tailType) {
    case 'fox': {
      // Galaxy tail - big, fluffy
      ctx.beginPath();
      ctx.moveTo(-50 * s, 5 * s + sway);
      ctx.quadraticCurveTo(-70 * s, -5 * s + sway * 0.5, -80 * s, -25 * s + sway * 0.3);
      ctx.strokeStyle = `rgba(108, 92, 231, 0.6)`;
      ctx.lineWidth = 18 * s;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Galaxy sparkles
      for (let i = 0; i < 6; i++) {
        const tx = -60 * s - Math.sin(t * 0.01 + i * 1.2) * 15 * s;
        const ty = -15 * s + sway * 0.3 + Math.cos(t * 0.02 + i * 2) * 10 * s;
        ctx.beginPath();
        ctx.arc(tx, ty, 2 * s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(t * 0.03 + i) * 0.2})`;
        ctx.fill();
      }
      // Tip glow
      ctx.beginPath();
      ctx.arc(-75 * s, -22 * s + sway * 0.3, 6 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108, 92, 231, 0.3)';
      ctx.fill();
      break;
    }
    case 'cat': {
      // Nebula smoke tail - wispy
      ctx.beginPath();
      ctx.moveTo(-50 * s, 5 * s + sway);
      ctx.quadraticCurveTo(-65 * s, -10 * s + sway * 0.5, -75 * s, -20 * s + sway * 0.3);
      ctx.strokeStyle = `rgba(162, 155, 254, 0.5)`;
      ctx.lineWidth = 12 * s;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Smoke wisps
      for (let i = 0; i < 4; i++) {
        const tx = -55 * s - i * 6 * s;
        const ty = -5 * s + sway * 0.4 + Math.sin(t * 0.03 + i * 2) * 8 * s;
        ctx.beginPath();
        ctx.arc(tx, ty, (4 - i) * s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(162, 155, 254, ${0.15 - i * 0.03})`;
        ctx.fill();
      }
      break;
    }
    case 'dragon': {
      // Fire ribbon tail
      ctx.beginPath();
      ctx.moveTo(-50 * s, 5 * s + sway);
      ctx.quadraticCurveTo(-68 * s, -8 * s + sway * 0.5, -78 * s, -18 * s + sway * 0.3);
      ctx.strokeStyle = `rgba(255, 107, 107, 0.5)`;
      ctx.lineWidth = 14 * s;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Fire tip
      const fireSize = 8 * s + Math.sin(t * 0.08) * 3 * s;
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(-78 * s, -18 * s + sway * 0.3, fireSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 150, 50, ${0.4 + Math.sin(t * 0.06) * 0.2})`;
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'wolf': {
      // Lightning tail - jagged
      ctx.beginPath();
      ctx.moveTo(-50 * s, 5 * s + sway);
      ctx.lineTo(-60 * s, -8 * s + sway * 0.5);
      ctx.lineTo(-55 * s, -15 * s + sway * 0.4);
      ctx.lineTo(-75 * s, -20 * s + sway * 0.3);
      ctx.strokeStyle = `rgba(255, 215, 0, 0.5)`;
      ctx.lineWidth = 14 * s;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      // Lightning bolts
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-60 * s, -5 * s + sway * 0.5);
      ctx.lineTo(-65 * s, -10 * s + sway * 0.4);
      ctx.lineTo(-60 * s, -12 * s + sway * 0.4);
      ctx.lineTo(-70 * s, -18 * s + sway * 0.3);
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }
    case 'rabbit': {
      // Flower petals tail - fluffy round
      ctx.beginPath();
      ctx.arc(-58 * s, -5 * s + sway * 0.5, 16 * s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 121, 168, 0.4)`;
      ctx.fill();
      // Floating petals
      for (let i = 0; i < 5; i++) {
        const px = -55 * s + Math.sin(t * 0.015 + i * 1.5) * 20 * s;
        const py = -15 * s + sway * 0.3 + Math.cos(t * 0.02 + i * 2) * 15 * s;
        ctx.beginPath();
        ctx.ellipse(px, py, 4 * s, 2 * s, t * 0.01 + i, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 121, 168, ${0.2 + Math.sin(t * 0.04 + i) * 0.1})`;
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}
