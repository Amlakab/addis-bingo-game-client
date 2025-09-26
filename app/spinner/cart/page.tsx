// app/spinner/cart/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

interface GameHistory {
  _id: string;
  winnerCard: number;
  prizePool: number;
  betAmount: number;
  numberOfPlayers: number;
  createdAt: string;
  winnerId: {
    phone: string;
  };
}

export default function SpinnerCart() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadGameHistory();
  }, [router, user]);

  const loadGameHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/spinner/game/history/user/${user._id}`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEarnings = (type: 'total' | 'daily' | 'weekly') => {
    const now = new Date();
    const filteredHistory = history.filter(item => {
      const itemDate = new Date(item.createdAt);
      switch (type) {
        case 'daily':
          return itemDate.toDateString() === now.toDateString();
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          return itemDate >= weekAgo;
        case 'total':
        default:
          return true;
      }
    });
    
    return filteredHistory.reduce((sum, item) => sum + Math.floor(item.prizePool * 0.2), 0);
  };

  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(history.length / itemsPerPage);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/spinner/spinnerlobby"
            className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            ← Back to Game
          </Link>
          <h1 className="text-2xl font-bold text-white">My Cart & Earnings</h1>
          <div className="w-20"></div>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="text-sm opacity-90">Total Earnings</div>
            <div className="text-3xl font-bold">₹{calculateEarnings('total')}</div>
            <div className="text-xs opacity-80 mt-2">20% of all winnings</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="text-sm opacity-90">Today's Earnings</div>
            <div className="text-3xl font-bold">₹{calculateEarnings('daily')}</div>
            <div className="text-xs opacity-80 mt-2">Updated daily</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="text-sm opacity-90">Weekly Earnings</div>
            <div className="text-3xl font-bold">₹{calculateEarnings('weekly')}</div>
            <div className="text-xs opacity-80 mt-2">Last 7 days</div>
          </div>
        </div>

        {/* Game History */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Game History</h2>
          
          {isLoading ? (
            <div className="text-center text-white py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="text-center text-white/70 py-8">
              No game history yet. Play some games to see your earnings!
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedHistory.map((item) => (
                  <div key={item._id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">Winner: #{item.winnerCard}</div>
                        <div className="text-white/70 text-sm">
                          Bet: ₹{item.betAmount} | Players: {item.numberOfPlayers}
                        </div>
                        <div className="text-white/70 text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">+₹{Math.floor(item.prizePool * 0.2)}</div>
                        <div className="text-white/70 text-sm">Prize: ₹{item.prizePool}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-white/10 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-white/10 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Current Balance */}
        <div className="bg-yellow-500 rounded-2xl p-6 text-center mt-6">
          <div className="text-white text-sm">Current Wallet Balance</div>
          <div className="text-2xl font-bold text-white">₹{user.wallet || 0}</div>
        </div>
      </div>
    </div>
  );
}