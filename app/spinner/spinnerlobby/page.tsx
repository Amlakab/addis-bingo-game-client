// app/spinner/spinnerlobby/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import MobileHeader from '@/components/spinner-user/MobileHeader';
import MobileNavigation from '@/components/spinner-user/MobileNavigation';
import api from '@/app/utils/api';

interface Card {
  id: number;
  betAmount: number;
  numberOfPlayers: number;
  prizePool: number;
  isSelected: boolean;
}

interface UserType {
  _id: string;
  phone: string;
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SpinnerLobby() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load from localStorage or use defaults
  const [betAmount, setBetAmount] = useState(() => {
    if (typeof window === 'undefined') return 100;
    const saved = localStorage.getItem('spinner-betAmount');
    return saved ? parseInt(saved) : 100;
  });
  
  const [numberOfPlayers, setNumberOfPlayers] = useState(() => {
    if (typeof window === 'undefined') return 10;
    const saved = localStorage.getItem('spinner-numberOfPlayers');
    return saved ? parseInt(saved) : 10;
  });
  
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('spinner-betAmount', betAmount.toString());
    localStorage.setItem('spinner-numberOfPlayers', numberOfPlayers.toString());
  }, [betAmount, numberOfPlayers]);

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === 'undefined') return;
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) {
          router.push('/auth/login');
          return;
        }

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    generateCards();
  }, [router]);

  useEffect(() => {
    generateCards();
  }, [betAmount, numberOfPlayers]);

  const generateCards = () => {
    const prizePool = Math.floor(betAmount * numberOfPlayers * 0.8);
    const newCards: Card[] = [];
    
    for (let i = 1; i <= numberOfPlayers; i++) {
      newCards.push({
        id: i,
        betAmount,
        numberOfPlayers,
        prizePool,
        isSelected: false
      });
    }
    
    setCards(newCards);
    setSelectedCount(0);
  };

  const toggleCardSelection = (cardId: number) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isSelected: !card.isSelected } : card
    ));
  };

  useEffect(() => {
    setSelectedCount(cards.filter(card => card.isSelected).length);
  }, [cards]);

  const totalBetAmount = betAmount * selectedCount;
  const prizePool = Math.floor(betAmount * numberOfPlayers * 0.8);
  const allCardsSelected = selectedCount === numberOfPlayers;
  const canStartGame = allCardsSelected && user !== null && user.wallet >= totalBetAmount;

  const startGame = () => {
    if (!canStartGame || !user) return;
    
    const queryParams = new URLSearchParams({
      betAmount: betAmount.toString(),
      numberOfPlayers: numberOfPlayers.toString(),
      prizePool: prizePool.toString()
    });
    
    router.push(`/spinner/spinergame?${queryParams}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Spinner Lobby" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Spinner Lobby" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="text-gray-600 text-xl">Please login to continue</div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <MobileHeader title="Spinner Lobby" />

      <main className="px-4 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">
        {/* Welcome Section */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center w-full mb-6 pt-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Spinner Game</h2>
          <p className="text-gray-600">Select cards and start playing!</p>
        </motion.div> */}

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 w-full mb-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
            <div className="text-sm opacity-90">Selected</div>
            <div className="text-2xl font-bold">{selectedCount}/{numberOfPlayers}</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
            <div className="text-sm opacity-90">Prize Pool</div>
            <div className="text-2xl font-bold">{prizePool}Birr</div>
          </div>
        </motion.div>

        {/* Game Configuration - Single Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow-sm w-full mb-6"
        >
          {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Settings</h3> */}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">Bet Amount (Birr)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">Players</label>
              <input
                type="number"
                value={numberOfPlayers}
                onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="2"
                max="20"
              />
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="w-full mb-6"
        >
          {/* <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Cards</h3>
            <span className={`text-sm font-medium ${
              canStartGame ? 'text-green-600' : 'text-red-600'
            }`}>
              Wallet: ₹{user?.wallet || 0}
            </span>
          </div> */}

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCardSelection(card.id)}
                className={`aspect-square cursor-pointer transition-all duration-200 ${
                  card.isSelected 
                    ? 'ring-2 ring-yellow-400 bg-yellow-500 transform scale-105' 
                    : 'bg-white hover:bg-gray-100 border border-gray-300'
                } rounded-lg p-1 flex flex-col items-center justify-center`}
              >
                {/* Card ID */}
                <div className="text-xl sm:text-2xl text-gray-900 font-bold mb-1">
                  #{card.id}
                </div>

                {/* Bet Amount */}
                <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
                  {card.betAmount} Birr
                </div>

                {/* Prize Pool */}
                <div className="text-[10px] sm:text-xs md:text-sm text-green-600 font-bold text-center">
                  Win: {card.prizePool} Birr
                </div>
              </motion.div>

            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 w-full"
        >
          <button
            onClick={() => setCards(cards.map(card => ({ ...card, isSelected: false })))}
            disabled={selectedCount === 0}
            className={`px-6 py-3 rounded-lg transition-colors text-sm font-medium ${
              selectedCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Clear All
          </button>
          
          <button
            onClick={startGame}
            disabled={!canStartGame}
            className={`px-6 py-3 rounded-lg transition-colors text-sm font-medium ${
              canStartGame
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allCardsSelected ? `Start Game (₹${totalBetAmount})` : 'Select All Cards'}
          </button>
        </motion.div>

        {/* Game Info */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="bg-white p-4 rounded-lg shadow-sm w-full mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Play</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2 mt-1">1</div>
              <p>Set your bet amount and number of players</p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2 mt-1">2</div>
              <p>Select all cards to participate in the game</p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2 mt-1">3</div>
              <p>80% of the total bet amount goes to the prize pool</p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-2 mt-1">4</div>
              <p>One lucky winner takes the entire prize pool!</p>
            </div>
          </div>
        </motion.div> */}
      </main>

      <MobileNavigation />
    </div>
  );
}