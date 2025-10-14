'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { useAuth } from '@/lib/auth';
// Page Access Instructions with images
const AccessSteps = [
  { step: 1, title: "Home Page Access", text: "Start by accessing the Feta Bingo home page where you can explore the game options and features.", file: "/Step1.png", alt: "Home Page" },
  { step: 2, title: "Login & Registration", text: "Register using your phone number and a secure password if you're new to Feta Bingo. If you have an existing account, simply login with your credentials.", file: "/Step2.png", alt: "Login/Register" },
  { step: 3, title: "Dashboard Navigation", text: "After logging in, you'll access your dashboard where you can navigate using the mobile navbar.", file: "/Step3.png", alt: "Dashboard" },
  { step: 4, title: "Wallet Management", text: "Access your wallet from the navbar to view your balance, make deposits, request withdrawals, and check your transaction history.", file: "/Step4.png", alt: "Wallet" },
  { step: 5, title: "Game History", text: "Check your game history from the navbar to review your wins and past games.", file: "/Step7.png", alt: "Game History" },
];

// How to Play steps with images
const HowToPlaySteps = [
  { step: 1, title: "Deposit Funds", text: "First, deposit funds into your wallet through the wallet section of the navbar.", file: "/Step8.png", alt: "Deposit" },
  { step: 2, title: "Select a Game", text: 'Click "Play" from the navbar to see available game lists and select one that matches your preferred bet amount.', file: "/Step5.png", alt: "Select a Game" },
  { step: 3, title: "Select Your Cards", text: "For the selected game, choose your bingo cards. You can select up to 2 cards and change your selection until the timer reaches 0 seconds or the game starts.", note: "Note: You can clear selected cards before the game starts for a refund. After the game starts, you cannot clear your selected cards.", file: "/Step10.png", alt: "Select Your Cards" },
  { step: 4, title: "Game Play", text: "When the game starts (after the timer reaches 0), numbers will be called automatically. Mark the called numbers on your card as they appear.", file: "/Step9.png", alt: "Game Play" },
  { step: 5, title: "Winning", text: 'If you complete a winning pattern, click the "Bingo" button. The system will verify your win and display your winning status if confirmed.', note: "Important: Never click the Bingo button if you haven't actually won, as the system will block your cards for false claims.", file: "/Stepp11.png", alt: "Winning" },
];

export default function HowToPlayPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pb-20">
      {/* Navbar */}
      <Navbar />

      {/* Page Title */}
      <div className="container mx-auto px-4 py-8 max-w-4xl py-8 pt-24">
        <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
          How to Play Feta Bingo
        </h1>
      </div>

      {/* Game Basics */}
      {/* <div className="container mx-auto px-4 py-4 max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Game Basics</h2>
        <p className="text-gray-700 mb-4">
          Feta Bingo is a multiplayer online bingo game where you can play with friends and players from around the world in real-time.
        </p>
      </div> */}

      {/* Page Access Instructions Card */}
      <div className="container mx-auto px-4 max-w-4xl mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">Accessing Feta Bingo</h2>
          <p className="text-gray-700 mb-4">
          Feta Bingo is a multiplayer online bingo game where you can play with friends and players from around the world in real-time.
        </p>
          <div className="space-y-4">
            {AccessSteps.map(item => (
              <div key={item.step} className="bg-blue-50 rounded-lg shadow-md p-4 flex flex-col">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </span>
                  {item.title}
                </h3>
                <p className="text-gray-700 mb-2">{item.text}</p>
                <Image src={item.file} alt={item.alt} width={300} height={180} className="rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How to Play Card */}
      <div className="container mx-auto px-4 max-w-4xl mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">How to Play</h2>
          <div className="space-y-4">
            {HowToPlaySteps.map(item => (
              <div key={item.step} className="bg-green-50 rounded-lg shadow-md p-4 flex flex-col">
                <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </span>
                  {item.title}
                </h3>
                <p className="text-gray-700 mb-2">{item.text}</p>
                {item.note && <p className="text-sm text-blue-600 mb-2">{item.note}</p>}
                <Image src={item.file} alt={item.alt} width={300} height={180} className="rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 rounded-lg shadow-lg p-6 mb-8 border-l-4 border-yellow-400 container mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-semibold text-yellow-700 mb-4">Important Notes</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>You can clear selected cards before the game starts and receive a refund</li>
          <li>After the game starts, you cannot clear your selected cards</li>
          <li>Never click the Bingo button unless you have a valid winning pattern</li>
          <li>False Bingo claims will result in your cards being blocked for that game</li>
          <li>Winnings are automatically credited to your wallet after verification</li>
        </ul>
      </div>
        {/* Play Now Button */}
          <div className="text-center mb-12">
          {user ? (
            <Link 
              href="/user/lobby"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Play Now
            </Link>) : (
              <Link 
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Play Now
            </Link>
            )}
          </div>
      <Footer />
    </div>
  );
}
