// utils/generateCards.ts

/**
 * Generates 100 unique Bingo cards with standard 75-ball rules
 * Columns: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
 * Center space (N-3) is always FREE
 */
export const generateBingoCards = (): number[][][] => {
  const cards: number[][][] = [];
  const cardMap = new Set<string>(); // To ensure uniqueness

  // Column ranges for standard 75-ball Bingo
  const columnRanges = [
    { letter: 'B', min: 1, max: 15 },   // B column
    { letter: 'I', min: 16, max: 30 },  // I column
    { letter: 'N', min: 31, max: 45 },  // N column
    { letter: 'G', min: 46, max: 60 },  // G column
    { letter: 'O', min: 61, max: 75 }   // O column
  ];

  // Generate 100 unique cards
  while (cards.length < 100) {
    const card: number[][] = [];
    let cardSignature = '';

    // Generate each column
    for (let col = 0; col < 5; col++) {
      const columnNumbers: number[] = [];
      const { min, max } = columnRanges[col];
      const numbersInColumn = new Set<number>();

      // Generate 5 unique numbers for this column
      while (numbersInColumn.size < 5) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        numbersInColumn.add(num);
      }

      // Convert to array and sort
      const sortedNumbers = Array.from(numbersInColumn).sort((a, b) => a - b);
      card.push(sortedNumbers);
      cardSignature += sortedNumbers.join(',') + '|';
    }

    // Mark center space as FREE (0)
    card[2][2] = 0;

    // Check for uniqueness before adding
    if (!cardMap.has(cardSignature)) {
      cardMap.add(cardSignature);
      cards.push(card);
    }
  }

  // Store in localStorage for persistence
  localStorage.setItem('bingoCards', JSON.stringify(cards));
  
  return cards;
};

/**
 * Retrieves pre-generated cards from localStorage
 * Generates new ones if not found
 */
export const getBingoCards = (): number[][][] => {
  const storedCards = localStorage.getItem('bingoCards');
  if (storedCards) {
    return JSON.parse(storedCards);
  }
  return generateBingoCards();
};

/**
 * Gets a specific card by ID (1-100)
 */
export const getCardById = (id: number): number[][] => {
  const cards = getBingoCards();
  if (id < 1 || id > 100) throw new Error('Card ID must be between 1-100');
  return cards[id - 1];
};

// Helper function to validate a card's structure
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
      // Check center space
      if (col === 2 && row === 2) {
        if (card[col][row] !== 0) return false;
        continue;
      }

      // Check other numbers are in valid range
      const num = card[col][row];
      if (num < columnRanges[col].min || num > columnRanges[col].max) {
        return false;
      }
    }
  }

  return true;
};