import { useEffect, useState } from 'react';
import type { CreatureAppearance } from '../types';

interface EggProps {
  appearance: CreatureAppearance;
  onHatch: () => void;
}

export default function Egg({ appearance, onHatch }: EggProps) {
  const [phase, setPhase] = useState<'idle' | 'glowing' | 'cracking' | 'hatching' | 'born'>('idle');
  const [cracks, setCracks] = useState(0);
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    // Start glowing after 1 second
    const glowTimer = setTimeout(() => setPhase('glowing'), 1000);
    return () => clearTimeout(glowTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'glowing') return;
    
    // Start cracking after 2 seconds of glow
    const crackTimer = setTimeout(() => setPhase('cracking'), 2000);
    return () => clearTimeout(crackTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'cracking') return;
    
    // Progressive cracks
    const crackInterval = setInterval(() => {
      setCracks(prev => {
        if (prev >= 5) {
          clearInterval(crackInterval);
          setPhase('hatching');
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    
    return () => clearInterval(crackInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'hatching') return;
    
    const hatchTimer = setTimeout(() => {
      setPhase('born');
      setShowName(true);
      // Trigger haptic feedback
      try {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notification('success');
      } catch {}
    }, 1500);
    
    const callbackTimer = setTimeout(() => {
      onHatch();
    }, 3500);
    
    return () => {
      clearTimeout(hatchTimer);
      clearTimeout(callbackTimer);
    };
  }, [phase, onHatch]);

  const eggGlow = phase === 'glowing' || phase === 'cracking' || phase === 'hatching';
  const eggShake = phase === 'cracking' || phase === 'hatching';

  return (
    <div style={styles.container}>
      {/* Background particles */}
      <div style={styles.particles}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: eggGlow ? 0.6 : 0,
              background: i % 2 === 0 ? appearance.accentColor : appearance.eyeColor,
            }}
          />
        ))}
      </div>

      {/* Egg */}
      <div
        style={{
          ...styles.egg,
          background: `radial-gradient(ellipse at 40% 35%, ${appearance.baseColor}88, ${appearance.baseColor})`,
          boxShadow: eggGlow
            ? `0 0 40px ${appearance.accentColor}88, 0 0 80px ${appearance.accentColor}44`
            : '0 0 10px rgba(0,0,0,0.2)',
          animation: eggShake ? 'shake 0.3s ease-in-out infinite' : 'none',
          transform: phase === 'hatching' ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
        }}
      >
        {/* Egg pattern */}
        <div style={styles.eggPattern}>
          {[...Array(cracks)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.crack,
                top: `${20 + i * 15}%`,
                left: `${30 + i * 8}%`,
                transform: `rotate(${i * 25}deg)`,
                width: `${30 + i * 10}px`,
              }}
            />
          ))}
        </div>
        
        {/* Glow ring */}
        {eggGlow && (
          <div
            style={{
              ...styles.glowRing,
              borderColor: appearance.accentColor,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Born creature display */}
      {phase === 'born' && (
        <div style={styles.bornContainer}>
          <div
            style={{
              ...styles.creatureMini,
              background: `radial-gradient(circle, ${appearance.baseColor}, ${appearance.accentColor}88)`,
              boxShadow: `0 0 30px ${appearance.eyeColor}66`,
            }}
          >
            <div style={{ ...styles.eye, ...styles.eyeLeft, background: appearance.eyeColor }} />
            <div style={{ ...styles.eye, ...styles.eyeRight, background: appearance.eyeColor }} />
          </div>
          {showName && (
            <div style={{...styles.nameReveal, color: appearance.eyeColor || '#FFD700'}}>✨ A new bond is forged ✨</div>
          )}
        </div>
      )}

      {/* Phase text */}
      <div style={styles.statusText}>
        {phase === 'idle' && 'An egg appears...'}
        {phase === 'glowing' && 'It begins to glow...'}
        {phase === 'cracking' && 'Cracks form...'}
        {phase === 'hatching' && 'Something is emerging...'}
        {phase === 'born' && ''}
      </div>
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
    padding: '20px',
    overflow: 'hidden',
  },
  particles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    animation: 'float 3s ease-in-out infinite',
    transition: 'opacity 0.5s',
  },
  egg: {
    position: 'relative',
    width: '160px',
    height: '200px',
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.5s',
    zIndex: 2,
  },
  eggPattern: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    overflow: 'hidden',
  },
  crack: {
    position: 'absolute',
    height: '2px',
    background: '#FFD700',
    borderRadius: '1px',
    opacity: 0.8,
  },
  glowRing: {
    position: 'absolute',
    top: '-15px',
    left: '-15px',
    right: '-15px',
    bottom: '-15px',
    border: '2px solid',
    borderRadius: '50%',
    opacity: 0.5,
  },
  bornContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    animation: 'fadeIn 0.8s ease-out',
    zIndex: 3,
  },
  creatureMini: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    animation: 'float 2s ease-in-out infinite',
  },
  eye: {
    width: '10px',
    height: '12px',
    borderRadius: '50%',
    position: 'absolute',
    top: '35px',
  },
  eyeLeft: {
    left: '26px',
  },
  eyeRight: {
    right: '26px',
  },
  nameReveal: {
    color: '#FFD700', // overridden inline
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    animation: 'fadeInUp 1s ease-out',
    textShadow: '0 0 20px rgba(255,215,0,0.3)',
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  statusText: {
    marginTop: '30px',
    color: '#aaa',
    fontSize: '14px',
    fontFamily: 'serif',
    fontStyle: 'italic',
    minHeight: '20px',
  },
};
