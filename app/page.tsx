'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/ui/Navbar';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Floating elements component - FIXED VERSION
const FloatingElements = () => {
  const [isClient, setIsClient] = useState(false);
  const elements = ['🎯', '💰', '⭐', '🎲', '🏆', '🎰', '♠️', '♥️', '♦️', '♣️'];

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl opacity-20"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        >
          {element}
        </motion.div>
      ))}
    </div>
  );
};

// Confetti burst component
const ConfettiBurst = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{
            x: '50vw',
            y: '50vh',
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: `calc(50vw + ${Math.random() * 600 - 300}px)`,
            y: `calc(50vh + ${Math.random() * 600 - 300}px)`,
            opacity: 0,
            scale: 1,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2,
            ease: "easeOut"
          }}
        >
          {['🎉', '✨', '⭐', '🎊', '💫'][i % 5]}
        </motion.div>
      ))}
    </div>
  );
};

// Rocket animation component
const RocketAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-1/4 text-4xl z-20"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: -1000, opacity: 1 }}
      transition={{ duration: 3, ease: "easeOut" }}
    >
      🚀
      <motion.div
        className="absolute left-0 text-xl"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        ✨
      </motion.div>
    </motion.div>
  );
};

// Animated card component
const AnimatedCard = ({ emoji, title, description, delay }: { emoji: string; title: string; description: string; delay: number }) => (
  <motion.div
    className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-all duration-300"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.05, rotate: 2 }}
  >
    <motion.div
      className="text-4xl mb-4"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {emoji}
    </motion.div>
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p>{description}</p>
  </motion.div>
);

// Animated step component
const AnimatedStep = ({ number, title, description, delay }: { number: number; title: string; description: string; delay: number }) => (
  <motion.div
    className="text-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.1 }}
  >
    <motion.div
      className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <span className="text-xl font-bold">{number}</span>
    </motion.div>
    <h3 className="font-bold">{title}</h3>
    <p className="text-sm">{description}</p>
  </motion.div>
);

export default function Home() {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Show confetti on load
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-0 px-1 py-2 min-h-screen overflow-hidden relative">
      <FloatingElements />
      {showConfetti && <ConfettiBurst />}
      <RocketAnimation />
      
      <Navbar />
      
      {/* Hero Section */}
      <section className="text-center mb-12 pb-24 pt-20 relative z-10">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to Feta Bingo
        </motion.h1>
        
        <motion.p 
          className="text-xl mb-8 text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Play Bingo, win real money, and have fun!
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {user ? (
            <div className="space-x-4">
              <Link
                href="/game/lobby"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
              Play Now
              </Link>
              <Link
                href="/user/dashboard"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
              My Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/auth/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
              Get Started
              </Link>
              <Link
                href="/auth/login"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
              Login
              </Link>
            </div>
          )}
        </motion.div>

        {/* Floating coins animation */}
        <motion.div
          className="absolute top-20 right-10 text-3xl"
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          💰
        </motion.div>
        <motion.div
          className="absolute top-40 left-10 text-3xl"
          animate={{ y: [0, -15, 0], rotate: [0, -15, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          🎯
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative z-10">
        <AnimatedCard
          emoji="🎯"
          title="Easy to Play"
          description="Simple rules, exciting gameplay. Anyone can play and win!"
          delay={0.1}
        />
        
        <AnimatedCard
          emoji="💰"
          title="Win Real Money"
          description="Deposit, play, and withdraw your winnings easily."
          delay={0.3}
        />
        
        <AnimatedCard
          emoji="⚡"
          title="Fast Payouts"
          description="Get your winnings quickly through secure payment methods."
          delay={0.5}
        />
      </section>

      {/* How to Play Section */}
      <section className="bg-blue-50 p-8 rounded-lg relative z-10 overflow-hidden">
        {/* Background decorative elements */}
        <motion.div
          className="absolute -top-10 -right-10 text-6xl opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          🎰
        </motion.div>
        <motion.div
          className="absolute -bottom-5 -left-5 text-6xl opacity-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          🎲
        </motion.div>

        <motion.h2 
          className="text-2xl font-bold mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          How to Play
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          <AnimatedStep number={1} title="Register" description="Create your account with your phone number" delay={0.1} />
          <AnimatedStep number={2} title="Deposit" description="Add funds to your wallet securely" delay={0.3} />
          <AnimatedStep number={3} title="Play" description="Choose a game and buy your Bingo cards" delay={0.5} />
          <AnimatedStep number={4} title="Win" description="Complete patterns and claim your prizes" delay={0.7} />
        </div>

        {/* See More Button */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="/howtoplay"
            className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            See More
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-2"
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Winning Celebration Section */}
      <motion.section 
        className="text-center mt-16 p-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-white"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <motion.h2 
          className="text-3xl font-bold mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎉 Congratulations! 🎉
        </motion.h2>
        <p className="text-lg mb-4">Join thousands of winners today!</p>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          🏆
        </motion.div>
      </motion.section>

      {/* Floating action button for quick play */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Link
          href={user ? "/game/lobby" : "/auth/register"}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center text-2xl"
        >
          🎲
        </Link>
      </motion.div>
    </div>
  );
}