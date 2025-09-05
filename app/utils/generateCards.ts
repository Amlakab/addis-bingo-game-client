// utils/generateCards.ts
import seedrandom from 'seedrandom';

const SEED = 'fixed-bingo-seed-2025'; // same seed every time

/**
 * Generates 100 unique Bingo cards deterministically
 */
export const generateBingoCards = (): number[][][] => {
  const rng = seedrandom(SEED); // deterministic RNG
  const cards: number[][][] = [];
  const cardMap = new Set<string>(); // To ensure uniqueness

  const columnRanges = [
    { letter: 'B', min: 1, max: 15 },
    { letter: 'I', min: 16, max: 30 },
    { letter: 'N', min: 31, max: 45 },
    { letter: 'G', min: 46, max: 60 },
    { letter: 'O', min: 61, max: 75 }
  ];

  while (cards.length < 100) {
    const card: number[][] = [];
    let cardSignature = '';

    for (let col = 0; col < 5; col++) {
      const numbersInColumn = new Set<number>();

      while (numbersInColumn.size < 5) {
        // deterministic number generation
        const num =
          Math.floor(rng() * (columnRanges[col].max - columnRanges[col].min + 1)) +
          columnRanges[col].min;
        numbersInColumn.add(num);
      }

      const sortedNumbers = Array.from(numbersInColumn).sort((a, b) => a - b);
      card.push(sortedNumbers);
      cardSignature += sortedNumbers.join(',') + '|';
    }

    // Center FREE space
    card[2][2] = 0;

    if (!cardMap.has(cardSignature)) {
      cardMap.add(cardSignature);
      cards.push(card);
    }
  }

  return cards;
};

/**
 * Retrieves a specific card by ID (1-100)
 */
export const getCardById = (id: number): number[][] => {
  const cards = generateBingoCards();
  if (id < 1 || id > 100) throw new Error('Card ID must be between 1-100');
  return cards[id - 1];
};

/**
 * Validates a card
 */
export const validateCard = (card: number[][]): boolean => {
  if (card.length !== 5) return false;

  const columnRanges = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 }
  ];

  for (let col = 0; col < 5; col++) {
    if (card[col].length !== 5) return false;

    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        if (card[col][row] !== 0) return false;
        continue;
      }
      const num = card[col][row];
      if (num < columnRanges[col].min || num > columnRanges[col].max) return false;
    }
  }

  return true;
};
