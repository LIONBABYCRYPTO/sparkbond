import { useState, useEffect } from 'react';
import EnhancedEgg from '../components/EnhancedEgg';
import Sanctuary from '../components/Sanctuary';
import CreatureDisplay from '../components/CreatureDisplay';
import { generateCreature, getTelegramUser, getPersonality, getTailType } from '../utils/creatureGen';
import type { CreatureData, GamePhase } from '../types';

interface AwakeningProps {
  onComplete: (creature: CreatureData) => void;
}

export default function Awakening({ onComplete }: AwakeningProps) {
  const [phase, setPhase] = useState<GamePhase>('egg');
  const [creature, setCreature] = useState<CreatureData | null>(null);
  const [userName, setUserName] = useState('');
  const [creatureName, setCreatureName] = useState('');
  const [eggAppearance, setEggAppearance] = useState<CreatureData['appearance'] | null>(null);

  useEffect(() => {
    const user = getTelegramUser();
    setUserName(user?.first_name || 'Strange One');

    // Pre-generate creature for the egg animation
    const userId = String(user?.id || Date.now());
    const { appearance, name } = generateCreature(userId);
    setEggAppearance(appearance);
    setCreatureName(name);
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
      appearance: { ...appearance, tailType: getTailType(userId) },
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
      emotion: 'happy',
      personality: getPersonality(userId),
      totalActions: 0,
      bondLevel: 5,
      nightVisitor: false,
      totalPlayTime: 0,
    };

    setCreature(newCreature);
    setPhase('awakened');

    setTimeout(() => onComplete(newCreature), 3000);
  };

  return (
    <Sanctuary creature={creature || { 
      appearance: { ...eggAppearance!, tailType: 'fox' },
      stats: { affection: 0, might: 0, wisdom: 0, speed: 0, spirit: 0, spark: 0 },
      name: creatureName,
      ownerName: '',
      hatchedAt: 0,
      evolution: 0,
      lastFed: 0,
      lastPetted: 0,
      mood: 'excited',
      emotion: 'neutral',
      personality: 'curious',
      totalActions: 0,
      bondLevel: 0,
      id: '',
      nightVisitor: false,
      totalPlayTime: 0,
    }}>
      <div style={styles.header}>
        <div style={styles.greeting}>Welcome, {userName}...</div>
      </div>

      {phase === 'egg' && eggAppearance && (
        <EnhancedEgg
          appearance={eggAppearance}
          creatureName={creatureName}
          onHatch={handleHatch}
        />
      )}

      {phase === 'awakened' && creature && (
        <>
          <CreatureDisplay creature={creature} />
          <div style={styles.continue}>Preparing your sanctuary...</div>
        </>
      )}
    </Sanctuary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    textAlign: 'center',
    padding: '10px',
    animation: 'fadeIn 1s ease-out',
  },
  greeting: {
    fontSize: '16px',
    color: '#aaa',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  continue: {
    marginTop: '20px',
    color: '#666',
    fontSize: '13px',
    animation: 'pulse 2s ease-in-out infinite',
  },
};
