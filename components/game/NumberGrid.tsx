import React from 'react';

interface NumberGridProps {
  calledNumbers: number[];
  currentNumber?: number;
}

const NumberGrid: React.FC<NumberGridProps> = ({ calledNumbers, currentNumber }) => {
  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

  return (
    <div className="number-grid">
      {numbers.map((number) => {
        const isCalled = calledNumbers.includes(number);
        const isCurrent = currentNumber === number;
        
        return (
          <div
            key={number}
            className={`number-cell ${isCalled ? 'called' : ''} ${isCurrent ? 'animate-bounce' : ''}`}
          >
            {number}
          </div>
        );
      })}
    </div>
  );
};

export default NumberGrid;