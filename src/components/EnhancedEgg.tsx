import { useEffect, useState, useRef } from 'react';
import type { CreatureAppearance } from '../types';

interface EnhancedEggProps {
  appearance: CreatureAppearance;
  creatureName: string;
  onHatch: () => void;
}

export default function EnhancedEgg({ appearance, creatureName, onHatch }: EnhancedEggProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<
    'appear' | 'glow' | 'shake' | 'symbols' | 'crack' | 'heartbeat' | 'flash' | 'reveal'
  >('appear');
  const [confetti, setConfetti] = useState<{ x: number; color: string; delay: number }[]>([]);

  // Phase progression
  useEffect(() => {
    const sequence = [
      { p: 'glow' as const, t: 1500 },
      { p: 'shake' as const, t: 2000 },
      { p: 'symbols' as const, t: 2500 },
      { p: 'crack' as const, t: 2000 },
      { p: 'heartbeat' as const, t: 2000 },
      { p: 'flash' as const, t: 800 },
      { p: 'reveal' as const, t: 3000 },
    ];

    let totalDelay = 0;
    const timers: number[] = [];

    sequence.forEach(({ p, t }) => {
      totalDelay += t;
      const timer = window.setTimeout(() => {
        setPhase(p);
        if (p === 'reveal') {
          const c = [];
          for (let i = 0; i < 30; i++) {
            c.push({
              x: Math.random() * 100,
              color: [appearance.accentColor, appearance.eyeColor, '#FFD700', '#FF6B9D'][Math.floor(Math.random() * 4)],
              delay: Math.random() * 0.8,
            });
          }
          setConfetti(c);
          setTimeout(onHatch, 3000);
        }
      }, totalDelay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Canvas particles (orbiting symbols, sparkles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId: number;
    let time = 0;

    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 20;
      const showOrbits = phase === 'symbols' || phase === 'crack' || phase === 'heartbeat';

      if (showOrbits) {
        const symbols = ['✦', '✧', '❋', '✶', '☆', '◇'];
        const count = 6;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + time * 0.005;
          const radius = 60 + Math.sin(time * 0.01 + i) * 10;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(time * 0.01 + i);
          ctx.font = '16px serif';
          ctx.fillStyle = appearance.eyeColor;
          ctx.globalAlpha = 0.4 + Math.sin(time * 0.05 + i) * 0.3;
          ctx.shadowColor = appearance.eyeColor;
          ctx.shadowBlur = 10;
          ctx.fillText(symbols[i], -8, 6);
          ctx.restore();
        }

        // Sparkle trail
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + time * 0.008;
          const radius = 80 + Math.sin(time * 0.02 + i * 2) * 15;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          const size = 2 + Math.sin(time * 0.03 + i) * 1;

          ctx.save();
          ctx.translate(x, y);
          ctx.fillStyle = '#FFD700';
          ctx.globalAlpha = 0.3 + Math.sin(time * 0.04 + i) * 0.2;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            const a = (j * Math.PI) / 2;
            const r = size;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a + 0.3) * Math.max(1, r * 0.3), Math.sin(a + 0.3) * Math.max(1, r * 0.3));
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Floating particles
      if (phase !== 'appear') {
        for (let i = 0; i < 5; i++) {
          const x = cx + Math.sin(time * 0.01 + i * 2) * 40;
          const y = cy + 80 - (time * 0.3 + i * 20) % 120;
          ctx.save();
          ctx.globalAlpha = 0.6 - i * 0.1;
          ctx.fillStyle = appearance.accentColor;
          ctx.shadowColor = appearance.accentColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, 3 - i * 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [phase, appearance]);

  // Haptic feedback on heartbeat
  useEffect(() => {
    if (phase === 'heartbeat') {
      try {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notification('warning');
        setTimeout(() => {
          (window as any).Telegram?.WebApp?.HapticFeedback?.notification('success');
        }, 1000);
      } catch {}
    }
  }, [phase]);

  const eggAnim = phase === 'heartbeat' ? 'heartbeat 0.6s ease-in-out' :
    phase === 'shake' ? 'shake 0.15s ease-in-out infinite' :
    phase === 'crack' ? 'shake 0.1s ease-in-out infinite' : 'none';

  const eggBrightness = phase === 'glow' ? 1.2 :
    phase === 'shake' ? 1.5 :
    phase === 'symbols' ? 1.8 :
    phase === 'crack' || phase === 'heartbeat' ? 2.2 : 1.0;

  return (
    <div style={styles.container}>
      {/* Screen dim for climax */}
      {phase === 'heartbeat' && (
        <div style={{
          ...styles.dimOverlay,
          animation: 'fadeIn 1s ease-out both',
        }} />
      )}

      {/* White flash */}
      {phase === 'flash' && <div style={styles.flashOverlay} />}

      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          ...styles.confetti,
          left: `${c.x}%`,
          background: c.color,
          animationDelay: `${c.delay}s`,
        }} />
      ))}

      {/* Phase text */}
      <div style={styles.title}>
        {phase === 'appear' && 'A mysterious presence...'}
        {phase === 'glow' && 'It begins to glow...'}
        {phase === 'shake' && 'Something is stirring...'}
        {phase === 'symbols' && 'Ancient magic awakens...'}
        {phase === 'crack' && 'The shell is breaking...'}
        {phase === 'heartbeat' && ''}
        {phase === 'flash' && ''}
        {phase === 'reveal' && ''}
      </div>

      {/* Egg */}
      <div style={{
        ...styles.eggWrapper,
        animation: phase === 'reveal' ? 'fadeOut 0.5s ease-out 0.3s both' : 'none',
      }}>
        <div style={{
          ...styles.egg,
          background: `radial-gradient(ellipse at 40% 35%, ${appearance.baseColor}aa, ${appearance.baseColor})`,
          boxShadow: `0 0 ${40 * eggBrightness}px ${appearance.accentColor}88, 0 0 ${80 * Math.max(0, eggBrightness - 0.5)}px ${appearance.eyeColor}44`,
          animation: eggAnim,
          filter: `brightness(${eggBrightness})`,
        }}>
          {/* Cracks */}
          {(phase === 'crack' || phase === 'heartbeat') && (
            <>
              <div style={{...styles.crack, top: '30%', left: '25%', transform: 'rotate(-30deg)', width: '40px'}} />
              <div style={{...styles.crack, top: '50%', left: '60%', transform: 'rotate(20deg)', width: '35px'}} />
              <div style={{...styles.crack, top: '65%', left: '35%', transform: 'rotate(-10deg)', width: '30px'}} />
              <div style={{...styles.crack, top: '40%', left: '50%', transform: 'rotate(45deg)', width: '25px'}} />
            </>
          )}

          {(phase === 'crack' || phase === 'heartbeat') && (
            <div style={{
              ...styles.crackGlow,
              background: `radial-gradient(circle, ${appearance.eyeColor}88, transparent)`,
              animation: 'pulse 0.5s ease-in-out infinite',
            }} />
          )}
        </div>

        <div style={{
          ...styles.glowRing,
          borderColor: appearance.accentColor,
          animation: phase !== 'appear' ? 'pulse 0.8s ease-in-out infinite' : 'none',
          opacity: phase !== 'appear' ? 0.6 : 0,
          transform: `scale(${1 + (phase === 'symbols' ? 0.3 : phase === 'crack' ? 0.5 : 0)})`,
        }} />
      </div>

      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Revealed creature */}
      {phase === 'reveal' && (
        <div style={styles.revealContainer}>
          <div style={{
            ...styles.revealedCreature,
            background: `radial-gradient(circle, ${appearance.baseColor}, ${appearance.accentColor}88)`,
            boxShadow: `0 0 40px ${appearance.eyeColor}66`,
          }}>
            <div style={{...styles.eye, ...styles.eyeLeft, background: appearance.eyeColor}} />
            <div style={{...styles.eye, ...styles.eyeRight, background: appearance.eyeColor}} />
            {appearance.hornType !== 'none' && (
              <>
                <div style={{...styles.horn, ...styles.hornLeft, background: appearance.accentColor}} />
                <div style={{...styles.horn, ...styles.hornRight, background: appearance.accentColor}} />
              </>
            )}
          </div>
          <div style={{...styles.nameText, color: appearance.eyeColor}}>
            ✨ {creatureName} ✨
          </div>
          <div style={styles.bondText}>
            A bond beyond words
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    overflow: 'hidden',
  },
  title: {
    fontSize: '15px',
    color: '#aaa',
    fontStyle: 'italic',
    fontFamily: 'serif',
    marginBottom: '30px',
    minHeight: '24px',
    animation: 'fadeInUp 0.5s ease-out',
    zIndex: 5,
  },
  eggWrapper: {
    position: 'relative',
    zIndex: 4,
  },
  egg: {
    position: 'relative',
    width: '140px',
    height: '180px',
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    transition: 'box-shadow 0.3s, filter 0.3s',
    zIndex: 2,
  },
  crack: {
    position: 'absolute',
    height: '2px',
    background: '#FFD700',
    borderRadius: '1px',
    animation: 'glowPulse 0.5s ease-in-out infinite',
  },
  crackGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    zIndex: 1,
  },
  glowRing: {
    position: 'absolute',
    top: '-20px',
    left: '-20px',
    right: '-20px',
    bottom: '-20px',
    border: '2px solid',
    borderRadius: '50%',
    transition: 'opacity 0.5s, transform 0.5s',
    zIndex: 0,
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  dimOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 6,
  },
  flashOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'white',
    zIndex: 7,
    animation: 'flash 0.8s ease-out both',
  },
  confetti: {
    position: 'fixed',
    top: '-10px',
    width: '6px',
    height: '10px',
    borderRadius: '2px',
    zIndex: 8,
    animation: 'confetti-fall 2s ease-out both',
  },
  revealContainer: {
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginTop: '20px',
  },
  revealedCreature: {
    width: '90px',
    height: '90px',
    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
    position: 'relative',
    animation: 'float 2s ease-in-out infinite, fadeInUp 0.8s ease-out',
  },
  eye: {
    width: '10px',
    height: '12px',
    borderRadius: '50%',
    position: 'absolute',
    top: '35px',
  },
  eyeLeft: { left: '28px' },
  eyeRight: { right: '28px' },
  horn: {
    position: 'absolute',
    width: '7px',
    height: '18px',
    borderRadius: '4px 4px 0 0',
    top: '-10px',
  },
  hornLeft: { left: '30px', transform: 'rotate(-15deg)' },
  hornRight: { right: '30px', transform: 'rotate(15deg)' },
  nameText: {
    fontSize: '22px',
    fontWeight: '700',
    textShadow: '0 0 30px rgba(255,215,0,0.4)',
    textAlign: 'center',
    animation: 'fadeInUp 0.8s ease-out 0.5s both',
  },
  bondText: {
    fontSize: '14px',
    color: '#aaa',
    fontStyle: 'italic',
    fontFamily: 'serif',
    animation: 'fadeInUp 0.8s ease-out 1s both',
  },
};
