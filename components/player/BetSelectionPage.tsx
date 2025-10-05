// =============================
// File: BetSelectionPage.tsx (FRONTEND CALCULATION)
// =============================
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Button,
  useTheme, useMediaQuery, Chip, Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  SportsEsports, People, EmojiEvents, AccessTime,
  AccountBalanceWallet
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface BetSelectionPageProps {
  onPlay: (betAmount: number, timeRemaining: number, players: number, createdAt: Date) => void;
  language?: 'en' | 'am';
}

interface GameSession {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  status: string;
  createdAt: string;
}

interface BetStatus {
  timer: number;
  status: 'ready' | 'active' | 'in-progress';
  playerCount: number;
  prizePool: number;
  createdAt: Date | null;
}

interface UserData {
  _id: string;
  phone: string;
  role: string;
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Game {
  _id: string;
  betAmount: number;
  createdAt: string;
  updatedAt: string;
}

const BetSelectionPage = ({ 
  onPlay,
  language = 'en'
}: BetSelectionPageProps) => {
  const [betOptions, setBetOptions] = useState<number[]>([]);
  const [betStatuses, setBetStatuses] = useState<{[key: number]: BetStatus}>({});
  const [allSessions, setAllSessions] = useState<GameSession[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setIsClient(true);
    
    const loadWebSocketService = async () => {
      try {
        const wsModule = await import('@/app/utils/websocket');
        setWebSocketService(wsModule.webSocketService);
      } catch (error) {
        console.error('Failed to load WebSocket service:', error);
      }
    };
    
    loadWebSocketService();
  }, []);

  useEffect(() => {
    if (!isClient || !webSocketService) return;
    
    // Fetch games from database
    fetchGames();
    
    // Fetch user balance on component mount
    fetchUserBalance();

    // Setup WebSocket listeners
    const handleTimerStatesUpdate = (timerStates: {[key: number]: BetStatus}) => {
      console.log('Received timer states update:', timerStates);
      
      // Merge timer states with our calculated player counts and prize pools
      const updatedStatuses: {[key: number]: BetStatus} = {};
      
      Object.keys(timerStates).forEach(betAmountStr => {
        const betAmount = parseInt(betAmountStr);
        const serverState = timerStates[betAmount];
        
        // Calculate player count and prize pool locally
        const { playerCount, prizePool } = calculateBetStats(betAmount);
        
        updatedStatuses[betAmount] = {
          ...serverState,
          playerCount,
          prizePool
        };
      });
      
      setBetStatuses(updatedStatuses);
    };

    const handleSessionsUpdate = (sessions: GameSession[]) => {
      console.log('Received sessions update:', sessions);
      setAllSessions(sessions);
      
      // Recalculate all bet stats when sessions change
      recalculateAllBetStats(sessions);
    };

    webSocketService.on('timer-states-update', handleTimerStatesUpdate);
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    
    // Request initial data
    webSocketService.send('get-timer-states');
    webSocketService.send('get-sessions', {});

    return () => {
      webSocketService.off('timer-states-update', handleTimerStatesUpdate);
      webSocketService.off('sessions-updated', handleSessionsUpdate);
    };
  }, [isClient, webSocketService]);

  // Calculate player count and prize pool for a specific bet amount
  const calculateBetStats = (betAmount: number) => {
    const activeSessions = allSessions.filter(
      session => session.betAmount === betAmount && 
      ['active', 'ready', 'playing'].includes(session.status)
    );
    
    const playerCount = activeSessions.length;
    const prizePool = playerCount * betAmount * 0.8;
    
    return { playerCount, prizePool };
  };

  // Recalculate stats for all bet amounts
  const recalculateAllBetStats = (sessions: GameSession[]) => {
    const updatedStatuses: {[key: number]: BetStatus} = {};
    
    betOptions.forEach(betAmount => {
      const activeSessions = sessions.filter(
        session => session.betAmount === betAmount && 
        ['active', 'ready', 'playing'].includes(session.status)
      );
      
      const playerCount = activeSessions.length;
      const prizePool = playerCount * betAmount * 0.8;
      
      updatedStatuses[betAmount] = {
        ...(betStatuses[betAmount] || {
          timer: 5,
          status: 'ready',
          createdAt: null
        }),
        playerCount,
        prizePool
      };
    });
    
    setBetStatuses(updatedStatuses);
  };

  const fetchGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await api.get('/games');
      const games: Game[] = response.data.data;
      
      // Extract bet amounts and sort them in ascending order
      const betAmounts = games.map(game => game.betAmount).sort((a, b) => a - b);
      setBetOptions(betAmounts);
      
