import { useState, useEffect } from 'react';
import Egg from '../components/Egg';
import CreatureDisplay from '../components/CreatureDisplay';
import { generateCreature, getTelegramUser } from '../utils/creatureGen';
import type { CreatureData, GamePhase } from '../types';

interface AwakeningProps {
  onComplete: (creature: CreatureData) => void;
}

export default function Awakening({ onComplete }: AwakeningProps) {
  const [phase, setPhase] = useState<GamePhase>('egg');
  const [creature, setCreature] = useState<CreatureData | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getTelegramUser();
    setUserName(user?.first_name || 'Strange One');
  }, []);

  const handleHatch = () => {
    const user = getTelegramUser();
    const userId = String(user?.id || Date.now());
    const { appearance, name } = generateCreature(userId);
    const now = Date.now();

    const newCreature: CreatureData = {
      id: userId,
      name,
      ownerName: user?.first_name || 'Strange One',
      hatchedAt: now,
      appearance,
      stats: {
        affection: 5,
        might: 2,
        wisdom: 1,
        speed: 2,
        spirit: 5,
        spark: 1,
      },
      evolution: 1,
      lastFed: now,
      lastPetted: now,
      mood: 'excited',
      totalActions: 0,
    };

    setCreature(newCreature);
    setPhase('awakened');

    // Auto-advance after showing creature
    setTimeout(() => {
      onComplete(newCreature);
    }, 5000);
  };

  if (phase === 'egg' || phase === 'hatching') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.subtitle}>A Mysterious Presence...</div>
        </div>
        <Egg 
          appearance={{
            baseColor: '#6C5CE7',
            accentColor: '#FFD700',
            eyeColor: '#00FF88',
            pattern: 'none',
            hornType: 'none',
            size: 'small',
            markings: 0,
          }}
          onHatch={handleHatch}
        />
      </div>
    );
  }

  if (phase === 'awakened' && creature) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.greeting}>Welcome, {userName}...</div>
          <div style={styles.subtitle}>A bond beyond words</div>
        </div>
        <CreatureDisplay creature={creature} />
        <div style={styles.continueHint}>
          Preparing your sanctuary...
        </div>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 50%, #2a1a3e 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  greeting: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#FFD700',
    textShadow: '0 0 30px rgba(255,215,0,0.3)',
    marginBottom: '8px',
    animation: 'fadeInUp 0.8s ease-out',
  },
  subtitle: {
    fontSize: '16px',
    color: '#aaa',
    fontStyle: 'italic',
    animation: 'fadeIn 1s ease-out 0.5s both',
  },
  continueHint: {
    marginTop: '20px',
    color: '#666',
    fontSize: '13px',
    animation: 'pulse 2s ease-in-out infinite',
  },
};
