export interface CreatureStats {
  affection: number;
  might: number;
  wisdom: number;
  speed: number;
  spirit: number;
  spark: number;
}

export type CreaturePattern = 'stripes' | 'spots' | 'none' | 'gradient';
export type HornType = 'curved' | 'spikes' | 'glow' | 'none';
export type TailType = 'fox' | 'cat' | 'dragon' | 'wolf' | 'rabbit' | 'none';
export type CreatureSize = 'small' | 'medium' | 'large';

export interface CreatureAppearance {
  baseColor: string;
  accentColor: string;
  eyeColor: string;
  pattern: CreaturePattern;
  hornType: HornType;
  tailType: TailType;
  size: CreatureSize;
  markings: number;
}

export type CreatureMood = 'happy' | 'neutral' | 'hungry' | 'sleepy' | 'excited';

export type PersonalityType = 'curious' | 'mischievous' | 'gentle' | 'brave' | 'shy' | 'playful' | 'wise' | 'dreamer';

export type Emotion = 'happy' | 'sleepy' | 'angry' | 'loved' | 'neutral';

export interface SoulCoreState {
  brightness: number;  // 0-1
  pulseSpeed: number;
  color: string;
  starCount: number;
}

export interface CreatureData {
  id: string;
  name: string;
  ownerName: string;
  hatchedAt: number;
  appearance: CreatureAppearance;
  stats: CreatureStats;
  evolution: number;
  lastFed: number;
  lastPetted: number;
  mood: CreatureMood;
  emotion: Emotion;
  personality: PersonalityType;
  totalActions: number;
  bondLevel: number; // 0-100
  favoriteToy?: string;
  nightVisitor: boolean; // pet remembers night logins
  totalPlayTime: number;
}

export type GamePhase = 'egg' | 'hatching' | 'awakened' | 'bond' | 'duel';
