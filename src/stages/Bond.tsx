import { useState, useEffect, useCallback } from 'react';
import Sanctuary from '../components/Sanctuary';
import CreatureCanvas from '../components/CreatureCanvas';
import FeedingAnimation from '../components/FeedingAnimation';
import type { CreatureData, CreatureStats, CreatureMood } from '../types';
import { getCreatureMood } from '../utils/creatureGen';

interface BondProps {
  creature: CreatureData;
  onUpdate: (creature: CreatureData) => void;
}

interface ActionTimer {
  id: string;
  label: string;
  icon: string;
  duration: number; // in minutes
  startedAt: number | null;
  statBonus: Partial<CreatureStats>;
  description: string;
}

const ACTIONS: ActionTimer[] = [
  { id: 'feed', label: 'Feed', icon: '🍎', duration: 120, startedAt: null, statBonus: { affection: 3, might: 2 }, description: 'Nourish your companion' },
  { id: 'teach', label: 'Teach', icon: '📖', duration: 240, startedAt: null, statBonus: { wisdom: 4 }, description: 'Share ancient knowledge' },
  { id: 'train', label: 'Train', icon: '🏋️', duration: 360, startedAt: null, statBonus: { might: 3, speed: 2 }, description: 'Build their strength' },
  { id: 'meditate', label: 'Meditate', icon: '🧘', duration: 180, startedAt: null, statBonus: { spirit: 4 }, description: 'Find inner peace' },
  { id: 'play', label: 'Play', icon: '🎮', duration: 60, startedAt: null, statBonus: { affection: 2, speed: 2 }, description: 'Have some fun' },
  { id: 'explore', label: 'Explore', icon: '🌌', duration: 480, startedAt: null, statBonus: { wisdom: 3, spirit: 2 }, description: 'Discover new realms' },
];

