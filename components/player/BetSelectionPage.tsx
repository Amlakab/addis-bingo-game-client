'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Button,
  useTheme, useMediaQuery, Chip, LinearProgress, Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  SportsEsports, People, EmojiEvents, AccessTime,
  Casino, AccountBalanceWallet
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
  status: 'ready' | 'countdown' | 'active' | 'in-progress';
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
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import WebSocket service only on client side
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
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    
    return () => {
      webSocketService.off('sessions-updated', handleSessionsUpdate);
    };
  }, [isClient, webSocketService]);

  useEffect(() => {
    if (!isClient || !webSocketService || betOptions.length === 0) return;
    
    // Initialize bet statuses
    const initialStatuses: {[key: number]: BetStatus} = {};
    betOptions.forEach(bet => {
      initialStatuses[bet] = {
        timer: 5, // Start with 5s ready period
        status: 'ready',
        playerCount: 0,
        prizePool: 0,
        createdAt: null
      };
    });
    
    setBetStatuses(initialStatuses);
    
    // Set up timers for each bet
    const timerIntervals: NodeJS.Timeout[] = [];
    
    betOptions.forEach(bet => {
      const interval = setInterval(() => {
        setBetStatuses(prev => {
          const currentStatus = prev[bet];
          
          if (currentStatus.status === 'ready') {
            const newTime = currentStatus.timer - 1;
            
            if (newTime <= 0) {
              // Transition from ready to active (start 45s countdown)
              return { 
                ...prev, 
                [bet]: { 
                  ...currentStatus, 
                  timer: 45, 
                  status: 'active',
                  createdAt: new Date() // Set the creation time when active starts
                } 
              };
            }
            
            return { 
              ...prev, 
              [bet]: { 
                ...currentStatus, 
                timer: newTime 
              } 
            };
          }
          
          if (currentStatus.status === 'active') {
            const newTime = currentStatus.timer - 1;
            
            if (newTime <= 0) {
              // Transition from active back to ready (5s)
              return { 
                ...prev, 
                [bet]: { 
                  ...currentStatus, 
                  timer: 5, 
                  status: 'ready',
                  createdAt: null
                } 
              };
            }
            
            return { 
              ...prev, 
              [bet]: { 
                ...currentStatus, 
                timer: newTime 
              } 
            };
          }
          
          // in-progress state - no timer changes
          return { ...prev };
        });
      }, 1000);
      
      timerIntervals.push(interval);
    });

    // Request initial session data for all bet amounts
    betOptions.forEach(bet => {
      webSocketService.send('get-sessions', { betAmount: bet });
    });

    return () => {
      timerIntervals.forEach(interval => clearInterval(interval));
    };
  }, [isClient, webSocketService, betOptions]);

