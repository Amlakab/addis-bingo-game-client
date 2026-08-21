'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  Button, Box, Typography, Card, CardContent, 
  useTheme, useMediaQuery, Alert, Snackbar, TextField,
  IconButton, CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import api from '@/app/utils/api';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface PlayerLobbyProps {
  onStartGame: (players: PlayerSelection[], bet: number) => void;
  initialBet: number;
  initialTime: number;
  createdAt: Date;
  language?: 'en' | 'am';
  setLanguage?: (lang: 'en' | 'am') => void;
  onBackToLobby?: () => void;
  onDirectToGame?: (players: PlayerSelection[], bet: number) => void;
  backgroundColor?: string;
  setBackgroundColor?: (color: string) => void;
}

interface GameSession {
  _id: string;
  userId: {
    _id: string;
    phone: string;
  };
  cardNumber: number;
  betAmount: number;
  status: string;
  createdAt: string;
  __v: number;
}

interface BetTimerState {
  timer: number;
  status: 'ready' | 'active' | 'in-progress';
  playerCount: number;
  prizePool: number;
  createdAt: Date | null;
}

const PlayerLobby = ({ 
  onStartGame,
  initialBet,
  initialTime,
  createdAt,
  language = 'am',
  setLanguage,
  onBackToLobby,
  onDirectToGame,
  backgroundColor = 'white',
  setBackgroundColor
}: PlayerLobbyProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelection[]>([]);
  const [betAmount, setBetAmount] = useState(initialBet);
  const [remainingTime, setRemainingTime] = useState(initialTime);
  const [prizePool, setPrizePool] = useState(0);
  const [wallet, setWallet] = useState(0);
  const [walletError, setWalletError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [occupiedCards, setOccupiedCards] = useState<number[]>([]);
  const [occupiedCardsByUser, setOccupiedCardsByUser] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const { user } = useAuth();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [buttonSize, setButtonSize] = useState(40);
  
  const [pendingOperations, setPendingOperations] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      case 'black': return 'rgba(50, 50, 50, 0.95)';
      case 'green': return 'rgba(30, 70, 30, 0.95)';
      case 'blue': return 'rgba(30, 50, 80, 0.95)';
      case 'yellow': return 'rgba(240, 230, 140, 0.95)';
      default: return 'rgba(255, 255, 255, 0.95)';
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

  // FIXED: getTextFieldStyle without duplicate properties
  const getTextFieldStyle = () => {
    const textColor = getTextColor();
    return {
      '& .MuiInputLabel-root': {
        color: textColor,
      },
      '& .MuiOutlinedInput-root': {
        color: textColor,
        borderRadius: 1,
        background: 'rgba(255,255,255,0.1)',
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        '& fieldset': {
          borderColor: textColor,
        },
        '&:hover fieldset': {
          borderColor: textColor,
        },
        '&.Mui-focused fieldset': {
          borderColor: textColor,
        },
      },
      '& .MuiInputBase-input': {
        color: textColor,
        fontSize: { xs: "0.75rem", sm: "0.9rem" },
        p: { xs: 0.5, sm: 1 },
      },
      '& .MuiInputBase-input.Mui-disabled': {
        color: textColor,
        opacity: 0.8,
      },
    };
  };

  // Handle background color change
  const handleBackgroundColorChange = (color: string) => {
    if (setBackgroundColor) {
      setBackgroundColor(color);
    }
    localStorage.setItem('bingoBgColor', color);
  };

  // Calculate responsive button size
  useEffect(() => {
    const calculateButtonSize = () => {
      if (!gridContainerRef.current) return;
      
      const containerWidth = gridContainerRef.current.offsetWidth;
      const calculatedSize = Math.max(30, Math.min(50, (containerWidth - 18) / 10));
      setButtonSize(calculatedSize);
    };
    
    calculateButtonSize();
    window.addEventListener('resize', calculateButtonSize);
    
    return () => {
      window.removeEventListener('resize', calculateButtonSize);
    };
  }, []);

  // Set client-side flag and load WebSocket service
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
    
    if (user) {
      setWallet(user.wallet || 0);
    }
    
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('session-created', handleSessionCreated);
    webSocketService.on('wallet-updated', handleWalletUpdate);
    webSocketService.on('timer-states-update', handleTimerStatesUpdate);
    
    webSocketService.send('get-sessions', { betAmount });
    webSocketService.send('get-timer-states');
    
    return () => {
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('session-created', handleSessionCreated);
      webSocketService.off('wallet-updated', handleWalletUpdate);
      webSocketService.off('timer-states-update', handleTimerStatesUpdate);
    };
  }, [isClient, webSocketService, user, betAmount]);

  const handleTimerStatesUpdate = (timerStates: {[key: number]: BetTimerState}) => {
    console.log('Received timer states in PlayerLobby:', timerStates);
    
    if (timerStates[betAmount]) {
      const timerState = timerStates[betAmount];
      setRemainingTime(timerState.timer);
      setPlayerCount(timerState.playerCount);
      setPrizePool(timerState.prizePool);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    
    const checkPlayingStatus = () => {
      if (Object.keys(occupiedCardsByUser).length > 0) {
        const userSessions = Object.entries(occupiedCardsByUser)
          .filter(([_, userId]) => userId === user?._id)
          .map(([cardNumber]) => parseInt(cardNumber));
        
        if (userSessions.length > 0) {
          webSocketService.send('get-sessions', { betAmount }, (sessions: GameSession[]) => {
            const userPlayingSessions = sessions.filter(
              session => session.userId._id === user?._id && session.status === 'playing'
            );
            
            if (userPlayingSessions.length > 0) {
              handleCancelSelectionsAndGoBack();
            }
          });
        }
      }
    };
    
    checkPlayingStatus();
    
    if (remainingTime === 4 || remainingTime === 3 || remainingTime === 2 || remainingTime === 1 || remainingTime === 0) {
      if (playerCount < 3) {
        if (selectedPlayers.length > 0) {
          handleCancelSelectionsAndGoBack();
        } else if (onBackToLobby) {
          onBackToLobby();
        }
      } else { 
        if(selectedPlayers.length > 0 ) {
          handleDirectToGame();
        }
        else {
          if (onBackToLobby) {
            onBackToLobby();
          }
        }
      }
    }
  }, [isClient, remainingTime, selectedPlayers, betAmount, onStartGame, playerCount, onBackToLobby, occupiedCardsByUser, user, webSocketService]);

  const handleSessionsUpdate = (sessions: GameSession[]) => {
    const betSessions = sessions.filter(session => session.betAmount === betAmount);
    const occupied = betSessions.map(session => session.cardNumber);
    setOccupiedCards(occupied);
    
    const cardUserMap: {[key: number]: string} = {};
    betSessions.forEach(session => {
      cardUserMap[session.cardNumber] = session.userId._id;
    });
    setOccupiedCardsByUser(cardUserMap);
    
    if (user) {
      const userSelectedCards = betSessions
        .filter(session => session.userId._id === user._id)
        .map(session => ({ id: session.cardNumber, userId: session.userId._id }));
      
      setSelectedPlayers(userSelectedCards);
    }
    
    const userPlayingSessions = betSessions.filter(
      session => session.userId._id === user?._id && session.status === 'playing'
    );
    
    if (userPlayingSessions.length > 0) {
      handleCancelSelectionsAndGoBack();
    }
  };

  const handleSessionCreated = (session: GameSession) => {
    if (session.betAmount === betAmount) {
      setOccupiedCards(prev => [...prev, session.cardNumber]);
      
      setOccupiedCardsByUser(prev => ({
        ...prev,
        [session.cardNumber]: session.userId._id
      }));
      
      if (user && session.userId._id === user._id) {
        setSelectedPlayers(prev => [...prev, { id: session.cardNumber, userId: session.userId._id }]);
      }
    }
  };

  const handleWalletUpdate = (newWallet: number) => {
    setWallet(newWallet);
  };

  const handleCancelSelectionsAndGoBack = async () => {
    if (!isClient || !webSocketService || !user) return;
    
    setIsLoading(true);
    try {
      setSelectedPlayers([]);
      
      if (webSocketService) {
        webSocketService.send('clear-selected', {
          betAmount: betAmount,
          userId: user._id
        });
      }
      
      const msg = language === 'am' 
        ? 'መርጠው የነበሩት ካርዶች ተፈትተዋል። ወደ የባህር ገንዘብ ምርጫ ተመለስ።' 
        : 'Your selected cards have been cleared. Returning to bet selection.';
      setToastMessage(msg);
      setShowToast(true);
      
      setTimeout(() => {
        if (onBackToLobby) {
          onBackToLobby();
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Error canceling selections:', error);
      const errorMsg = error.response?.data?.error || "Error canceling selections";
      setErrorMessage(errorMsg);
      setWalletError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayer = async (id: number) => {
    if (isProcessing || pendingOperations.has(id)) {
      return;
    }

    if (!isClient || !webSocketService) return;
    
    if (!user) {
      setErrorMessage(language === 'am' ? "እባክዎ በመጀመሪያ ይግቡ" : "Please login first!");
      setWalletError(true);
      return;
    }

    const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
    const isSelectedByOthers = occupiedCards.includes(id) && !isSelectedByUser;
    
    if (isSelectedByOthers) {
      setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ በሌላ ተጠቃሚ የተመረጠ ነው" : "This card is already selected by another user!");
      setWalletError(true);
      return;
    }

    if (pendingOperations.has(id)) {
      return;
    }

    setPendingOperations(prev => new Set(prev).add(id));
    setIsProcessing(true);

    try {
      if (isSelectedByUser) {
        setSelectedPlayers(prev => prev.filter(p => p.id !== id));
        webSocketService.send('delete-session', {
          cardNumber: id,
          betAmount,
        });
      } else {
        if (selectedPlayers.length >= 2) {
          setErrorMessage(language === 'am' ? "ከ 2 በላይ ተጫዋቾችን መምረጥ አይችሉም!" : "You can't select more than 2 players!");
          setWalletError(true);
          return;
        }

        const totalCost = (selectedPlayers.length + 1) * betAmount;
        if (wallet < totalCost) {
          setErrorMessage(language === 'am' ? "በበቂ ሁኔታ ገንዘብ የሎትም" : "Insufficient balance!");
          setWalletError(true);
          return;
        }

        if (occupiedCards.includes(id)) {
          setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ የተመረጠ ነው" : "This card is already selected!");
          setWalletError(true);
          return;
        }

        setSelectedPlayers(prev => [...prev, { id, userId: user._id }]);

        webSocketService.send('create-session', {
          userId: user._id,
          agentId: user.agent_id || '',
          cardNumber: id,
          betAmount,
          createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()
        });
      }
      
    } catch (error: any) {
      console.error('Error toggling card:', error);
      const errorMsg = error.response?.data?.error || 
        (language === 'am' ? "ካርድ ሲመርጡ ስህተት ተፈጥሯል" : "Error selecting card");
      setErrorMessage(errorMsg);
      setWalletError(true);
      
      if (!isSelectedByUser) {
        setSelectedPlayers(prev => prev.filter(p => p.id !== id));
      }
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const handleDirectToGame = async () => {
    if (!isClient || !webSocketService || !user || !onDirectToGame) return;

    try {
      const response = await api.get(`/game/sessions/user/${user._id}`);
      const userSessions = response.data;
      
      const currentBetSessions = userSessions.filter((session: GameSession) => 
        session.betAmount === betAmount && 
        ['active', 'ready'].includes(session.status)
      );

      if (currentBetSessions.length === 0) {
        setToastMessage(language === 'am' 
          ? 'እባክዎ ቢያንስ 1 ካርድ ይምረጡ' 
          : 'Please select at least 1 card'
        );
        setShowToast(true);
        return;
      }

      if (currentBetSessions.length > 2) {
        setToastMessage(language === 'am' 
          ? 'ከ 2 በላይ ካርዶችን መምረጥ አይችሉም' 
          : 'You cannot select more than 2 cards'
        );
        setShowToast(true);
        return;
      }

      const validatedSelectedPlayers: PlayerSelection[] = currentBetSessions.map((session: GameSession) => ({
        id: session.cardNumber,
        userId: session.userId._id
      }));

      if (validatedSelectedPlayers.length < 1 || validatedSelectedPlayers.length > 2) {
        setToastMessage(language === 'am' 
          ? 'ከ 1 እስከ 2 ካርዶች ብቻ መምረጥ ይችላሉ' 
          : 'You can only select 1 to 2 cards'
        );
        setShowToast(true);
        return;
      }

      webSocketService.send('fund-wallet', {
        betAmount: betAmount,
        userId: user._id
      });

      webSocketService.send('update-session-status-by-user-bet', {
        userId: user._id,
        betAmount: betAmount,
        status: 'ready'
      });

      onDirectToGame(validatedSelectedPlayers, betAmount);

    } catch (error) {
      console.error('Error in handleDirectToGame:', error);
      setToastMessage(language === 'am' 
        ? 'ወደ ጨዋታ ለመሄድ ሲገነዘብ ስህተት ተፈጥሯል' 
        : 'Error occurred while processing game entry'
      );
      setShowToast(true);
    }
  };

  const handleCancelSelections = async () => {
    if (!isClient || !webSocketService || !user) return;
    
    if (selectedPlayers.length === 0) return;
    
    setIsLoading(true);
    try {
      if (webSocketService) {
        webSocketService.send('clear-selected', {
          betAmount: betAmount,
          userId: user._id
        });
      } else {
        console.error('WebSocket service not available');
      }
      
      setSelectedPlayers([]);
      
    } catch (error: any) {
      console.error('Error canceling selections:', error);
      const errorMsg = error.response?.data?.error || "Error canceling selections";
      setErrorMessage(errorMsg);
      setWalletError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Bet Amount and Stats Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          background: getCardBackground(),
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          mb: 2,
          flexDirection: "row",
          gap: { xs: 1, sm: 2 },
          flexWrap: "nowrap",
          flexShrink: 0,
          color: getTextColor()
        }}
      >
        {/* Bet Input */}
        <TextField
          label={language === "am" ? "የተጫዋቾች በቢር" : "Bet (Birr)"}
          type="number"
          size="small"
          value={betAmount}
          disabled
          sx={{
            width: { xs: 100, sm: 150 },
            ...getTextFieldStyle(),
          }}
          InputProps={{
            inputProps: { min: 0 },
          }}
        />

        {/* Timer */}
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "0.8rem", sm: "1rem" },
            whiteSpace: "nowrap",
            color: getTextColor()
          }}
        >
          {remainingTime}s {language === "am" ? "ይቀራል" : "left"}
        </Typography>

        {/* Cards */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 2 },
            flexDirection: "row",
            flexWrap: "nowrap",
          }}
        >
          {/* Players */}
          <Card
            sx={{
              minWidth: { xs: 50, sm: 90 },
              height: { xs: 40, sm: 60 },
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, #4CAF50, #8BC34A)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                p: { xs: 0.5, sm: 1 },
                "&:last-child": { pb: { xs: 0.5, sm: 1 } },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.6rem", sm: "0.75rem" },
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {language === "am" ? "ተጫዋቾች" : "Players"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {playerCount}
              </Typography>
            </CardContent>
          </Card>

          {/* Prize Pool */}
          <Card
            sx={{
              minWidth: { xs: 50, sm: 90 },
              height: { xs: 40, sm: 60 },
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, #FF9800, #FFC107)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                p: { xs: 0.5, sm: 1 },
                "&:last-child": { pb: { xs: 0.5, sm: 1 } },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.6rem", sm: "0.75rem" },
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {language === "am" ? "ደራሽ" : "Prize"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {prizePool.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Main Game Lobby Content */}
      <Box sx={{ 
        p: { xs: 0.5, sm: 0.5 }, 
        textAlign: 'center',
        background: backgroundColor === 'white' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          : backgroundColor,
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        color: getTextColor()
      }}>
        <Box
          ref={gridContainerRef}
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(10, minmax(30px, 1fr))`,
            gridAutoRows: 'minmax(42px, auto)',
            gap: 0.5,
            justifyContent: 'center',
            p: 0.5,
            background: getCardBackground(),
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'auto',
            mb: 0.5,
            mx: 'auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            maxHeight: '450px',
          }}
        >
          {Array.from({ length: 400 }, (_, i) => i + 1).map((id) => {
            const isOccupied = occupiedCards.includes(id);
            const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
            const isSelectedByOthers = isOccupied && !isSelectedByUser;
            const isPending = pendingOperations.has(id);
            const isDisabled = isSelectedByOthers || isProcessing || remainingTime <= 0;

            return (
              <motion.div
                key={id}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Box
                  onClick={() => !isDisabled && togglePlayer(id)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDisabled ? 0.7 : 1,

                    background: isSelectedByUser
                      ? 'linear-gradient(145deg, #4CAF50, #8BC34A)'
                      : isSelectedByOthers
                      ? 'linear-gradient(145deg, #ffcdd2, #ef9a9a)'
                      : backgroundColor === 'white'
                        ? 'linear-gradient(145deg, #ffffff, #e0e0e0)'
                        : 'rgba(255,255,255,0.15)',

                    color: isSelectedByUser
                      ? 'white'
                      : isSelectedByOthers
                      ? '#d32f2f'
                      : getTextColor(),

                    border: isSelectedByUser
                      ? '2px solid #2E7D32'
                      : isSelectedByOthers
                      ? '2px solid #d32f2f'
                      : '1px solid rgba(255,255,255,0.2)',

                    boxShadow: isSelectedByUser
                      ? '0 4px 8px rgba(76,175,80,0.3)'
                      : isSelectedByOthers
                      ? '0 2px 4px rgba(244,67,54,0.2)'
                      : '0 2px 4px rgba(0,0,0,0.1)',

                    '&:hover': !isDisabled ? {
                      background: isSelectedByUser
                        ? 'linear-gradient(145deg, #388E3C, #689F38)'
                        : backgroundColor === 'white'
                          ? 'linear-gradient(145deg, #f5f5f5, #e0e0e0)'
                          : 'rgba(255,255,255,0.25)',
                    } : {},
                  }}
                >
                  {isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    id
                  )}
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            width: '100%',
            maxWidth: gridContainerRef.current ? gridContainerRef.current.offsetWidth : '100%',
            mx: 'auto',
            px: 1,
            display: 'flex',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Button
            variant={getButtonVariant()}
            color={
              playerCount > 2 && selectedPlayers.length > 0
                ? 'success'
                : selectedPlayers.length === 0
                ? 'primary'
                : 'warning'
            }
            onClick={() => {
              if (playerCount > 2 && selectedPlayers.length > 0 && onDirectToGame) {
                handleDirectToGame();
              } else if (selectedPlayers.length === 0 && onBackToLobby) {
                onBackToLobby();
              }
            }}
            disabled={isProcessing}
            sx={{
              flex: 2,
              py: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              ...getButtonStyle()
            }}
          >
            {playerCount > 2 && selectedPlayers.length > 0
              ? language === 'am'
                ? 'ጨዋታ ጀምር'
                : 'Play'
              : selectedPlayers.length === 0
              ? language === 'am'
                ? 'ተመለስ'
                : 'Back'
              : language === 'am'
              ? 'ጠብቅ'
              : 'Wait'}
          </Button>

          <Button
            variant={getButtonVariant()}
            color="error"
            onClick={handleCancelSelections}
            disabled={selectedPlayers.length === 0 || isProcessing}
            sx={{
              flex: 1,
              py: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              opacity: selectedPlayers.length === 0 ? 0.6 : 1,
              ...getButtonStyle()
            }}
          >
            {language === 'am' ? 'አጽዳ' : 'Clear'}
          </Button>
        </Box>

        <Snackbar
          open={walletError}
          autoHideDuration={6000}
          onClose={() => setWalletError(false)}
        >
          <Alert 
            severity="error" 
            onClose={() => setWalletError(false)}
            sx={{ width: '100%' }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showToast}
          autoHideDuration={3000}
          onClose={() => setShowToast(false)}
        >
          <Alert 
            severity="info" 
            onClose={() => setShowToast(false)}
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default PlayerLobby;