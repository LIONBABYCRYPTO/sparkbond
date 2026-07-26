import { useState, useCallback, useEffect } from 'react';
import './App.css';
import Awakening from './stages/Awakening';
import Bond from './stages/Bond';
import type { CreatureData, GamePhase } from './types';
import { getCreatureMood } from './utils/creatureGen';

// Try to load saved creature from localStorage
function loadCreature(): CreatureData | null {
  try {
    const saved = localStorage.getItem('sparkbond_creature');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function App() {
  const [phase, setPhase] = useState<GamePhase>(() => {
    const saved = loadCreature();
    return saved ? 'bond' : 'egg';
  });
  const [creature, setCreature] = useState<CreatureData | null>(loadCreature);

  // Initialize Telegram WebApp
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }
    } catch {}
  }, []);

  const handleAwakeningComplete = useCallback((newCreature: CreatureData) => {
    setCreature(newCreature);
    setPhase('bond');
    localStorage.setItem('sparkbond_creature', JSON.stringify(newCreature));
  }, []);

  const handleCreatureUpdate = useCallback((updated: CreatureData) => {
    setCreature(updated);
    localStorage.setItem('sparkbond_creature', JSON.stringify(updated));
  }, []);

  // Check daily session — refresh mood
  useEffect(() => {
    if (!creature) return;
    const refreshedMood = getCreatureMood({
      lastFed: creature.lastFed,
      lastPetted: creature.lastPetted,
      stats: { affection: creature.stats.affection }
    });
    if (refreshedMood !== creature.mood) {
      handleCreatureUpdate({ ...creature, mood: refreshedMood });
    }
  }, []);

  return (
    <div style={styles.app}>
      {phase === 'egg' && (
        <Awakening onComplete={handleAwakeningComplete} />
      )}
      {phase === 'bond' && creature && (
        <Bond creature={creature} onUpdate={handleCreatureUpdate} />
      )}
      {/* Bottom nav placeholder */}
      {phase === 'bond' && (
        <div style={styles.bottomNav}>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🏠</span>
            <span style={styles.navLabel}>Bond</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>⚔️</span>
            <span style={styles.navLabel}>Duels</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🏪</span>
            <span style={styles.navLabel}>Shop</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🏆</span>
            <span style={styles.navLabel}>Leaderboard</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#0a0a2e',
    color: '#fff',
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    position: 'relative' as const,
  },
  bottomNav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    background: 'rgba(10, 10, 46, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    zIndex: 100,
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    padding: '4px 12px',
    opacity: 0.6,
  },
  navIcon: {
    fontSize: '20px',
  },
  navLabel: {
    fontSize: '10px',
    color: '#aaa',
  },
};
