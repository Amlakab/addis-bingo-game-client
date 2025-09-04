'use client';

import Link from 'next/link';
import { useAuth, AuthProvider } from '@/lib/auth';
import Navbar from '@/components/ui/Navbar';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container mx-0 px-1 py-2">
    <Navbar />
      <section className="text-center mb-12 pb-24 pt-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Bingo Platform</h1>
        <p className="text-xl mb-8">Play Bingo, win real money, and have fun!</p>
        
        {user ? (
          <div className="space-x-4">
            <Link
              href="/game/lobby"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
            >
              Play Now
            </Link>
            <Link
              href="/user/dashboard"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg"
            >
              My Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              href="/auth/register"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg"
            >
              Login
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2">Easy to Play</h2>
          <p>Simple rules, exciting gameplay. Anyone can play and win!</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-xl font-bold mb-2">Win Real Money</h2>
          <p>Deposit, play, and withdraw your winnings easily.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-bold mb-2">Fast Payouts</h2>
          <p>Get your winnings quickly through secure payment methods.</p>
        </div>
      </section>

      <section className="bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">How to Play</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-bold">Register</h3>
            <p className="text-sm">Create your account with your phone number</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-bold">Deposit</h3>
            <p className="text-sm">Add funds to your wallet securely</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-bold">Play</h3>
            <p className="text-sm">Choose a game and buy your Bingo cards</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold">4</span>
            </div>
            <h3 className="font-bold">Win</h3>
            <p className="text-sm">Complete patterns and claim your prizes</p>
          </div>
        </div>
      </section>
    </div>
  );
}