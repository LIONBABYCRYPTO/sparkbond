import { useEffect, useState } from 'react';
import type { CreatureData } from '../types';
import { getMoodEmoji, getMoodMessage } from '../utils/creatureGen';

interface CreatureDisplayProps {
  creature: CreatureData;
  compact?: boolean;
}

export default function CreatureDisplay({ creature, compact = false }: CreatureDisplayProps) {
  const [bounce, setBounce] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setBounce(true);
    const timer = setTimeout(() => setBounce(false), 500);
    return () => clearTimeout(timer);
  }, [creature.mood]);

  const handlePet = () => {
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('soft');
    } catch {}
    setBounce(true);
    setTimeout(() => setBounce(false), 500);
    setMessage(`${creature.name} loves your attention! ❤️`);
    setTimeout(() => setMessage(''), 2000);
  };

  const stats = creature.stats;
  const totalStats = stats.affection + stats.might + stats.wisdom + stats.speed + stats.spirit + stats.spark;

  return (
    <div style={compact ? styles.compactContainer : styles.container}>
      {/* Creature body */}
      <div
        onClick={handlePet}
        style={{
          ...styles.creatureBody,
          background: `radial-gradient(circle at 40% 30%, ${creature.appearance.baseColor}, ${creature.appearance.accentColor}88)`,
          boxShadow: `0 8px 32px ${creature.appearance.baseColor}44`,
          animation: bounce ? 'bounce 0.3s ease-out' : 'float 3s ease-in-out infinite',
          transform: compact ? 'scale(0.7)' : 'scale(1)',
        }}
      >
        {/* Eyes */}
        <div style={{ ...styles.eye, ...styles.eyeLeft, background: creature.appearance.eyeColor, boxShadow: `0 0 8px ${creature.appearance.eyeColor}66` }} />
        <div style={{ ...styles.eye, ...styles.eyeRight, background: creature.appearance.eyeColor, boxShadow: `0 0 8px ${creature.appearance.eyeColor}66` }} />
        
        {/* Horns */}
        {creature.appearance.hornType !== 'none' && (
          <>
            <div style={{ ...styles.horn, ...styles.hornLeft, background: creature.appearance.accentColor }} />
            <div style={{ ...styles.horn, ...styles.hornRight, background: creature.appearance.accentColor }} />
          </>
        )}

        {/* Pattern markings */}
        {creature.appearance.pattern === 'spots' && (
          <div style={styles.patterns}>
            {[...Array(creature.appearance.markings)].map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.spot,
                  top: `${40 + (i * 12)}%`,
                  left: `${30 + (i * 15)}%`,
                  background: creature.appearance.accentColor + '44',
                  width: `${12 + i * 3}px`,
                  height: `${12 + i * 3}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mood emoji */}
        <div style={styles.moodEmoji}>
          {getMoodEmoji(creature.mood)}
        </div>
      </div>

      {!compact && (
        <>
          {/* Name and evolution */}
          <div style={styles.nameSection}>
            <h2 style={styles.name}>{creature.name}</h2>
            <span style={styles.evolution}>
              {'⭐'.repeat(creature.evolution + 1)}
            </span>
          </div>

          {/* Mood message */}
          <div style={styles.moodText}>
            {message || getMoodMessage(creature.mood, creature.name)}
          </div>

          {/* Stats bars */}
          <div style={styles.statsContainer}>
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} style={styles.statRow}>
                <div style={styles.statIcon}>
                  {key === 'affection' && '❤️'}
                  {key === 'might' && '💪'}
                  {key === 'wisdom' && '🧠'}
                  {key === 'speed' && '⚡'}
                  {key === 'spirit' && '✨'}
                  {key === 'spark' && '🔥'}
                </div>
                <div style={styles.statLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div style={styles.statBarBg}>
                  <div
                    style={{
                      ...styles.statBarFill,
                      width: `${Math.min(value, 100)}%`,
                      background: `linear-gradient(90deg, ${creature.appearance.baseColor}, ${creature.appearance.eyeColor})`,
                    }}
                  />
                </div>
                <div style={styles.statValue}>{value}/100</div>
              </div>
            ))}
          </div>

          {/* Total power */}
          <div style={styles.totalPower}>
            Total Power: <strong>{totalStats}</strong>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
  },
  compactContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px',
  },
  creatureBody: {
    width: '120px',
    height: '120px',
    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
    position: 'relative',
    cursor: 'pointer',
    transition: 'box-shadow 0.3s',
  },
  eye: {
    width: '12px',
    height: '14px',
    borderRadius: '50%',
    position: 'absolute',
    top: '40px',
  },
  eyeLeft: {
    left: '35px',
  },
  eyeRight: {
    right: '35px',
  },
  horn: {
    position: 'absolute',
    width: '8px',
    height: '20px',
    borderRadius: '4px 4px 0 0',
    top: '-12px',
  },
  hornLeft: {
    left: '35px',
    transform: 'rotate(-15deg)',
  },
  hornRight: {
    right: '35px',
    transform: 'rotate(15deg)',
  },
  patterns: {
    position: 'absolute',
    inset: 0,
  },
  spot: {
    position: 'absolute',
    borderRadius: '50%',
  },
  moodEmoji: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    fontSize: '20px',
    animation: 'float 2s ease-in-out infinite',
  },
  nameSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  name: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  evolution: {
    fontSize: '14px',
    letterSpacing: '2px',
  },
  moodText: {
    color: '#aaa',
    fontSize: '13px',
    fontStyle: 'italic',
    minHeight: '20px',
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statIcon: {
    width: '24px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  statLabel: {
    width: '60px',
    fontSize: '12px',
    color: '#bbb',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statBarBg: {
    flex: 1,
    height: '8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease-out',
  },
  statValue: {
    width: '40px',
    fontSize: '11px',
    color: '#888',
    textAlign: 'right' as const,
  },
  totalPower: {
    marginTop: '8px',
    padding: '8px 20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ccc',
    fontSize: '14px',
  },
};
