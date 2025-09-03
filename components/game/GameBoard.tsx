'use client';

import React, { useState, useEffect } from 'react';
import BingoCard from './BingoCard';
import NumberGrid from './NumberGrid';
import GameControls from './GameControls';
import { useAuth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

interface GameBoardProps {
  game: any;
  userCards: any[];
}

const GameBoard: React.FC<GameBoardProps> = ({ game, userCards }) => {
  const { user } = useAuth();
  const [calledNumbers, setCalledNumbers] = useState<number[]>(game.calledNumbers || []);
  const [currentNumber, setCurrentNumber] = useState<number | undefined>();
  const [markedNumbers, setMarkedNumbers] = useState<{ [cardId: string]: number[] }>({});
  const [gameStatus, setGameStatus] = useState(game.status);
  const [winner, setWinner] = useState(game.winner);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      socket.on('numberCalled', (data: { number: number; calledNumbers: number[] }) => {
        setCurrentNumber(data.number);
        setCalledNumbers(data.calledNumbers);
        
        // Auto-mark numbers on user's cards
        const newMarkedNumbers = { ...markedNumbers };
        userCards.forEach(card => {
          if (!newMarkedNumbers[card._id]) {
            newMarkedNumbers[card._id] = [];
          }
          if (!newMarkedNumbers[card._id].includes(data.number)) {
            newMarkedNumbers[card._id].push(data.number);
          }
        });
        setMarkedNumbers(newMarkedNumbers);
      });

      socket.on('gameEnded', (data: { winner: string; winningCard: string }) => {
        setGameStatus('completed');
        setWinner(data.winner);
        
        // Mark the winning card
        const newMarkedNumbers = { ...markedNumbers };
        if (data.winningCard) {
          userCards.forEach(card => {
            if (card._id === data.winningCard) {
                newMarkedNumbers[card._id] = card.numbers.flat().filter((n: number) => n !== 0);
              //newMarkedNumbers[card._id] = card.numbers.flat().filter(n => n !== 0);
            }
          });
          setMarkedNumbers(newMarkedNumbers);
        }
      });

      socket.on('playerJoined', (data: any) => {
        console.log('Player joined:', data);
      });

      socket.on('playerLeft', (data: any) => {
        console.log('Player left:', data);
      });
    }

    return () => {
      if (socket) {
        socket.off('numberCalled');
        socket.off('gameEnded');
        socket.off('playerJoined');
        socket.off('playerLeft');
      }
    };
  }, [userCards, markedNumbers]);

  const handleBingo = (cardId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('declareBingo', { gameId: game._id, cardId });
    }
  };

  if (gameStatus === 'completed') {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        {winner ? (
          <p className="text-lg">
            {winner === user?._id ? 'You won!' : `Player ${winner} won the game!`}
          </p>
        ) : (
          <p className="text-lg">No winner in this game.</p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NumberGrid calledNumbers={calledNumbers} currentNumber={currentNumber} />
          <GameControls game={game} />
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-4">Your Cards</h3>
          <div className="space-y-4">
            {userCards.map((card) => (
              <div key={card._id} className="relative">
                <BingoCard
                  numbers={card.numbers}
                  markedNumbers={markedNumbers[card._id] || []}
                  isBlocked={card.isBlocked}
                  isWinner={card.isWinner}
                />
                {!card.isBlocked && gameStatus === 'active' && (
                  <button
                    onClick={() => handleBingo(card._id)}
                    className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
                  >
                    BINGO!
                  </button>
                )}
                {card.isBlocked && (
                  <p className="text-red-500 text-sm mt-1">Blocked - Invalid Bingo</p>
                )}
                {card.isWinner && (
                  <p className="text-green-500 text-sm mt-1">Winner!</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;