export default function Bond({ creature, onUpdate }: BondProps) {
  const [timers, setTimers] = useState<ActionTimer[]>(() =>
    ACTIONS.map(a => ({ ...a, startedAt: null }))
  );
  const [now, setNow] = useState(Date.now());
  const [feeding, setFeeding] = useState(false);

  // Tick every second for timer displays
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for completed timers
  useEffect(() => {
    const updatedTimers = timers.map(timer => {
      if (!timer.startedAt) return timer;
      const elapsed = (now - timer.startedAt) / (1000 * 60);
      if (elapsed >= timer.duration) {
        // Timer complete! Apply stat bonus
        const newStats = { ...creature.stats };
        Object.entries(timer.statBonus).forEach(([key, val]) => {
          if (val && key in newStats) {
            (newStats as any)[key] = Math.min(100, (newStats as any)[key] + val);
          }
        });

        const updatedCreature = {
          ...creature,
          stats: newStats,
          lastFed: timer.id === 'feed' ? now : creature.lastFed,
          lastPetted: (timer.id === 'play' || timer.id === 'meditate') ? now : creature.lastPetted,
          totalActions: creature.totalActions + 1,
          mood: getCreatureMood({ ...creature, stats: newStats, lastFed: timer.id === 'feed' ? now : creature.lastFed, lastPetted: (timer.id === 'play' || timer.id === 'meditate') ? now : creature.lastPetted }) as CreatureMood,
        };
        onUpdate(updatedCreature);

        try {
          (window as any).Telegram?.WebApp?.HapticFeedback?.notification('success');
        } catch {}

        return { ...timer, startedAt: null };
      }
      return timer;
    });

    if (updatedTimers.some((t, i) => t !== timers[i])) {
      setTimers(updatedTimers);
    }
  }, [now]);

  const startAction = useCallback((actionId: string) => {
    setTimers(prev => prev.map(t =>
      t.id === actionId && !t.startedAt
        ? { ...t, startedAt: now }
        : t
    ));
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    } catch {}
  }, [now]);

  const formatTimeRemaining = (timer: ActionTimer): string => {
    if (!timer.startedAt) return '';
    const elapsed = (now - timer.startedAt) / (1000 * 60);
    const remaining = Math.max(0, timer.duration - elapsed);
    const hours = Math.floor(remaining / 60);
    const mins = Math.floor(remaining % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getProgress = (timer: ActionTimer): number => {
    if (!timer.startedAt) return 0;
    const elapsed = (now - timer.startedAt) / (1000 * 60);
    return Math.min(1, elapsed / timer.duration);
  };

  const runningActions = timers.filter(t => t.startedAt);
  const availableActions = timers.filter(t => !t.startedAt);

  return (
    <Sanctuary creature={creature}>
      <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>The Bond</div>
        <div style={styles.subtitle}>
          Days since bonding: {Math.floor((now - creature.hatchedAt) / (1000 * 60 * 60 * 24))}
        </div>
      </div>

      {/* Living creature */}
      <CreatureCanvas creature={creature} size={220} onPet={() => {
        const now = Date.now();
        const c = {...creature};
        c.lastPetted = now;
        c.bondLevel = Math.min(100, c.bondLevel + 1);
        onUpdate(c);
      }} />

      {/* Bond Meter */}
      <div style={styles.bondMeter}>
        <div style={styles.bondLabel}>
          ❤️ Bond {creature.bondLevel}%
        </div>
        <div style={styles.bondBarBg}>
          <div style={{
            ...styles.bondBarFill,
            width: `${creature.bondLevel}%`,
            background: creature.bondLevel > 80 
              ? 'linear-gradient(90deg, #FF69B4, #FFD700, #FF69B4)'
              : creature.bondLevel > 50
                ? 'linear-gradient(90deg, #6C5CE7, #FFD700)'
                : 'linear-gradient(90deg, #6C5CE7, #A29BFE)',
          }} />
        </div>
        {creature.bondLevel === 100 && (
          <div style={styles.maxBond}>✨ Ultimate Bond Achieved ✨</div>
        )}
      </div>

      {feeding && (
        <FeedingAnimation
          appearance={creature.appearance}
          creatureName={creature.name}
          onComplete={() => {
            setFeeding(false);
            const now = Date.now();
            const c = {...creature};
            c.lastFed = now;
            c.stats.affection = Math.min(100, c.stats.affection + 3);
            c.stats.might = Math.min(100, c.stats.might + 2);
            c.bondLevel = Math.min(100, c.bondLevel + 2);
            c.totalActions++;
            c.emotion = 'loved';
            c.mood = 'excited';
            onUpdate(c);
          }}
        />
      )}

      {/* Running timers */}
      {runningActions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>In Progress</div>
          {runningActions.map(timer => (
            <div key={timer.id} style={styles.timerCard}>
              <div style={styles.timerHeader}>
                <span style={styles.timerIcon}>{timer.icon}</span>
                <span style={styles.timerLabel}>{timer.label}</span>
                <span style={styles.timerTime}>{formatTimeRemaining(timer)}</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${getProgress(timer) * 100}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              <button
                style={styles.speedUpBtn}
                onClick={() => {
                  // Speed up with Stars/TON — placeholder for now
                  try {
                    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
                  } catch {}
                  alert('⚡ Speed up coming soon with Telegram Stars!');
                }}
              >
                ⚡ Speed Up
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available actions */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Actions</div>
        <div style={styles.actionsGrid}>
          {availableActions.map(timer => (
            <button
              key={timer.id}
              style={styles.actionCard}
              onClick={() => timer.id === 'feed' ? setFeeding(true) : startAction(timer.id)}
            >
              <div style={styles.actionIcon}>{timer.icon}</div>
              <div style={styles.actionLabel}>{timer.label}</div>
              <div style={styles.actionDuration}>
                {timer.duration >= 60
                  ? `${timer.duration / 60}h`
                  : `${timer.duration}m`}
              </div>
              <div style={styles.actionDesc}>{timer.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </Sanctuary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '16px',
    paddingBottom: '100px',
    position: 'relative',
    zIndex: 2,
  },
  header: {
    textAlign: 'center',
    padding: '16px 0',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
  },
  section: {
    marginTop: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
    paddingLeft: '4px',
  },
  timerCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  timerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  timerIcon: {
    fontSize: '20px',
  },
  timerLabel: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
  },
  timerTime: {
    fontSize: '14px',
    color: '#FFD700',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: '6px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6C5CE7, #FFD700)',
    borderRadius: '3px',
  },
  speedUpBtn: {
    width: '100%',
    padding: '6px',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '8px',
    background: 'rgba(255,215,0,0.08)',
    color: '#FFD700',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  bondMeter: {
    width: '100%',
    maxWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
  },
  bondLabel: {
    fontSize: '12px',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  bondBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  bondBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease-out',
  },
  maxBond: {
    fontSize: '11px',
    color: '#FF69B4',
    fontStyle: 'italic',
    marginTop: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.15s, background 0.15s',
  },
  actionIcon: {
    fontSize: '28px',
  },
  actionLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  actionDuration: {
    fontSize: '11px',
    color: '#888',
    fontFamily: 'monospace',
  },
  actionDesc: {
    fontSize: '10px',
    color: '#666',
    textAlign: 'center',
  },
};
