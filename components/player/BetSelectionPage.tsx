'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Card, CardContent, Button,
  useTheme, useMediaQuery, Chip, Skeleton, Tooltip, IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  SportsEsports, People, EmojiEvents, AccessTime,
  AccountBalanceWallet, ColorLens
} from '@mui/icons-material';
import api from '@/app/utils/api';
import HowToPlayModal from '@/components/player/HowToPlayModal';

interface BetSelectionPageProps {
  onPlay: (betAmount: number, timeRemaining: number, players: number, createdAt: Date) => void;
  language?: 'en' | 'am';
  backgroundColor?: string;
  setBackgroundColor?: (color: string) => void;
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
  language = 'am',
  backgroundColor = 'white',
  setBackgroundColor
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

  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  
  // Track which bets have been reset to avoid multiple calls
  const resetTrackerRef = useRef<{[key: number]: boolean}>({});

  // NEW: Color helper functions (matching offline code)
  const getTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  const getCardBackground = () => {
    switch(backgroundColor) {
      case 'black': return 'rgba(50, 50, 50, 0.9)';
      case 'green': return 'rgba(30, 70, 30, 0.9)';
      case 'blue': return 'rgba(30, 50, 80, 0.9)';
      case 'yellow': return 'rgba(240, 230, 140, 0.9)';
      default: return 'rgba(255, 255, 255, 0.8)';
    }
  };

  const getButtonVariant = () => {
    switch(backgroundColor) {
      case 'black': return 'outlined';
      case 'green': return 'outlined';
      case 'blue': return 'outlined';
      case 'yellow': return 'outlined';
      default: return 'contained';
    }
  };

  const getButtonColor = () => {
    switch(backgroundColor) {
      case 'black': return 'primary';
      case 'green': return 'success';
      case 'blue': return 'info';
      case 'yellow': return 'warning';
      default: return 'primary';
    }
  };

  const getSelectBackground = () => {
    switch(backgroundColor) {
      case 'black': return '#333';
      case 'green': return '#2e7d32';
      case 'blue': return '#1976d2';
      case 'yellow': return '#ffeb3b';
      default: return '#fff';
    }
  };

  const getSelectTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  const getButtonStyle = () => {
    const textColor = getTextColor();
    const buttonVariant = getButtonVariant();
    
    if (buttonVariant === 'outlined') {
      return {
        borderColor: textColor,
        color: textColor,
        '&:hover': {
          borderColor: textColor,
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }
      };
    }
    return {};
  };

  // NEW: Handle background color change with event dispatch
  const handleBackgroundColorChange = (color: string) => {
    if (setBackgroundColor) {
      setBackgroundColor(color);
    }
    localStorage.setItem('bingoBgColor', color);
    
    // Dispatch custom event for other components to listen
    const event = new CustomEvent('bgColorChange', { 
      detail: { color } 
    });
    window.dispatchEvent(event);
  };

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
    
    fetchGames();
    fetchUserBalance();

    const handleTimerStatesUpdate = (timerStates: {[key: number]: BetStatus}) => {
      console.log('Received timer states update:', timerStates);
      setBetStatuses(timerStates);
    };

    webSocketService.on('timer-states-update', handleTimerStatesUpdate);
    webSocketService.send('get-timer-states');

