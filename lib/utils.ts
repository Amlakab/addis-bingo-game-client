export const generateBingoCards = (count: number): number[][][] => {
  const cards: number[][][] = [];
  
  for (let i = 0; i < count; i++) {
    const card: number[][] = [];
    const usedNumbers = new Set<number>();
    
    for (let col = 0; col < 5; col++) {
      const column: number[] = [];
      const min = col * 15 + 1;
      const max = min + 14;
      
      while (column.length < 5) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!usedNumbers.has(num)) {
          column.push(num);
          usedNumbers.add(num);
        }
      }
      
      card.push(column);
    }
    
    // Free space in the center
    card[2][2] = 0;
    
    cards.push(card);
  }
  
  return cards;
};

export const checkBingo = (markedNumbers: number[], card: number[][]): string | null => {
  const size = 5;
  
  // Check rows
  for (let row = 0; row < size; row++) {
    if (card[row].every((num, col) => col === 2 && row === 2 ? true : markedNumbers.includes(num))) {
      return `row-${row + 1}`;
    }
  }
  
  // Check columns
  for (let col = 0; col < size; col++) {
    if (card.every((row, rowIdx) => rowIdx === 2 && col === 2 ? true : markedNumbers.includes(row[col]))) {
      return `col-${col + 1}`;
    }
  }
  
  // Check diagonal top-left to bottom-right
  if (card.every((row, idx) => idx === 2 ? true : markedNumbers.includes(row[idx]))) {
    return 'diagonal-1';
  }
  
  // Check diagonal top-right to bottom-left
  if (card.every((row, idx) => idx === 2 ? true : markedNumbers.includes(row[4 - idx]))) {
    return 'diagonal-2';
  }
  
  // Check four corners
  if (
    markedNumbers.includes(card[0][0]) &&
    markedNumbers.includes(card[0][4]) &&
    markedNumbers.includes(card[4][0]) &&
    markedNumbers.includes(card[4][4])
  ) {
    return 'four-corners';
  }
  
  return null;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};
// lib/utils.ts

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};