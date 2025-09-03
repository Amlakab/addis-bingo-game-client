import React from 'react';

interface BingoCardProps {
  numbers: number[][];
  markedNumbers: number[];
  isBlocked?: boolean;
  isWinner?: boolean;
  onMarkNumber?: (number: number) => void;
}

const BingoCard: React.FC<BingoCardProps> = ({
  numbers,
  markedNumbers,
  isBlocked = false,
  isWinner = false,
  onMarkNumber,
}) => {
  const handleCellClick = (number: number) => {
    if (onMarkNumber && !isBlocked && number !== 0) {
      onMarkNumber(number);
    }
  };

  return (
    <div className={`bingo-card ${isBlocked ? 'opacity-50' : ''} ${isWinner ? 'border-green-500 border-4' : ''}`}>
      {numbers.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-between">
          {row.map((number, colIndex) => {
            const isFreeSpace = rowIndex === 2 && colIndex === 2;
            const isMarked = markedNumbers.includes(number) || isFreeSpace;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`bingo-cell ${isMarked ? 'marked' : ''} ${isFreeSpace ? 'free' : ''} ${
                  onMarkNumber && !isBlocked && !isFreeSpace ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default'
                }`}
                onClick={() => handleCellClick(number)}
              >
                {isFreeSpace ? 'FREE' : number}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default BingoCard;