'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';

// Placeholder images - replace with your actual game screenshots
const GameFlowImages = [
  { id: 1, alt: "Game Lobby", description: "Join a game room from the lobby" },
  { id: 2, alt: "Bingo Card", description: "Your bingo card with numbers" },
  { id: 3, alt: "Game in Progress", description: "Numbers being called in real-time" },
  { id: 4, alt: "Bingo Win", description: "Celebrate your winning pattern!" },
];

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pb-24 pt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
            How to Play Feta Bingo
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">Game Basics</h2>
            <p className="text-gray-700 mb-4">
              Feta Bingo is a multiplayer online bingo game where you can play with friends and players from around the world in real-time.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">1. Get Your Bingo Card</h3>
                <p className="text-gray-700">
                  Each player receives a digital bingo card with random numbers when joining a game.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-green-600 mb-2">2. Listen for Numbers</h3>
                <p className="text-gray-700">
                  Numbers are called automatically by the system. Mark them on your card as they're called.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-yellow-600 mb-2">3. Complete Patterns</h3>
                <p className="text-gray-700">
                  Complete the required pattern (line, full house, etc.) before other players.
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-red-600 mb-2">4. Call Bingo!</h3>
                <p className="text-gray-700">
                  Click the Bingo button when you complete a pattern. The system will verify your win.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">Game Flow</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {GameFlowImages.map((image) => (
                <div key={image.id} className="text-center">
                  <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-500">Screenshot: {image.alt}</span>
                    {/* Replace with actual Image component when you have images */}
                    {/* <Image 
                      src={`/screenshots/game-${image.id}.jpg`} 
                      alt={image.alt}
                      width={300}
                      height={200}
                      className="rounded-lg"
                    /> */}
                  </div>
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">Betting Interface</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Choose Your Stake</h3>
                  <p className="text-gray-700">
                    Select your bet amount before joining a game. Higher stakes offer bigger rewards!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Auto-Mark Feature</h3>
                  <p className="text-gray-700">
                    Enable auto-mark to automatically daub numbers on your card as they're called.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Quick Buttons</h3>
                  <p className="text-gray-700">
                    Use the quick buttons to mark multiple cards or call bingo with a single tap.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-3">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Win Distribution</h3>
                  <p className="text-gray-700">
                    Winnings are automatically distributed to your account after verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Play Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}