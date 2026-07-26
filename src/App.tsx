import { useState, useCallback, useEffect } from 'react';
import './App.css';
import Awakening from './stages/Awakening';
import Bond from './stages/Bond';
import type { CreatureData, GamePhase } from './types';
import { getCreatureMood } from './utils/creatureGen';

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
  const [ready, setReady] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
        // Set theme colors
        tg.setHeaderColor('#0a0a2e');
        tg.setBackgroundColor('#0a0a2e');
      }
    } catch (e) {
      console.log('Running outside Telegram');
    }
    setReady(true);
  }, []);

  const handleAwakeningComplete = useCallback((newCreature: CreatureData) => {
    setCreature(newCreature);
    setPhase('bond');
    localStorage.setItem('sparkbond_creature', JSON.stringify(newCreature));
    // Haptic feedback
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.notification('success');
    } catch {}
  }, []);

  const handleCreatureUpdate = useCallback((updated: CreatureData) => {
    setCreature(updated);
    localStorage.setItem('sparkbond_creature', JSON.stringify(updated));
  }, []);

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

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
      }}>
        ✨
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {phase === 'egg' && (
        <Awakening onComplete={handleAwakeningComplete} />
      )}
      {phase === 'bond' && creature && (
        <Bond creature={creature} onUpdate={handleCreatureUpdate} />
      )}
      {phase === 'bond' && (
        <div style={styles.bottomNav}>
          <div style={{...styles.navItem, opacity: 1}}>
            <span style={styles.navIcon}>🏠</span>
            <span style={styles.navLabel}>Bond</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>⚔️</span>
            <span style={styles.navLabel}>Coming Soon</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🏪</span>
            <span style={styles.navLabel}>Coming Soon</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>🏆</span>
            <span style={styles.navLabel}>Coming Soon</span>
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
    position: 'relative',
  },
  bottomNav: {
    position: 'fixed',
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
    opacity: 0.5,
  },
  navIcon: {
    fontSize: '20px',
  },
  navLabel: {
    fontSize: '10px',
    color: '#aaa',
  },
};
