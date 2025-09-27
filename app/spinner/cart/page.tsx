// app/spinner/cart/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface UserType {
  _id: string;
  phone: string;
  role: 'user' | 'disk-user' | 'spinner-user' | 'agent' | 'admin';
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SpinnerCart() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadGameHistory();
    }
  }, [user]);

  const fetchUser = async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const loadGameHistory = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/spinner/game/history/user/${user._id}`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading game history:', error);
    }
  };

  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(history.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/spinner/spinnerlobby"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Game
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">My Cart & Earnings</h1>
          <div className="w-20"></div>
        </div>

        {/* User Information */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{user.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6 text-gray-800 border border-green-200">
            <div className="text-sm text-gray-600">Total Earnings</div>
            <div className="text-3xl font-bold text-gray-900">₹{user.totalEarnings || 0}</div>
            <div className="text-xs text-gray-500 mt-2">Lifetime earnings</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-6 text-gray-800 border border-blue-200">
            <div className="text-sm text-gray-600">Today's Earnings</div>
            <div className="text-3xl font-bold text-gray-900">₹{user.dailyEarnings || 0}</div>
            <div className="text-xs text-gray-500 mt-2">Resets daily</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-6 text-gray-800 border border-purple-200">
            <div className="text-sm text-gray-600">Weekly Earnings</div>
            <div className="text-3xl font-bold text-gray-900">₹{user.weeklyEarnings || 0}</div>
            <div className="text-xs text-gray-500 mt-2">Resets weekly</div>
          </div>
        </div>

        {/* Game History */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Game History</h2>
          
          {paginatedHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No game history yet. Play some games to see your earnings!
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedHistory.map((item) => (
                  <div key={item._id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-gray-800 font-bold">Winner: #{item.winnerCard}</div>
                        <div className="text-gray-600 text-sm">
                          Bet: ₹{item.betAmount} | Players: {item.numberOfPlayers}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">+₹{Math.floor(item.prizePool * 0.2)}</div>
                        <div className="text-gray-600 text-sm">Prize: ₹{item.prizePool}</div>
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
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
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
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Current Balance */}
        <div className="bg-yellow-100 rounded-xl p-6 text-center mt-6 border border-yellow-200">
          <div className="text-gray-700 text-sm">Current Wallet Balance</div>
          <div className="text-2xl font-bold text-gray-900">₹{user.wallet || 0}</div>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-4">
          <button
            onClick={fetchUser}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}