    return () => {
      webSocketService.off('timer-states-update', handleTimerStatesUpdate);
    };
  }, [isClient, webSocketService]);

  useEffect(() => {
    if (!isClient || !webSocketService) return;

    Object.entries(betStatuses).forEach(([betAmount, status]) => {
      const bet = Number(betAmount);
      
      if (status.status === 'active' && status.timer === 45) {
        if (!resetTrackerRef.current[bet]) {
          console.log(`🔄 Auto-resetting game at 45 seconds for bet ${bet}`);
          webSocketService.send('reset-game', { betAmount: bet });
          resetTrackerRef.current[bet] = true;
          
          setTimeout(() => {
            resetTrackerRef.current[bet] = false;
          }, 2000);
        }
      }
      
      if (status.status === 'ready') {
        resetTrackerRef.current[bet] = false;
      }
    });
  }, [betStatuses, isClient, webSocketService]);

  const fetchGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await api.get('/games');
      const games: Game[] = response.data.data;
      
      const betAmounts = games.map(game => game.betAmount).sort((a, b) => a - b);
      setBetOptions(betAmounts);
      
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
      
      const userDataString = localStorage.getItem('user');
      
      if (!userDataString) {
        console.error('User data not found in localStorage');
        setIsLoadingBalance(false);
        return;
      }
      
      const parsedUser: UserData = JSON.parse(userDataString);
      const res = await api.get(`/user/${parsedUser._id}`);
      const userData: UserData = res.data.data;
      
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

  // FIXED: Loading state with background color
  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: backgroundColor === 'white' 
          ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          : backgroundColor,
        color: getTextColor()
      }}>
        <Typography variant="h6" sx={{ color: getTextColor() }}>
          {language === 'am' ? "ጨዋታዎች በመጫን ላይ..." : "Loading games..."}
        </Typography>
      </Box>
    );
  }

  // FIXED: Loading games state with background color
  if (isLoadingGames) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: backgroundColor === 'white' 
          ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          : backgroundColor,
        color: getTextColor()
      }}>
        <Typography variant="h6" sx={{ color: getTextColor() }}>
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
        background: backgroundColor === 'white' 
          ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          : backgroundColor,
        p: { xs: 1.5, sm: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: getTextColor()
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
            background: getCardBackground(), 
            borderRadius: 2, 
            p: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: getTextColor()
          }}>
            <AccountBalanceWallet sx={{ color: '#27ae60', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: getTextColor() }}>
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
                    background: getCardBackground(),
                    opacity: isDisabled ? 0.7 : 1,
                    position: 'relative',
                    overflow: 'visible',
                    border: canPlay ? '2px solid #4caf50' : `1px solid ${getTextColor()}30`,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    color: getTextColor()
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
                      color: getTextColor(), 
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
                      background: 'rgba(0,0,0,0.05)', 
                      borderRadius: 1.5, 
                      p: 1 
                    }}>
                      <People sx={{ color: '#3498db', mr: 0.5, fontSize: '1.2rem' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem', color: getTextColor() }}>
                        {status.playerCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 0.5, fontSize: '0.8rem', opacity: 0.7, color: getTextColor() }}>
                        {language === 'am' ? "ተጫዋች" : "Players"}
                      </Typography>
                    </Box>
                    
                    {/* Prize Pool */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 2,
                      background: 'rgba(0,0,0,0.05)', 
                      borderRadius: 1.5, 
                      p: 1 
                    }}>
                      <EmojiEvents sx={{ color: '#f39c12', mr: 0.5, fontSize: '1.2rem' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem', color: getTextColor() }}>
                        {(status.prizePool || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 0.5, fontSize: '0.8rem', opacity: 0.7, color: getTextColor() }}>
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
                      variant={getButtonVariant()}
                      color={getButtonColor()}
                      size="small"
                      disabled={isDisabled || isLoadingBalance}
                      onClick={() => handlePlayClick(bet)}
                      startIcon={!isDisabledByBalance && !isLoadingBalance && canPlay ? <SportsEsports /> : undefined}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        borderRadius: 1.5,
                        py: 0.7,
                        width: '100%',
                        fontSize: '0.9rem',
                        ...getButtonStyle(),
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

        {/* Footer with How to Play and Background Color */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Typography variant="body2" sx={{ 
            mt: 3, 
            textAlign: 'center',
            maxWidth: 500,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            opacity: 0.8,
            color: getTextColor()
          }}>
            {language === 'am' 
              ? "ሁሉም ጨዋታዎች ፍትሃዊ የበጋ ስርዓት ይጠቀማሉ። አሸናፊዎች የሽልማት ማከማቻውን 80% ይቀበላሉ።"
              : "All games use a fair random system. Winners receive 80% of the prize pool."
            }
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={() => setHowToPlayOpen(true)}
              variant={getButtonVariant()}
              color={getButtonColor()}
              sx={{
                fontWeight: 'bold',
                borderRadius: 2,
                px: 3,
                py: 1,
                ...getButtonStyle()
              }}
            >
              {language === 'am' ? 'እንዴት መጫወት እንደሚቻል' : 'How to Play'}
            </Button>
            
            {/* Background Color Selection */}
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              alignItems: 'center',
              background: getCardBackground(),
              borderRadius: 2,
              px: 1,
              py: 0.5,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Tooltip title={language === 'am' ? 'የመቀመጫ ቀለም' : 'Background Color'}>
                <IconButton size="small" sx={{ color: getTextColor() }}>
                  <ColorLens />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: 'flex', gap: 0.3 }}>
                {['white', 'black', 'green', 'blue', 'yellow'].map((color) => (
                  <Box
                    key={color}
                    onClick={() => handleBackgroundColorChange(color)}
                    sx={{
                      width: { xs: 20, sm: 24 },
                      height: { xs: 20, sm: 24 },
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: backgroundColor === color ? '3px solid #1976d2' : `2px solid ${getTextColor()}30`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>

      <HowToPlayModal
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
        language={language}
      />
    </motion.div>
  );
};

export default BetSelectionPage;