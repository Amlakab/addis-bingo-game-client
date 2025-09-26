// app/spinner/spinnerlobby/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
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
}

export default function SpinnerLobby() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [userWallet, setUserWallet] = useState(0);
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
        setUserWallet(userData.wallet || 0);
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
  const canStartGame = allCardsSelected && userWallet >= totalBetAmount;

  const startGame = () => {
    if (!canStartGame || !user) return;
    
    const selectedNumbers = cards.filter(card => card.isSelected).map(card => card.id);
    
    const queryParams = new URLSearchParams({
      betAmount: betAmount.toString(),
      numberOfPlayers: numberOfPlayers.toString(),
      prizePool: prizePool.toString()
    });
    
    router.push(`/spinner/spinergame?${queryParams}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-xl">Please login to continue</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="text-gray-800">
            <div className="text-sm opacity-80">Welcome</div>
            <div className="font-bold">{user.phone}</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
              ₹{userWallet}
            </div>
            
            <Link href="/spinner/cart" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Spinner Game Lobby</h1>
          <div className="flex justify-center gap-4 text-gray-700 flex-wrap">
            <div className="bg-blue-100 px-4 py-2 rounded-lg">Selected: {selectedCount}/{numberOfPlayers}</div>
            <div className="bg-green-100 px-4 py-2 rounded-lg">Prize Pool: ₹{prizePool}</div>
            <div className={`px-4 py-2 rounded-lg ${canStartGame ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Wallet: ₹{userWallet}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">Number of Players</label>
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
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-2 mb-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => toggleCardSelection(card.id)}
              className={`aspect-square cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                card.isSelected 
                  ? 'ring-2 ring-yellow-400 bg-yellow-500' 
                  : 'bg-white hover:bg-gray-100 border border-gray-300'
              } rounded-lg p-1 flex flex-col items-center justify-center`}
            >
              <div className="text-xs text-gray-800 font-bold mb-1">#{card.id}</div>
              <div className="text-[8px] text-gray-600 text-center">₹{card.betAmount}</div>
              <div className="text-[6px] text-green-600 font-bold text-center">Win: ₹{card.prizePool}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
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
        </div>
      </div>
    </div>
  );
}