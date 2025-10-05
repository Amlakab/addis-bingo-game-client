// =============================
// File: BetSelectionPage.tsx (FIXED CLIENT-SIDE TIMER)
// =============================
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Button,
  useTheme, useMediaQuery, Chip, LinearProgress, Skeleton
} from '@mui/material';
import { motion, Variants } from 'framer-motion';
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

// Define custom props interface for variants
interface CustomVariantProps {
  i: number;
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

  // Animation variants for cards
  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: ({ i }: CustomVariantProps) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }),
    hover: {
      scale: 1.03,
      y: -5,
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.98
    },
    statusChange: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  // Animation variants for status chip
  const statusVariants: Variants = {
    ready: {
      backgroundColor: "#e0e0e0",
      color: "#424242",
      scale: 1
    },
    active: {
      backgroundColor: "#4caf50",
      color: "#fff",
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    },
    "in-progress": {
      backgroundColor: "#f44336",
      color: "#fff",
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  };

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

    // Setup WebSocket listeners for timer updates
    webSocketService.on('timer-states-update', handleTimerStatesUpdate);
    
    // Request initial timer states
    webSocketService.send('get-timer-states');
    
    return () => {
      webSocketService.off('timer-states-update', handleTimerStatesUpdate);
    };
  }, [isClient, webSocketService]);

  // Handle server-side timer states update
  const handleTimerStatesUpdate = (timerStates: {[key: number]: BetStatus}) => {
    console.log('Received timer states update:', timerStates);
    setBetStatuses(prev => ({
      ...prev,
      ...timerStates
    }));
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
    if ((status.status === 'active' || status.status === 'ready') && status.createdAt) {
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

  // Calculate progress percentage for the progress bar
  const getProgressPercentage = (status: string, timer: number) => {
    if (status === 'ready') {
      return ((5 - timer) / 5) * 100;
    } else if (status === 'active') {
      return ((45 - timer) / 45) * 100;
    }
    return 0;
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
            
            // Only disable if status is in-progress OR insufficient balance (only after balance is loaded)
            const isDisabledByStatus = status.status === 'in-progress';
            const isDisabledByBalance = !isLoadingBalance && hasInsufficientBalance(bet);
            const isDisabled = isDisabledByStatus || isDisabledByBalance;
            const canPlay = status.status === 'active' && !isDisabledByBalance;
            
            return (
              <motion.div
                key={bet}
                custom={{ i: index }}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                style={{ 
                  width: isMobile ? 'calc(50% - 8px)' : 'calc(33.333% - 16px)', 
                  minWidth: 140,
                  maxWidth: 240
                }}
              >
                <motion.div
                  animate={status.status}
                  variants={{
                    ready: {},
                    active: {
                      scale: [1, 1.02, 1],
                      transition: {
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    },
                    "in-progress": {}
                  }}
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
                    }}
                  >
                    {/* Status Badge */}
                    <Box sx={{ position: 'absolute', top: -10, right: 10, zIndex: 1 }}>
                      <motion.div
                        animate={status.status}
                        variants={statusVariants}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'inline-block' }}
                      >
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
                      </motion.div>
                    </Box>

                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      {/* Bet Amount */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <Typography variant="h5" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 'bold', 
                          mb: 1.5,
                          fontSize: { xs: '1.5rem', sm: '1.75rem' }
                        }}>
                          {bet} {language === 'am' ? 'ብር' : 'Birr'}
                        </Typography>
                      </motion.div>
                      
                      {/* Players Count */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                      >
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
                      </motion.div>
                      
                      {/* Prize Pool */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
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
                      </motion.div>

                      {/* Progress Bar for Timer */}
                      {(status.status === 'ready' || status.status === 'active') && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
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
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                      >
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
                                  ? (language === 'am' ? "ይጫወቱ" : "Play") 
                                  : (language === 'am' ? "ዝግጁ" : "Ready"))
                          }
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </Box>

        {/* Footer */}
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