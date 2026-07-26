import { useEffect, useState, useRef } from 'react';
import type { CreatureAppearance } from '../types';

interface FeedingAnimationProps {
  appearance: CreatureAppearance;
  creatureName: string;
  onComplete: () => void;
}

const FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍑', '🥝', '🍒', '🍋'];

export default function FeedingAnimation({ appearance, creatureName, onComplete }: FeedingAnimationProps) {
  const [phase, setPhase] = useState<'select' | 'floating' | 'catch' | 'burst' | 'bellyrub'>('select');
  const [selectedFruit, setSelectedFruit] = useState('');
  const [fruitPos, setFruitPos] = useState({ x: 50, y: 30 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  // Canvas sparkle trail
  useEffect(() => {
    if (phase !== 'floating' && phase !== 'catch') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles: { x: number; y: number; life: number }[] = [];
    let animId: number;

    const animate = () => {
      timeRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add sparkle trail
      if (phase === 'floating') {
        particles.push({ x: fruitPos.x, y: fruitPos.y, life: 30 });
      }
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        p.life--;
        p.y += 0.5;
        ctx.save();
        ctx.fillStyle = appearance.eyeColor;
        ctx.globalAlpha = p.life / 30 * 0.6;
        ctx.shadowColor = appearance.eyeColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + (30 - p.life) * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [phase, fruitPos, appearance.eyeColor]);

  // Auto animate
  useEffect(() => {
    if (phase !== 'select') return;
    if (selectedFruit) {
      const timer = setTimeout(() => setPhase('floating'), 300);
      return () => clearTimeout(timer);
    }
  }, [phase, selectedFruit]);

  useEffect(() => {
    if (phase !== 'floating') return;
    // Animate fruit flying to creature center
    const startX = 50;
    const startY = 30;
    const endX = 50;
    const endY = 55;
    let progress = 0;
    
    const flyInterval = setInterval(() => {
      progress += 0.03;
      const t = easeOutCubic(progress);
      setFruitPos({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t + Math.sin(progress * 8) * 5,
      });
      if (progress >= 1) {
        clearInterval(flyInterval);
        setPhase('catch');
      }
    }, 16);
    return () => clearInterval(flyInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'catch') return;
    const timer = setTimeout(() => setPhase('burst'), 600);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'burst') return;
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.notification('success');
    } catch {}
    const timer = setTimeout(() => setPhase('bellyrub'), 1200);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'bellyrub') return;
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  return (
    <div style={styles.overlay}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Select fruit phase */}
      {phase === 'select' && !selectedFruit && (
        <div style={styles.selectContainer}>
          <div style={styles.selectTitle}>What would you like to feed {creatureName}?</div>
          <div style={styles.fruitGrid}>
            {FRUITS.map(fruit => (
              <button
                key={fruit}
                style={styles.fruitBtn}
                onClick={() => setSelectedFruit(fruit)}
              >
                {fruit}
              </button>
            ))}
          </div>
          <button style={styles.cancelBtn} onClick={onComplete}>Cancel</button>
        </div>
      )}

      {/* Fruit selected - show it */}
      {selectedFruit && (phase === 'select' || phase === 'floating') && (
        <div style={{
          ...styles.floatingFruit,
          left: `${fruitPos.x}%`,
          top: `${fruitPos.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: phase === 'floating' ? '48px' : '40px',
          filter: phase === 'floating' ? `drop-shadow(0 0 20px ${appearance.eyeColor})` : 'none',
        }}>
          {selectedFruit}
        </div>
      )}

      {/* Catch phase */}
      {phase === 'catch' && (
        <div style={styles.catchContainer}>
          <div style={{
            ...styles.creatureJump,
            background: `radial-gradient(circle, ${appearance.baseColor}, ${appearance.accentColor}88)`,
            boxShadow: `0 0 40px ${appearance.eyeColor}66`,
          }}>
            <div style={styles.jumpEye}>😍</div>
          </div>
          <div style={styles.catchText}>Mmm! Delicious! 🍽️</div>
        </div>
      )}

      {/* Burst phase */}
      {phase === 'burst' && (
        <div style={styles.burstContainer}>
          {['✨', '⭐', '🌟', '💫', '❤️', '✨', '⭐', '🌟'].map((s, i) => (
            <div key={i} style={{
              ...styles.burstStar,
              left: `${30 + Math.random() * 40}%`,
              top: `${30 + Math.random() * 30}%`,
              fontSize: `${16 + Math.random() * 20}px`,
              animationDelay: `${i * 0.08}s`,
            }}>{s}</div>
          ))}
          <div style={styles.burstGlow} />
        </div>
      )}

      {/* Belly rub phase */}
      {phase === 'bellyrub' && (
        <div style={styles.bellyContainer}>
          <div style={{
            ...styles.bellyCreature,
            background: `radial-gradient(circle, ${appearance.baseColor}, ${appearance.accentColor}88)`,
          }}>
            <div style={styles.bellyEyes}>😊</div>
            <div style={styles.bellySparkles}>✨</div>
          </div>
          <div style={styles.bellyText}>{creatureName} rubs their belly happily!</div>
          <div style={{
            ...styles.auraGlow,
            background: `radial-gradient(circle, ${appearance.eyeColor}33, transparent)`,
          }} />
        </div>
      )}

      {/* Phase text */}
      {selectedFruit && phase !== 'bellyrub' && phase !== 'burst' && phase !== 'catch' && (
        <div style={styles.instruction}>
          {phase === 'floating' && `${creatureName}'s eyes widen...`}
        </div>
      )}
    </div>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.3s ease-out',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
  },
  selectContainer: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    animation: 'fadeInUp 0.4s ease-out',
  },
  selectTitle: {
    fontSize: '16px',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  fruitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  fruitBtn: {
    width: '60px',
    height: '60px',
    fontSize: '28px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: '8px 24px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer',
  },
  floatingFruit: {
    position: 'absolute',
    zIndex: 3,
    transition: 'left 0.016s linear, top 0.016s linear, filter 0.3s',
    animation: 'float 1s ease-in-out infinite',
  },
  instruction: {
    position: 'absolute',
    bottom: '15%',
    zIndex: 3,
    color: '#aaa',
    fontSize: '13px',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  catchContainer: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    animation: 'bounce 0.3s ease-out',
  },
  creatureJump: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'bounce 0.5s ease-out',
  },
  jumpEye: {
    fontSize: '32px',
    animation: 'pulse 0.5s ease-in-out infinite',
  },
  catchText: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '600',
  },
  burstContainer: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstStar: {
    position: 'absolute',
    animation: 'confetti-fall 1s ease-out both',
  },
  burstGlow: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent)',
    animation: 'pulse 0.5s ease-in-out 3',
  },
  bellyContainer: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  bellyCreature: {
    width: '90px',
    height: '90px',
    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    animation: 'breath 1.5s ease-in-out infinite',
  },
  bellyEyes: {
    fontSize: '24px',
  },
  bellySparkles: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    fontSize: '16px',
    animation: 'float 1s ease-in-out infinite',
  },
  bellyText: {
    color: '#aaa',
    fontSize: '14px',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  auraGlow: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
    zIndex: -1,
  },
};
