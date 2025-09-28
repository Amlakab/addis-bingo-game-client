'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

const TeamMembers = [
  { name: "Abeje Belew", role: "Founder & CEO", bio: "10+ years in gaming industry" },
  { name: "Amlakie Abebaw", role: "Lead Developer", bio: "Full-stack developer specializing in real-time applications" },
  { name: "Brik Dessalegn", role: "Game Designer", bio: "Creative mind behind engaging game mechanics" },
  { name: "Samual Wilson", role: "Community Manager", bio: "Ensuring our players have the best experience" },
];

const Features = [
  { title: "Real-time Multiplayer", description: "Play with players worldwide in real-time bingo games" },
  { title: "Mobile Optimized", description: "Perfect gaming experience on any device" },
  { title: "Secure Transactions", description: "Safe and secure betting and payment system" },
  { title: "Multiple Game Modes", description: "Various bingo patterns and game types" },
  { title: "Social Features", description: "Chat with friends and make new connections" },
  { title: "Daily Rewards", description: "Login daily to claim free bonuses and rewards" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pb-24 pt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-purple-800 mb-8">
            About Feta Bingo
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Feta Bingo was born from a passion for classic bingo games and the desire to bring people together 
              in a fun, engaging, and modern digital environment. Founded in 2023, our platform has grown to 
              become a favorite destination for bingo enthusiasts worldwide.
            </p>
            <p className="text-gray-700">
              We combine the traditional excitement of bingo with cutting-edge technology to deliver a seamless 
              multiplayer experience that you can enjoy anytime, anywhere.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">What Makes Us Different</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Features.map((feature, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-600 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-700">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">Technology</h2>
            <p className="text-gray-700 mb-4">
              Feta Bingo is built on a robust tech stack that ensures smooth gameplay and real-time interactions:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Frontend</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  <li>Next.js 14 with App Router</li>
                  <li>React with TypeScript</li>
                  <li>Tailwind CSS for styling</li>
                  <li>WebSocket for real-time communication</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Backend</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  <li>Node.js with Express</li>
                  <li>Socket.IO for real-time events</li>
                  <li>PostgreSQL database</li>
                  <li>Redis for caching and sessions</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">Our Team</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {TeamMembers.map((member, index) => (
                <div key={index} className="flex items-start p-4 bg-purple-50 rounded-lg">
                  <div className="bg-purple-200 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 mr-4">
                    <span className="text-purple-600 font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-700">{member.name}</h3>
                    <p className="text-sm text-purple-600">{member.role}</p>
                    <p className="text-sm text-gray-600 mt-1">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">Responsible Gaming</h2>
            <p className="text-gray-700 mb-4">
              At Feta Bingo, we are committed to promoting responsible gaming. We provide tools to help you 
              manage your gaming experience, including deposit limits, time reminders, and self-exclusion options.
            </p>
            <p className="text-gray-700">
              Our platform is designed for entertainment, and we encourage all players to gamble responsibly. 
              You must be 18 years or older to play on our platform.
            </p>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth/register" 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Join Feta Bingo Today
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}