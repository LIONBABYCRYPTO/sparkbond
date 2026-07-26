export interface CreatureStats {
  affection: number;
  might: number;
  wisdom: number;
  speed: number;
  spirit: number;
  spark: number;
}

export interface CreatureAppearance {
  baseColor: string;
  accentColor: string;
  eyeColor: string;
  pattern: 'stripes' | 'spots' | 'none' | 'gradient';
  hornType: 'curved' | 'spikes' | 'glow' | 'none';
  size: 'small' | 'medium' | 'large';
  markings: number;
}

export type CreatureMood = 'happy' | 'neutral' | 'hungry' | 'sleepy' | 'excited';

export interface CreatureData {
  id: string;
  name: string;
  ownerName: string;
  hatchedAt: number;
  appearance: CreatureAppearance;
  stats: CreatureStats;
  evolution: number; // 0 = egg, 1 = stage1, 2 = stage2, 3 = final
  lastFed: number;
  lastPetted: number;
  mood: CreatureMood;
  totalActions: number;
}

export type GamePhase = 'egg' | 'hatching' | 'awakened' | 'bond' | 'duel';
