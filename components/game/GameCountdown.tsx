'use client';

import React, { useState, useEffect } from 'react';

interface GameCountdownProps {
  startTime: Date;
  onCountdownEnd: () => void;
}

const GameCountdown: React.FC<GameCountdownProps> = ({ startTime, onCountdownEnd }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = startTime.getTime() - now.getTime();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    setIsActive(calculateTimeLeft() > 0);

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft === 0) {
        setIsActive(false);
        onCountdownEnd();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, onCountdownEnd]);

  if (!isActive) return null;

  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
      <h3 className="text-lg font-bold">Game Starting Soon!</h3>
      <p className="text-2xl mt-2">{timeLeft} seconds until game starts</p>
      <p>Select your cards before the game begins!</p>
    </div>
  );
};

export default GameCountdown;