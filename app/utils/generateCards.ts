// utils/generateCards.ts
import seedrandom from 'seedrandom';

const SEED = 'fixed-bingo-seed-2025';

interface ColumnRange {
  letter: string;
  min: number;
  max: number;
}

const columnRanges: ColumnRange[] = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 }
];

// Cache the cards to avoid regenerating (PERMANENT storage)
let cachedCards: number[][][] | null = null;

/**
 * Generates deterministic, unique, and well-shuffled bingo cards
 * Guaranteed to be the same forever, everywhere
 */
export const generateBingoCards = (count: number = 400): number[][][] => {
  // Return cached cards if they exist
  if (cachedCards && cachedCards.length === count) {
    return cachedCards;
  }

  const cards: number[][][] = [];
  const cardMap = new Set<string>();
  
  // Create a fresh deterministic RNG instance with the same seed
  const rng = seedrandom(SEED);

  // Fisher-Yates shuffle using the provided RNG
  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Helper to compare card similarity
  const similarity = (cardA: number[][], cardB: number[][]): number => {
    let score = 0;
    for (let col = 0; col < 5; col++) {
      const colA = cardA[col]?.join(',') || '';
      const colB = cardB[col]?.join(',') || '';
      if (colA === colB) score++;
    }
    return score;
  };

  while (cards.length < count) {
    const card: number[][] = [[], [], [], [], []];
    let cardSignature = '';

    for (let col = 0; col < 5; col++) {
      const numbersInColumn = new Set<number>();
      const range = columnRanges[col]!;

      while (numbersInColumn.size < 5) {
        const num = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
        numbersInColumn.add(num);
      }

      const shuffledNumbers = shuffle(Array.from(numbersInColumn));
      card[col] = shuffledNumbers;
      cardSignature += shuffledNumbers.join(',') + '|';
    }

    // Free space (middle position)
    card[2]![2] = 0;

    // Check uniqueness & similarity
    if (!cardMap.has(cardSignature)) {
      const tooSimilar = cards.some(existing => similarity(existing, card) >= 3);
      if (!tooSimilar) {
        cardMap.add(cardSignature);
        cards.push(card);
      }
    }
  }

  // Cache the result permanently
  cachedCards = cards;
  return cards;
};

/**
 * Retrieves a specific card by ID (1..count) - PERMANENTLY consistent
 */
export const getCardById = (id: number): number[][] => {
  if (!cachedCards) {
    cachedCards = generateBingoCards();
  }
  
  if (id < 1 || id > cachedCards.length) {
    throw new Error(`Card ID must be between 1 and ${cachedCards.length}`);
  }
  
  const card = cachedCards[id - 1];
  if (!card) {
    throw new Error(`Card at index ${id - 1} is undefined`);
  }
  
  return card;
};

/**
 * Validates a card structure
 */
export const validateCard = (card: number[][]): boolean => {
  if (!card || card.length !== 5) return false;

  for (let col = 0; col < 5; col++) {
    const column = card[col];
    if (!column || column.length !== 5) return false;

    for (let row = 0; row < 5; row++) {
      const num = column[row];
      
      if (col === 2 && row === 2) {
        if (num !== 0) return false;
        continue;
      }
      
      const range = columnRanges[col];
      if (!range || typeof num !== 'number' || num < range.min || num > range.max) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Utility function to get card count
 */
export const getTotalCards = (): number => {
  if (!cachedCards) {
    cachedCards = generateBingoCards();
  }
  return cachedCards.length;
};

/**
 * Reset cache (mainly for testing purposes)
 */
export const resetCache = (): void => {
  cachedCards = null;
};

/**
 * Get all cards at once
 */
export const getAllCards = (): number[][][] => {
  if (!cachedCards) {
    cachedCards = generateBingoCards();
  }
  return cachedCards;
};