import { useEffect, useRef, useState } from 'react';
import type { CreatureData } from '../types';

interface SanctuaryProps {
  creature: CreatureData;
  children?: React.ReactNode;
  phase?: 'day' | 'night';
}

export default function Sanctuary({ creature, children, phase = 'day' }: SanctuaryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setTime] = useState(0);

  // Ambient particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; life: number; maxLife: number;
      type: 'sparkle' | 'petal' | 'firefly' | 'leaf';
      rotation: number; rotationSpeed: number;
    }[] = [];

    const MAX_PARTICLES = 30;
    let animationId: number;

    const spawnParticle = () => {
      if (particles.length >= MAX_PARTICLES) return;
      const types: ('sparkle' | 'petal' | 'firefly' | 'leaf')[] = 
        phase === 'night' ? ['firefly', 'sparkle'] : ['sparkle', 'petal', 'leaf'];
      
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.3 + 0.1),
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.4 + 0.2,
        life: 0,
        maxLife: Math.random() * 300 + 200,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (Math.random() < 0.05) spawnParticle();

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.001; // slight gravity
        p.rotation += p.rotationSpeed;
        p.life++;
        p.alpha = Math.max(0, p.alpha - 0.001);

        if (p.life > p.maxLife || p.y < -20 || p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha * Math.sin(p.life / p.maxLife * Math.PI);

        switch (p.type) {
          case 'sparkle':
            ctx.fillStyle = creature.appearance.eyeColor;
            ctx.shadowColor = creature.appearance.eyeColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            // 4-point star
            for (let j = 0; j < 4; j++) {
              const angle = (j * Math.PI) / 2;
              const r = p.size;
              ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
              ctx.lineTo(Math.cos(angle + 0.3) * r * 0.3, Math.sin(angle + 0.3) * r * 0.3);
            }
            ctx.closePath();
            ctx.fill();
            break;

          case 'firefly':
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'petal':
            ctx.fillStyle = creature.appearance.accentColor + '66';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'leaf':
            ctx.fillStyle = '#55EFC4' + '44';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 2, p.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      }

      setTime(prev => prev + 1);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [creature.appearance.eyeColor, creature.appearance.accentColor, phase]);

  // Sky gradient based on phase
  const skyGradient = phase === 'night'
    ? 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #2a1a3e 70%, #1a0a2e 100%)'
    : 'linear-gradient(180deg, #1a1a4e 0%, #2a1a5e 25%, #3a2a6e 50%, #4a3a7e 75%, #5a4a8e 100%)';

  return (
    <div style={{
      ...styles.sanctuary,
      background: skyGradient,
    }}>
      {/* Stars/magic dots */}
      <div style={styles.stars}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            ...styles.star,
            left: `${(i * 7 + 3) % 100}%`,
            top: `${(i * 13 + 5) % 60}%`,
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            animationDelay: `${i * 0.7}s`,
            background: phase === 'night' ? '#fff' : creature.appearance.eyeColor,
          }} />
        ))}
      </div>

      {/* Clouds */}
      <div style={styles.clouds}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            ...styles.cloud,
            top: `${8 + i * 15}%`,
            animationDuration: `${20 + i * 10}s`,
            animationDelay: `${i * 5}s`,
            opacity: 0.3 - i * 0.05,
          }}>
            <div style={styles.cloudBump} />
            <div style={{...styles.cloudBump, left: '20px', top: '-8px', width: '30px', height: '16px'}} />
            <div style={{...styles.cloudBump, left: '40px', top: '-5px', width: '24px', height: '12px'}} />
          </div>
        ))}
      </div>

      {/* Ground */}
      <div style={styles.ground}>
        <div style={{
          ...styles.grassLine,
          background: `linear-gradient(90deg, transparent, ${creature.appearance.baseColor}33, transparent)`,
        }} />
      </div>

      {/* Floating orbs */}
      <div style={styles.orbs}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            ...styles.orb,
            left: `${25 + i * 25}%`,
            bottom: `${30 + i * 10}%`,
            background: creature.appearance.eyeColor + '22',
            animationDelay: `${i * 2}s`,
            animationDuration: `${4 + i}s`,
          }} />
        ))}
      </div>

      {/* Canvas particles */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Children (creature + UI) */}
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sanctuary: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    transition: 'background 2s ease',
  },
  stars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
    opacity: 0.4,
  },
  clouds: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  cloud: {
    position: 'absolute',
    width: '80px',
    height: '20px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '20px',
    animation: 'drift 30s linear infinite',
  },
  cloudBump: {
    position: 'absolute',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '50%',
    width: '20px',
    height: '12px',
    top: '-6px',
    left: '10px',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,46,0.4) 100%)',
    zIndex: 1,
  },
  grassLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    opacity: 0.3,
  },
  orbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  orb: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    animation: 'float 5s ease-in-out infinite',
    filter: 'blur(20px)',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
};