      // Initialize bet statuses with default values
      const initialStatuses: {[key: number]: BetStatus} = {};
      betAmounts.forEach(bet => {
        initialStatuses[bet] = {
          timer: 5,
          status: 'ready',
          playerCount: 0,
          prizePool: 0,
          createdAt: null
        };
      });
      setBetStatuses(initialStatuses);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchUserBalance = async () => {
    if (!isClient) return;
    
    try {
      setIsLoadingBalance(true);
      
      // Get user data from localStorage
      const userDataString = localStorage.getItem('user');
      
      if (!userDataString) {
        console.error('User data not found in localStorage');
        setIsLoadingBalance(false);
        return;
      }
      
      // Parse user data to get user ID
      const parsedUser: UserData = JSON.parse(userDataString);
      
      // Fetch latest user data from API
      const res = await api.get(`/user/${parsedUser._id}`);
      const userData: UserData = res.data.data;
      
      // Set user balance from database
      setUserBalance(userData.wallet);
      
    } catch (error) {
      console.error('Error fetching user balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handlePlayClick = (bet: number) => {
    const status = betStatuses[bet];
    if (status.status === 'active' && status.createdAt) {
      onPlay(bet, status.timer, status.playerCount, status.createdAt);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'default';
      case 'active': return 'success';
      case 'in-progress': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string, timer: number) => {
    if (language === 'am') {
      switch (status) {
        case 'ready': return `ዝግጁ ${timer}ሰ`;
        case 'active': return `ቀሪ ${timer}ሰ`;
        case 'in-progress': return 'በጨዋታ ውስጥ';
        default: return status;
      }
    } else {
      switch (status) {
        case 'ready': return `Ready ${timer}s`;
        case 'active': return `Active ${timer}s`;
        case 'in-progress': return 'In Progress';
        default: return status;
      }
    }
  };

  const getProgressPercentage = (status: string, timer: number) => {
    if (status === 'ready') {
      return Math.max(0, Math.min(100, ((5 - timer) / 5) * 100));
    } else if (status === 'active') {
      return Math.max(0, Math.min(100, ((45 - timer) / 45) * 100));
    }
    return 0;
  };

  const hasInsufficientBalance = (betAmount: number) => {
    return userBalance < betAmount;
  };

  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <Typography variant="h6">
          {language === 'am' ? "ጨዋታዎች በመጫን ላይ..." : "Loading games..."}
        </Typography>
      </Box>
    );
  }

  if (isLoadingGames) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <Typography variant="h6">
          {language === 'am' ? "ጨዋታዎች በመጫን ላይ..." : "Loading games..."}
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        minHeight: '40vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        p: { xs: 1.5, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* User Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            background: 'rgba(255, 255, 255, 0.8)', 
            borderRadius: 2, 
            p: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <AccountBalanceWallet sx={{ color: '#27ae60', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {language === 'am' ? "ተቀማጭ ገንዘብ:" : "Balance:"}
            </Typography>
            {isLoadingBalance ? (
              <Skeleton variant="text" width={60} sx={{ ml: 1, fontSize: '1rem' }} />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#27ae60', ml: 1 }}>
                {userBalance.toFixed(2)} {language === 'am' ? 'ብር' : 'Birr'}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Bet Cards Container */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 2, 
          maxWidth: 1000, 
          width: '100%' 
        }}>
          {betOptions.map((bet, index) => {
            const status = betStatuses[bet] || { 
              timer: 5, 
              status: 'ready', 
              playerCount: 0, 
              prizePool: 0,
              createdAt: null
            };
            
            const isDisabledByStatus = status.status === 'in-progress' || status.status === 'ready';
            const isDisabledByBalance = !isLoadingBalance && hasInsufficientBalance(bet);
            const isDisabled = isDisabledByStatus || isDisabledByBalance;
            const canPlay = status.status === 'active' && !isDisabledByBalance;
            
            return (
              <motion.div
                key={bet}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: canPlay ? 1.03 : 1, y: canPlay ? -5 : 0 }}
                whileTap={{ scale: canPlay ? 0.98 : 1 }}
                style={{ 
                  width: isMobile ? 'calc(50% - 8px)' : 'calc(33.333% - 16px)', 
                  minWidth: 140,
                  maxWidth: 240
                }}
              >
                <Card 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: canPlay ? '0 4px 14px rgba(0,0,0,0.15)' : '0 4px 14px rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    opacity: isDisabled ? 0.7 : 1,
                    position: 'relative',
                    overflow: 'visible',
                    border: canPlay ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    height: '100%',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Status Badge */}
                  <Box sx={{ position: 'absolute', top: -10, right: 10, zIndex: 1 }}>
                    <Chip
                      icon={<AccessTime />}
                      label={getStatusText(status.status, status.timer)}
                      color={getStatusColor(status.status)}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        backgroundColor: status.status === 'ready' ? '#e0e0e0' : 
                                        status.status === 'active' ? '#4caf50' : '#f44336',
                        color: status.status === 'ready' ? '#424242' : '#fff'
                      }}
                    />
                  </Box>

                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    {/* Bet Amount */}
                    <Typography variant="h5" sx={{ 
                      color: '#2c3e50', 
                      fontWeight: 'bold', 
                      mb: 1.5,
                      fontSize: { xs: '1.5rem', sm: '1.75rem' }
                    }}>
                      {bet} {language === 'am' ? 'ብር' : 'Birr'}
                    </Typography>
                    
                    {/* Players Count */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 1.5,
                      background: '#f8f9fa', 
                      borderRadius: 1.5, 
                      p: 1 
                    }}>
                      <People sx={{ color: '#3498db', mr: 0.5, fontSize: '1.2rem' }} />
                      <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '1rem' }}>
                        {status.playerCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7f8c8d', ml: 0.5, fontSize: '0.8rem' }}>
                        {language === 'am' ? "ተጫዋች" : "Players"}
                      </Typography>
                    </Box>
                    
                    {/* Prize Pool */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 2,
                      background: '#f8f9fa', 
                      borderRadius: 1.5, 
                      p: 1 
                    }}>
                      <EmojiEvents sx={{ color: '#f39c12', mr: 0.5, fontSize: '1.2rem' }} />
                      <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '1rem' }}>
                        {(status.prizePool || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7f8c8d', ml: 0.5, fontSize: '0.8rem' }}>
                        {language === 'am' ? "ደራሽ" : "Prize"}
                      </Typography>
                    </Box>

                    {/* Progress Bar for Timer */}
                    {(status.status === 'ready' || status.status === 'active') && (
                      <Box sx={{ position: 'relative', height: 6, mb: 1.5, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }}>
                        <Box
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            width: `${getProgressPercentage(status.status, status.timer)}%`,
                            background: status.status === 'ready' 
                              ? 'linear-gradient(90deg, #9e9e9e, #616161)' 
                              : 'linear-gradient(90deg, #4CAF50, #2E7D32)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      size="small"
                      disabled={isDisabled || isLoadingBalance}
                      onClick={() => handlePlayClick(bet)}
                      startIcon={!isDisabledByBalance && !isLoadingBalance && canPlay ? <SportsEsports /> : undefined}
                      sx={{
                        textTransform: 'none',
                        background: isLoadingBalance
                          ? 'linear-gradient(145deg, #bdc3c7, #95a5a6)'
                          : canPlay
                            ? 'linear-gradient(145deg, #3498db, #2980b9)'
                            : isDisabledByBalance
                              ? 'linear-gradient(145deg, #ff6b6b, #ee5a52)'
                              : 'linear-gradient(145deg, #bdc3c7, #95a5a6)',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: 1.5,
                        py: 0.7,
                        width: '100%',
                        fontSize: '0.9rem',
                        boxShadow: isLoadingBalance
                          ? '0 3px 6px rgba(0,0,0,0.1)'
                          : canPlay
                            ? '0 4px 8px rgba(52, 152, 219, 0.3)' 
                            : isDisabledByBalance
                              ? '0 3px 6px rgba(244, 67, 54, 0.3)'
                              : '0 3px 6px rgba(0,0,0,0.1)',
                        '&:hover': {
                          background: isLoadingBalance
                            ? 'linear-gradient(145deg, #bdc3c7, #95a5a6)'
                            : canPlay
                              ? 'linear-gradient(145deg, #2980b9, #2471a3)' 
                              : isDisabledByBalance
                                ? 'linear-gradient(145deg, #ee5a52, #d32f2f)'
                                : 'linear-gradient(145deg, #bdc3c7, #95a5a6)',
                          boxShadow: isLoadingBalance
                            ? '0 3px 6px rgba(0,0,0,0.1)'
                            : canPlay
                              ? '0 6px 12px rgba(52, 152, 219, 0.4)' 
                              : isDisabledByBalance
                                ? '0 4px 8px rgba(244, 67, 54, 0.4)'
                                : '0 3px 6px rgba(0,0,0,0.1)'
                        },
                        '&:disabled': {
                          background: isDisabledByBalance && !isLoadingBalance
                            ? 'linear-gradient(145deg, #ffcdd2, #ef9a9a)' 
                            : '#ecf0f1',
                          color: isDisabledByBalance && !isLoadingBalance ? '#d32f2f' : '#bdc3c7'
                        }
                      }}
                    >
                      {isLoadingBalance 
                        ? (language === 'am' ? "በመጫን ላይ..." : "Loading...")
                        : isDisabledByBalance 
                          ? (language === 'am' ? "ተቀማጭ አይበቃም" : "Low balance") 
                          : (status.status === 'active' 
                              ? (language === 'am' ? "ይጫወቱ" : "Play") 
                              : status.status === 'ready'
                                ? (language === 'am' ? "ዝግጁ" : "Ready")
                                : (language === 'am' ? "በጨዋታ ውስጥ" : "In Progress"))
                      }
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </Box>

        {/* Footer*/}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Typography variant="body2" sx={{ 
            mt: 3, 
            color: '#7f8c8d',
            textAlign: 'center',
            maxWidth: 500,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}>
            {language === 'am' 
              ? "ሁሉም ጨዋታዎች ፍትሃዊ የበጋ ስርዓት ይጠቀማሉ። አሸናፊዎች የሽልማት ማከማቻውን 80% ይቀበላሉ።"
              : "All games use a fair random system. Winners receive 80% of the prize pool."
            }
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default BetSelectionPage;