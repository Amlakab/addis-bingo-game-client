'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Card, CardContent, Button,
  useTheme, useMediaQuery, Chip, Skeleton, Tooltip, IconButton,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  SportsEsports, People, EmojiEvents, AccessTime,
  AccountBalanceWallet, ColorLens, Schedule, ArrowBack
} from '@mui/icons-material';
import api from '@/app/utils/api';
import HowToPlayModal from '@/components/player/HowToPlayModal';

interface FullGame {
  _id: string;
  betAmount: number;
  gameType: 'full';
  activeDays: Array<{ day: string; startTime: string }>;
  nextGameTime: Date | null;
  timeRemaining: number;
  isActive: boolean;
}

interface FullSelectionPageProps {
  onPlay: (gameId: string, betAmount: number, players: number) => void;
  onBack?: () => void;
  language?: 'en' | 'am';
  backgroundColor?: string;
  setBackgroundColor?: (color: string) => void;
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

const FullSelectionPage = ({ 
  onPlay,
  onBack,
  language = 'am',
  backgroundColor = 'black',
  setBackgroundColor
}: FullSelectionPageProps) => {
  const [fullGames, setFullGames] = useState<FullGame[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Color helper functions
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

  const handleBackgroundColorChange = (color: string) => {
    if (setBackgroundColor) {
      setBackgroundColor(color);
    }
    localStorage.setItem('bingoBgColor', color);
    
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
    if (!isClient) return;
    
    fetchFullGames();
    fetchUserBalance();
    
    // Refresh every 10 seconds to update timer
    const interval = setInterval(() => {
      fetchFullGames();
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isClient]);

  const fetchFullGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await api.get('/games?gameType=full');
      const games = response.data.data;
      
      const processedGames = games.map((game: any) => {
        const nextTime = getNextGameTime(game.activeDays);
        return {
          ...game,
          nextGameTime: nextTime,
          timeRemaining: nextTime ? calculateTimeRemaining(nextTime) : 0,
          // A game is "active" if it has a scheduled time (just like partial game has timer)
          // This means "Play" button should show
          isActive: nextTime !== null && !isGamePassed(game)
        };
      });
      
      setFullGames(processedGames);
    } catch (error) {
      console.error('Error fetching full games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Calculate next game time based on active days
  const getNextGameTime = (activeDays: any[]): Date | null => {
    if (!activeDays || activeDays.length === 0) return null;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const sortedDays = [...activeDays].sort((a, b) => {
      const dayA = dayNames.indexOf(a.day);
      const dayB = dayNames.indexOf(b.day);
      return dayA - dayB;
    });

    for (const activeDay of sortedDays) {
      const targetDayIndex = dayNames.indexOf(activeDay.day);
      const currentDayIndex = now.getDay();
      
      let daysUntil = targetDayIndex - currentDayIndex;
      if (daysUntil < 0) daysUntil += 7;
      if (daysUntil === 0) {
        const [hours, minutes] = activeDay.startTime.split(':').map(Number);
        const targetTime = new Date(now);
        targetTime.setHours(hours, minutes, 0, 0);
        
        if (targetTime > now) {
          return targetTime;
        }
        daysUntil = 7;
      }
      
      const [hours, minutes] = activeDay.startTime.split(':').map(Number);
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntil);
      targetDate.setHours(hours, minutes, 0, 0);
      
      return targetDate;
    }

    return null;
  };

  const calculateTimeRemaining = (targetDate: Date): number => {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  // Check if game has passed (more than 5 minutes after scheduled time)
  const isGamePassed = (game: any): boolean => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    
    for (const activeDay of game.activeDays) {
      if (activeDay.day === currentDay) {
        const [hours, minutes] = activeDay.startTime.split(':').map(Number);
        const gameTime = new Date(now);
        gameTime.setHours(hours, minutes, 0, 0);
        
        const diffMs = now.getTime() - gameTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        // Game is passed if more than 5 minutes after scheduled time
        if (diffMinutes > 5) {
          return true;
        }
      }
    }
    return false;
  };

  const fetchUserBalance = async () => {
    if (!isClient) return;
    
    try {
      setIsLoadingBalance(true);
      
      const userDataString = localStorage.getItem('user');
      
      if (!userDataString) {
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

  const handlePlayClick = (game: FullGame) => {
    // If game has a scheduled time (isActive is true), allow play
    if (game.isActive) {
      onPlay(game._id, game.betAmount, 0);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Now';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasInsufficientBalance = (betAmount: number) => {
    return userBalance < betAmount;
  };

  if (!isClient || isLoadingGames) {
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
        <CircularProgress sx={{ color: getTextColor() }} />
        <Typography variant="h6" sx={{ ml: 2, color: getTextColor() }}>
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
        {/* Back Button */}
        {onBack && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Button
              variant={getButtonVariant()}
              color={getButtonColor()}
              onClick={onBack}
              startIcon={<ArrowBack />}
              sx={{
                ...getButtonStyle(),
                fontSize: '0.9rem'
              }}
            >
              {language === 'am' ? 'ተመለስ' : 'Back'}
            </Button>
          </Box>
        )}

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

        {/* Title */}
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          color: getTextColor(),
          textAlign: 'center'
        }}>
          {language === 'am' ? 'መደበኛ ጨዋታዎች' : 'Full Games'}
        </Typography>

        {/* Game Cards Container */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 2, 
          maxWidth: 1000, 
          width: '100%' 
        }}>
          {fullGames.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1" sx={{ color: getTextColor() }}>
                {language === 'am' ? 'ምንም መደበኛ ጨዋታዎች የሉም' : 'No full games available'}
              </Typography>
            </Box>
          ) : (
            fullGames.map((game, index) => {
              const isDisabledByBalance = !isLoadingBalance && hasInsufficientBalance(game.betAmount);
              // A game is "playable" if it has a scheduled time and hasn't passed
              // This is like partial games showing "Play" when timer is running
              const canPlay = game.isActive && !isDisabledByBalance;
              const isPassed = !game.isActive && game.nextGameTime === null && !game.activeDays?.length;
              
              return (
                <motion.div
                  key={game._id}
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
                      opacity: isDisabledByBalance || isPassed ? 0.6 : 1,
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
                        icon={canPlay ? <AccessTime /> : <Schedule />}
                        label={canPlay 
                          ? formatTimeRemaining(game.timeRemaining)
                          : (isPassed ? (language === 'am' ? 'አልቋል' : 'Passed') : (language === 'am' ? 'ይጠብቁ' : 'Wait'))}
                        color={canPlay ? 'success' : isPassed ? 'default' : 'warning'}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          color: canPlay ? '#fff' : (isPassed ? '#757575' : '#fff')
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
                        {game.betAmount} {language === 'am' ? 'ብር' : 'Birr'}
                      </Typography>
                      
                      {/* Active Days */}
                      {game.activeDays && game.activeDays.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          {game.activeDays.map((day, idx) => (
                            <Chip
                              key={idx}
                              label={`${day.day.charAt(0).toUpperCase() + day.day.slice(1)} ${day.startTime}`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                mr: 0.5, 
                                mb: 0.5, 
                                fontSize: '0.65rem',
                                color: getTextColor(),
                                borderColor: getTextColor() + '40'
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Next Game Time - Shows countdown */}
                      {game.nextGameTime && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mb: 2,
                          background: 'rgba(0,0,0,0.05)', 
                          borderRadius: 1.5, 
                          p: 1 
                        }}>
                          <AccessTime sx={{ color: '#f39c12', mr: 0.5, fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: getTextColor() }}>
                            {language === 'am' ? 'ቀሪ ጊዜ:' : 'Time Remaining:'}
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 0.5, fontSize: '0.75rem', fontWeight: 'bold', color: getTextColor() }}>
                            {formatTimeRemaining(game.timeRemaining)}
                          </Typography>
                        </Box>
                      )}

                      <Button
                        variant={getButtonVariant()}
                        color={getButtonColor()}
                        size="small"
                        disabled={!canPlay || isDisabledByBalance || isLoadingBalance || isPassed}
                        onClick={() => handlePlayClick(game)}
                        startIcon={canPlay && !isDisabledByBalance ? <SportsEsports /> : undefined}
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
                            : isPassed
                              ? (language === 'am' ? "አልቋል" : "Passed")
                              : canPlay
                                ? (language === 'am' ? "ይጫወቱ" : "Play")
                                : (language === 'am' ? "ይጠብቁ" : "Wait")
                        }
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </Box>

        {/* Footer */}
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
              ? "መደበኛ ጨዋታዎች በተወሰኑ ቀናት እና ሰዓታት ይካሄዳሉ። አሸናፊዎች ሁሉንም ቁጥሮች ማግኘት አለባቸው።"
              : "Full games run on specific days and times. Winners must mark all numbers on their card."
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

      {/* Toast Message */}
      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setShowToast(false)}>
          {toastMessage}
        </Alert>
      </Snackbar>

      <HowToPlayModal
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
        language={language}
      />
    </motion.div>
  );
};

export default FullSelectionPage;