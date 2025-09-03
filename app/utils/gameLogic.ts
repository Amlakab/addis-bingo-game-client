export const checkWin = (calledNumbers: string[], card: number[][], pattern: string): boolean => {
  const cols = ["B", "I", "N", "G", "O"];
  const marked = calledNumbers.map(num => num.split("-")[1]);

  // Check rows
  if (pattern === "row") {
    for (let row = 0; row < 5; row++) {
      if (card.every((col, i) => col[row] === 0 || marked.includes(col[row].toString()))) {
        return true;
      }
    }
  }

  // Check columns
  if (pattern === "column") {
    for (let col = 0; col < 5; col++) {
      if (card[col].every(num => num === 0 || marked.includes(num.toString()))) {
        return true;
      }
    }
  }

  // Check diagonals
  if (pattern === "diagonal") {
    const diag1 = [card[0][0], card[1][1], card[2][2], card[3][3], card[4][4]];
    const diag2 = [card[0][4], card[1][3], card[2][2], card[3][1], card[4][0]];
    if (diag1.every(num => num === 0 || marked.includes(num.toString()))) return true;
    if (diag2.every(num => num === 0 || marked.includes(num.toString()))) return true;
  }

  return false;
};

export const getWinningPattern = (calledNumbers: string[], card: number[][]): string | null => {
  const patterns = ["row", "column", "diagonal"];
  for (const pattern of patterns) {
    if (checkWin(calledNumbers, card, pattern)) {
      return pattern;
    }
  }
  return null;
};