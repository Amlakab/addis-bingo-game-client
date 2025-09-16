'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/ui/Navbar';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container mx-0 px-1 py-2 bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative text-center mb-12 pb-24 pt-20 overflow-hidden">
        {/* Floating bingo balls */}
        <motion.div
          className="absolute top-10 left-10 text-5xl"
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🔵
        </motion.div>
        <motion.div
          className="absolute top-20 right-20 text-5xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          🔴
        </motion.div>
        <motion.div
          className="absolute bottom-10 left-1/3 text-5xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        >
          🟡
        </motion.div>

        {/* Hero Text */}
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-6"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Welcome to Feta Bingo 🎉
        </motion.h1>

        <motion.p
          className="text-xl mb-8 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Play Bingo, win real money, and have fun!
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="space-x-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {user ? (
            <>
              <Link
                href="/game/lobby"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:scale-105 transform transition"
              >
                🎮 Play Now
              </Link>
              <Link
                href="/user/dashboard"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:scale-105 transform transition"
              >
                📊 My Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:scale-105 transform transition"
              >
                ✨ Get Started
              </Link>
              <Link
                href="/auth/login"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:scale-105 transform transition"
              >
                🔑 Login
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { icon: '🎯', title: 'Easy to Play', desc: 'Simple rules, exciting gameplay. Anyone can play and win!' },
          { icon: '💰', title: 'Win Real Money', desc: 'Deposit, play, and withdraw your winnings easily.' },
          { icon: '⚡', title: 'Fast Payouts', desc: 'Get your winnings quickly through secure payment methods.' },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-white p-6 rounded-lg shadow-md text-center border hover:shadow-xl transition"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl mb-4">{item.icon}</div>
            <h2 className="text-xl font-bold mb-2">{item.title}</h2>
            <p>{item.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* How to Play */}
      <section className="bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">How to Play</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Register', 'Deposit', 'Play', 'Win'].map((step, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.3, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold">{i + 1}</span>
              </div>
              <h3 className="font-bold">{step}</h3>
              <p className="text-sm">
                {i === 0 && 'Create your account with your phone number'}
                {i === 1 && 'Add funds to your wallet securely'}
                {i === 2 && 'Choose a game and buy your Bingo cards'}
                {i === 3 && 'Complete patterns and claim your prizes'}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/howtoplay"
            className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-lg font-semibold transition hover:scale-105"
          >
            See More →
          </Link>
        </div>
      </section>
    </div>
  );
}
