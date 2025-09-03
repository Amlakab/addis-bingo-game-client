'use client';

import React, { useState } from 'react';
import { GameSettings } from '@/types';

interface GameControlsProps {
  game: any;
}

const GameControls: React.FC<GameControlsProps> = ({ game }) => {
  const [settings, setSettings] = useState<GameSettings>({
    language: 'en',
    speed: 1,
    soundEnabled: true,
  });

  const handleLanguageChange = (language: 'am' | 'en' | 'om') => {
    setSettings({ ...settings, language });
    // Implement language change logic
  };

  const handleSpeedChange = (speed: 1 | 1.5 | 2) => {
    setSettings({ ...settings, speed });
    // Implement speed change logic
  };

  const toggleSound = () => {
    setSettings({ ...settings, soundEnabled: !settings.soundEnabled });
    // Implement sound toggle logic
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h3 className="text-lg font-bold mb-4">Game Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value as 'am' | 'en' | 'om')}
            className="w-full p-2 border rounded"
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
            <option value="om">Oromic</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Speed</label>
          <select
            value={settings.speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value) as 1 | 1.5 | 2)}
            className="w-full p-2 border rounded"
          >
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={toggleSound}
              className="mr-2"
            />
            Sound
          </label>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm">
          Game Status: <span className="font-bold capitalize">{game.status}</span>
        </p>
        <p className="text-sm">
          Numbers Called: <span className="font-bold">{game.calledNumbers?.length || 0}/75</span>
        </p>
      </div>
    </div>
  );
};

export default GameControls;