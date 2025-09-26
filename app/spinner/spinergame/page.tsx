// app/spinner/spinergame/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

interface UserType {
  _id: string;
  phone: string;
  wallet: number;
}

export default function SpinnerGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [userWallet, setUserWallet] = useState(0);
  const [loading, setLoading] = useState(true);

  const [betAmount, setBetAmount] = useState(0);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);
  const [prizePool, setPrizePool] = useState(0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rotation, setRotation] = useState(0);

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
        const userData: UserType = response.data;
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

    // Get parameters from URL
    const betAmount = Number(searchParams.get('betAmount'));
    const numberOfPlayers = Number(searchParams.get('numberOfPlayers'));
    const prizePool = Number(searchParams.get('prizePool'));

    if (betAmount && numberOfPlayers && prizePool) {
      setBetAmount(betAmount);
      setNumberOfPlayers(numberOfPlayers);
      setPrizePool(prizePool);
      setCurrentPosition(1);
    }
  }, [router, searchParams]);

  const earnings = Math.floor(prizePool * 0.2);

  // Spinner logic with fast-then-slow spin
  const spinWheel = useCallback(() => {
    if (isSpinning || !user || numberOfPlayers === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const segmentAngle = 360 / numberOfPlayers;
    const rotations = 3 + Math.random() * 5; // 3-8 full rotations
    const finalRotation = rotations * 360 + Math.random() * 360;
    const duration = 4000 + Math.random() * 4000; // 4-8s duration
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth fast-to-slow easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + finalRotation * easeOut;
      setRotation(currentRotation);

      // Determine current position based on arrow (top = 0 deg)
      const normalized = (360 - (currentRotation % 360)) % 360;
      const winnerIndex = Math.floor(normalized / segmentAngle);
      setCurrentPosition(winnerIndex + 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setWinner(winnerIndex + 1);
        saveGameHistory(winnerIndex + 1);
        setIsSpinning(false);
        setTimeout(() => setShowWinnerModal(true), 1000);
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, user, numberOfPlayers, rotation]);

  const saveGameHistory = async (winnerNumber: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const historyResponse = await api.post('/game/history', {
        winnerId: user._id,
        winnerCard: winnerNumber,
        prizePool,
        numberOfPlayers,
        betAmount,
      });

      if (historyResponse.data) {
        await api.put('/user/minus-wallet', {
          userId: user._id,
          amount: earnings,
        });

        const response = await api.get(`/user/${user._id}`);
        const userData: UserType = response.data;
        setUser(userData);
        setUserWallet(userData.wallet || 0);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('Failed to save game history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColor = (index: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0984E3', '#A29BFE', '#FD79A8'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-xl">Loading game...</div>
      </div>
    );
  }

  if (!user || numberOfPlayers === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-xl">Game data not available</div>
      </div>
    );
  }

  const spinnerSize = 300;
  const segmentAngle = 360 / numberOfPlayers;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Prize Pool */}
        <div className="mb-4 flex justify-center">
          <div className="bg-yellow-500 rounded-full w-24 h-24 flex items-center justify-center shadow-lg border-4 border-white">
            <div className="text-white text-xs font-bold">Prize Pool</div>
            <div className="text-white text-lg font-bold">₹{prizePool}</div>
          </div>
        </div>

        {/* Arrow at top */}
        <div className="relative mb-2 flex justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-20 border-l-transparent border-r-transparent border-b-red-600 z-20"></div>
        </div>

        {/* Spinner */}
        <div className="relative mb-8 flex justify-center">
          <div
            className="relative rounded-full shadow-lg border-4 border-gray-300 overflow-hidden"
            style={{
              width: `${spinnerSize}px`,
              height: `${spinnerSize}px`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            >
              {Array.from({ length: numberOfPlayers }).map((_, index) => {
                const angle = segmentAngle * index;
                const cardNumber = index + 1;
                const isActive = currentPosition === cardNumber;

                return (
                  <div
                    key={index}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'center',
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    <div
                      className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                      style={{
                        backgroundColor: getColor(index),
                        clipPath: 'polygon(100% 50%, 0% 0%, 0% 100%)',
                      }}
                    >
                      <div
                        className="absolute text-white font-bold"
                        style={{
                          top: '50%',
                          left: '30%',
                          transform: 'translate(-50%, -50%) rotate(90deg)',
                          fontSize: '18px',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {cardNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-800 rounded-full border-4 border-white z-10"></div>
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs">Bet Amount</div>
            <div className="text-yellow-600 text-lg font-bold">₹{betAmount}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs">Players</div>
            <div className="text-blue-600 text-lg font-bold">{numberOfPlayers}</div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning || isLoading}
          className={`w-full max-w-md py-4 text-lg rounded-full font-bold transition-all shadow-lg mb-8 ${
            isSpinning || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isSpinning ? 'Spinning...' : 'Spin Wheel'}
        </button>

        {/* Winner Modal */}
        {showWinnerModal && winner && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-black/50"></div>

            <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative z-10">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">Winner!</h2>
                <div className="text-6xl font-bold text-blue-600 mb-4">{winner}</div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Prize Pool:</span>
                    <span className="font-bold">₹{prizePool}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Your Earnings:</span>
                    <span className="font-bold text-green-600">+₹{earnings}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/spinner/spinnerlobby')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
