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
  const [spinDuration, setSpinDuration] = useState(0);

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

  // Smooth spinner logic with full rotations and 10-20 second duration
  const spinWheel = useCallback(() => {
    if (isSpinning || !user || numberOfPlayers === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);

    const segmentAngle = 360 / numberOfPlayers;
    
    // Random target segment (1 to numberOfPlayers)
    const targetSegment = Math.floor(Math.random() * numberOfPlayers) + 1;
    
    // Calculate the angle for the target segment (center of the segment)
    const targetAngle = (targetSegment - 1) * segmentAngle + segmentAngle / 2;
    
    // Random number of full rotations (15-25 rotations for longer duration)
    const fullRotations = 15 + Math.floor(Math.random() * 11); // 15-25 rotations
    
    // Random duration between 10-20 seconds
    const totalDuration = 10000 + Math.random() * 10000; // 10,000 to 20,000 ms
    
    // Calculate final rotation to land on target segment after all rotations
    const finalRotation = fullRotations * 360 + (360 - targetAngle);
    
    setSpinDuration(Math.round(totalDuration / 1000));

    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ultra-smooth easing function for continuous deceleration
      const smoothEaseOut = 1 - Math.pow(1 - progress, 3);

      // Calculate current rotation - always moving forward, always slowing down
      const currentRotation = startRotation + (finalRotation * smoothEaseOut);
      
      setRotation(currentRotation);

      // Determine current position based on arrow (top = 0 deg)
      const normalizedRotation = currentRotation % 360;
      const normalized = (360 - normalizedRotation) % 360;
      const winnerIndex = Math.floor(normalized / segmentAngle);
      const newPosition = (winnerIndex % numberOfPlayers) + 1;
      setCurrentPosition(newPosition);

      if (progress < 1) {
        // Continue animation
        requestAnimationFrame(animate);
      } else {
        // Final position calculation
        const finalNormalized = (360 - (currentRotation % 360)) % 360;
        const finalWinnerIndex = Math.floor(finalNormalized / segmentAngle);
        const finalWinner = (finalWinnerIndex % numberOfPlayers) + 1;
        
        console.log('Target Segment:', targetSegment, 'Actual Winner:', finalWinner, 'Rotations:', fullRotations, 'Duration:', Math.round(totalDuration/1000) + 's');
        
        setWinner(finalWinner);
        setCurrentPosition(finalWinner);
        saveGameHistory(finalWinner);
        setIsSpinning(false);
        setTimeout(() => setShowWinnerModal(true), 1000);
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, user, numberOfPlayers, rotation]);

  const saveGameHistory = async (winnerNumber: number) => {
    if (!user) return;
    const selectedNumbers = numberOfPlayers;
    setIsLoading(true);
    try {
      const historyResponse = await api.post('/spinner/history', {
        winnerNumber,
        prizePool,
        numberOfPlayers,
        betAmount,
        selectedNumbers
      });

      if (historyResponse.data) {
        // await api.put('/user/minus-wallet', {
        //   userId: user._id,
        //   amount: earnings,
        // });

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
        <div className="mb-6 flex justify-center">
          <div className="bg-yellow-500 rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-lg border-4 border-white">
            <div className="text-white text-xs font-bold">Prize Pool</div>
            <div className="text-white text-lg font-bold">{prizePool}Birr</div>
          </div>
        </div>

        {/* Improved Arrow pointing to spinner */}
        <div className="relative mb-4 flex justify-center">
          <div className="flex flex-col items-center">
            {/* Current Position Display above arrow */}
            <div className="mb-2 bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white z-20">
              <span className="font-bold text-lg">{currentPosition}</span>
            </div>
            
            {/* Enhanced Arrow pointing DOWN to spinner */}
            <div className="flex flex-col items-center relative">
              {/* Arrow shaft pointing down - tapered design */}
              <div className="relative">
                {/* Thick base */}
                <div className="w-2 h-16 bg-red-600 relative mx-auto"></div>
                {/* Tapered tip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-8 border-l-transparent border-r-transparent border-t-red-600"></div>
                {/* Thin arrow line extending to spinner */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-red-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Spinner */}
        <div className="relative mb-8 flex justify-center -mt-8">
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

        {/* Game Info with Spin Duration */}
        {/* <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs">Bet Amount</div>
            <div className="text-yellow-600 text-lg font-bold">₹{betAmount}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs">Players</div>
            <div className="text-blue-600 text-lg font-bold">{numberOfPlayers}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs">Spin Duration</div>
            <div className="text-green-600 text-lg font-bold">{spinDuration}s</div>
          </div>
        </div> */}

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
          {isSpinning ? `Spinning... (${spinDuration}s)` : 'Spin Wheel'}
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
                    <span className="font-bold">{prizePool}Birr</span>
                  </div>
                  {/* <div className="flex justify-between text-gray-600">
                    <span>Your Earnings:</span>
                    <span className="font-bold text-green-600">+₹{earnings}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Spin Duration:</span>
                    <span className="font-bold">{spinDuration} seconds</span>
                  </div> */}
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