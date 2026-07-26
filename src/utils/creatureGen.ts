import type { CreatureAppearance, CreatureMood, PersonalityType, TailType, Emotion } from '../types';

// Deterministic creature generation from Telegram user ID
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const BASE_COLORS = [
  '#6C5CE7', // mystic purple
  '#00B894', // forest emerald
  '#FD79A8', // blossom pink
  '#0984E3', // ocean blue
  '#FDCB6E', // sun gold
  '#E17055', // ember orange
  '#A29BFE', // lavender
  '#55EFC4', // mint
  '#FF7675', // coral
  '#74B9FF', // sky blue
];

const ACCENT_COLORS = [
  '#FFD700', // gold
  '#FF6B6B', // ruby
  '#48DBFB', // cyan
  '#FF9FF3', // fairy pink
  '#54A0FF', // sapphire
  '#5F27CD', // deep purple
  '#01A3A4', // teal
  '#F368E0', // magenta
];

const EYE_COLORS = [
  '#FFD700', // golden
  '#00FF88', // emerald
  '#FF6B9D', // rose
  '#00D2FF', // electric blue
  '#FF9500', // amber
  '#C084FC', // lilac
  '#FF4777', // ruby
  '#34D399', // jade
];

interface TelegramUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export function getTelegramUser(): TelegramUser | null {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      return tg.initDataUnsafe.user;
    }
  } catch {}
  return null;
}

export function generateCreatureName(): string {
  const prefixes = ['Luna', 'Pyro', 'Aqua', 'Zephyr', 'Nova', 'Ember', 'Orion', 'Stella', 'Flux', 'Astra'];
  const suffixes = ['rix', 'lume', 'aris', 'wynn', 'doran', 'vell', 'spark', 'wyn', 'thal', 'mere'];
  // Use time + randomness for name
  const seed = Date.now() % 1000;
  const pi = prefixes[seed % prefixes.length];
  const si = suffixes[(seed * 7) % suffixes.length];
  return `${pi}${si}`;
}

const TAIL_TYPES: TailType[] = ['fox', 'cat', 'dragon', 'wolf', 'rabbit'];

export function generateCreature(userId: string): { appearance: CreatureAppearance; name: string } {
  const hash = hashUserId(userId);
  
  const appearance: CreatureAppearance = {
    baseColor: BASE_COLORS[hash % BASE_COLORS.length],
    accentColor: ACCENT_COLORS[(hash * 3) % ACCENT_COLORS.length],
    eyeColor: EYE_COLORS[(hash * 7) % EYE_COLORS.length],
    pattern: (['stripes', 'spots', 'none', 'gradient'] as const)[hash % 4],
    hornType: (['curved', 'spikes', 'glow', 'none'] as const)[hash % 4],
    tailType: TAIL_TYPES[hash % TAIL_TYPES.length],
    size: 'small',
    markings: (hash % 5) + 1,
  };

  const name = generateCreatureName();
  return { appearance, name };
}

const PERSONALITIES: PersonalityType[] = ['curious', 'mischievous', 'gentle', 'brave', 'shy', 'playful', 'wise', 'dreamer'];

export function getPersonality(userId: string): PersonalityType {
  const hash = hashUserId(userId);
  return PERSONALITIES[hash % PERSONALITIES.length];
}

export function getTailType(userId: string): TailType {
  const hash = hashUserId(userId);
  return TAIL_TYPES[hash % TAIL_TYPES.length];
}

export function getPersonalityDescription(p: PersonalityType): string {
  const map: Record<PersonalityType, string> = {
    curious: 'Constantly investigates glowing things and hidden corners',
    mischievous: 'Hides toys and plays harmless tricks on you',
    gentle: 'Comforts nearby pets and gives extra affection',
    brave: 'Takes the lead and protects others during adventures',
    shy: 'Peek from behind things and slowly warms up to you',
    playful: 'Loves chasing butterflies and starts mini-games',
    wise: 'Occasionally hints about secrets and rare events',
    dreamer: 'Frequently enters dream mode and unlocks dream quests',
  };
  return map[p];
}

export function getEmotion(
  mood: CreatureMood,
  bondLevel: number,
  hoursSinceFed: number,
  hoursSincePetted: number,
): Emotion {
  if (bondLevel > 50 && hoursSinceFed < 2 && hoursSincePetted < 3) return 'loved';
  if (hoursSinceFed > 8) return 'angry';
  if (mood === 'sleepy' || hoursSinceFed > 5) return 'sleepy';
  if (bondLevel > 20 && hoursSinceFed < 4) return 'happy';
  return 'neutral';
}

export function getEmotionColor(emotion: Emotion): string {
  const map: Record<Emotion, string> = {
    happy: '#FFD700',
    sleepy: '#87CEEB',
    angry: '#FF4444',
    loved: '#FF69B4',
    neutral: '#AAAAAA',
  };
  return map[emotion];
}

export function getSoulCoreColor(emotion: Emotion): string {
  const map: Record<Emotion, string> = {
    happy: '#FFD700',
    sleepy: '#7EC8E3',
    angry: '#FF4400',
    loved: '#FF69B4',
    neutral: '#C084FC',
  };
  return map[emotion];
}

export function getCreatureMood(data: { lastFed: number; lastPetted: number; stats: { affection: number } }): CreatureMood {
  const now = Date.now();
  const hoursSinceFed = (now - data.lastFed) / (1000 * 60 * 60);
  const hoursSincePetted = (now - data.lastPetted) / (1000 * 60 * 60);
  
  if (hoursSinceFed > 6) return 'hungry';
  if (hoursSinceFed > 4 && hoursSincePetted > 4) return 'sleepy';
  if (data.stats.affection > 30 && hoursSinceFed < 3) return 'excited';
  if (data.stats.affection > 10) return 'happy';
  return 'neutral';
}

export function getMoodEmoji(mood: CreatureMood): string {
  const map: Record<CreatureMood, string> = {
    happy: '😊',
    neutral: '😐',
    hungry: '🍽️',
    sleepy: '😴',
    excited: '✨',
  };
  return map[mood];
}

export function getMoodMessage(mood: CreatureMood, name: string): string {
  const map: Record<CreatureMood, string> = {
    happy: `${name} is happy! Keep up the care!`,
    neutral: `${name} seems calm. Try playing with them!`,
    hungry: `${name} is hungry! Time for a meal!`,
    sleepy: `${name} is getting sleepy...`,
    excited: `${name} is bursting with energy! ✨`,
  };
  return map[mood];
}