const handleSessionsUpdate = (sessions: GameSession[]) => {
  // Group sessions by bet amount
  const sessionsByBet: {[key: number]: GameSession[]} = {};
  
  sessions.forEach(session => {
    if (!sessionsByBet[session.betAmount]) {
      sessionsByBet[session.betAmount] = [];
    }
    sessionsByBet[session.betAmount].push(session);
  });
  
  // Update bet statuses for each bet amount
  setBetStatuses(prev => {
    const updatedStatuses = { ...prev };
    
    Object.keys(sessionsByBet).forEach(betAmountStr => {
      const betAmount = parseInt(betAmountStr);
      const sessions = sessionsByBet[betAmount];
      
      if (updatedStatuses[betAmount]) {
        const activePlayers = sessions.filter(session => session.status === 'active').length;
        const gameInProgress = sessions.some(session => session.status === 'playing');
        const prizePool = activePlayers * betAmount * 0.8;
        
        // If there are active sessions, calculate the correct timer based on createdAt
        let timer = updatedStatuses[betAmount].timer;
        let createdAt = updatedStatuses[betAmount].createdAt;
        
        if (activePlayers > 0 && sessions.length > 0) {
          // Find the earliest createdAt time among active sessions
          const earliestSession = sessions
            .filter(session => session.status === 'active')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          
          if (earliestSession) {
            const sessionStartTime = new Date(earliestSession.createdAt).getTime();
            // Get current time in UTC to match server time format
            const currentTime = new Date().toISOString();
            const currentTimeUTC = new Date(currentTime).getTime();
            const elapsedSeconds = Math.floor((currentTimeUTC - sessionStartTime) / 1000);
            const remainingTime = Math.max(0, 45 - elapsedSeconds);
            
            timer = remainingTime;
            createdAt = new Date(earliestSession.createdAt);
          }
        }
        
        // Update player count, prize pool, and status
        updatedStatuses[betAmount] = {
          ...updatedStatuses[betAmount],
          timer,
          createdAt,
          playerCount: activePlayers,
          prizePool: prizePool,
          status: gameInProgress ? 'in-progress' : (activePlayers > 0 ? 'active' : updatedStatuses[betAmount].status)
        };
      }
    });
    
    return updatedStatuses;
  });
};

  const fetchGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await api.get('/games');
      const games: Game[] = response.data.data;
      
      // Extract bet amounts and sort them in ascending order
      const betAmounts = games.map(game => game.betAmount).sort((a, b) => a - b);
      setBetOptions(betAmounts);
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
        case 'ready': return `ዝግጁ ${timer}s`;
        case 'active': return `ቀሪ ${timer}s`;
        case 'in-progress': return 'በጨዋታ ውስጥ';
        default: return status;
      }
    } else {
      switch (status) {
        case 'ready': return `Ready ${timer}s`;
        case 'active': return `Active ${timer}s left`;
        case 'in-progress': return 'In Progress';
        default: return status;
      }
    }
  };

  // Check if user has insufficient balance for a bet
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
        {/* Header */}
        {/* <Box sx={{ textAlign: 'center', mb: 3, color: '#2c3e50' }}>
          <Casino sx={{ 
            fontSize: 50, 
            mb: 1.5, 
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            color: '#3498db'
          }} />
          {/* <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2.125rem' }
          }}>
            {language === 'am' ? "የጨዋታ ምድብ" : "Game Lobby"}
          </Typography> */}
          {/* <Typography variant="body1" sx={{ 
            opacity: 0.8, 
            fontSize: { xs: '0.9rem', sm: '1rem' },
            color: '#7f8c8d'
          }}>
            {language === 'am' ? "ውርርድ መጠን ይምረጡ" : "Select your bet amount"}
          </Typography> 
         </Box> */}

        {/* User Balance Display */}
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

        {/* Bet Cards Container */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 2, 
          maxWidth: 1000, 
          width: '100%' 
        }}>
          {betOptions.map((bet) => {
            const status = betStatuses[bet] || { 
              timer: 5, 
              status: 'ready', 
              playerCount: 0, 
              prizePool: 0,
              createdAt: null
            };
            
            // Only disable if status is in-progress OR insufficient balance (only after balance is loaded)
            const isDisabledByStatus = status.status === 'in-progress';
            const isDisabledByBalance = !isLoadingBalance && hasInsufficientBalance(bet);
            const isDisabled = isDisabledByStatus || isDisabledByBalance;
            const canPlay = status.status === 'active' && !isDisabledByBalance;
            
            return (
              <Box key={bet} sx={{ 
                width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 16px)', md: 'calc(25% - 16px)' },
                minWidth: 140,
                maxWidth: 240
              }}>
                <motion.div
                  whileHover={{ scale: !isDisabled ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      background: '#ffffff',
                      opacity: isDisabledByStatus ? 0.7 : 1,
                      position: 'relative',
                      overflow: 'visible',
                      border: `1px solid ${isDisabled ? '#e0e0e0' : '#e0e0e0'}`,
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: !isDisabled ? '0 6px 20px rgba(0,0,0,0.12)' : '0 4px 14px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    {/* Status Badge */}
                    <Box sx={{ position: 'absolute', top: -10, right: 10 }}>
                      <Chip
                        icon={<AccessTime />}
                        label={getStatusText(status.status, status.timer)}
                        color={getStatusColor(status.status)}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }
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
                        <LinearProgress 
                          variant="determinate" 
                          value={(status.timer / (status.status === 'ready' ? 5 : 45)) * 100}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3, 
                            mb: 1.5,
                            background: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: status.status === 'ready' 
                                ? 'linear-gradient(90deg, #9e9e9e, #616161)' 
                                : 'linear-gradient(90deg, #4CAF50, #2E7D32)',
                              borderRadius: 3
                            }
                          }}
                        />
                      )}

                      <Button
                        variant="contained"
                        size="small"
                        disabled={isDisabled || isLoadingBalance}
                        onClick={() => handlePlayClick(bet)}
                        startIcon={!isDisabledByBalance && !isLoadingBalance ? <SportsEsports /> : undefined}
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
                                ? (language === 'am' ? "ጨዋታ ይጫወቱ" : "Play") 
                                : (language === 'am' ? "ዝግጁ" : "Ready"))
                        }
                      </Button>

                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            );
          })}
        </Box>

        {/* Footer */}
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
      </Box>
    </motion.div>
  );
};

export default BetSelectionPage;