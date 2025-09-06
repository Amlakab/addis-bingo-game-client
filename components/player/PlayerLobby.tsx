'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  Button, Box, Typography, Card, CardContent, 
  useTheme, useMediaQuery, Alert, Snackbar, TextField,
  IconButton, CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';

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

const PlayerLobby = ({ 
  onStartGame,
  initialBet,
  initialTime,
  createdAt,
  language = 'en',
  setLanguage,
  onBackToLobby,
  onDirectToGame
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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate responsive button size based on screen width
  useEffect(() => {
    const calculateButtonSize = () => {
      if (!gridContainerRef.current) return;
      
      const containerWidth = gridContainerRef.current.offsetWidth;
      // Calculate size based on container width (10 columns with gaps)
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
    
    // Setup WebSocket listeners
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('session-created', handleSessionCreated);
    webSocketService.on('wallet-updated', handleWalletUpdate);
    
    // Request initial session data
    webSocketService.send('get-sessions', { betAmount });
    
    return () => {
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('session-created', handleSessionCreated);
      webSocketService.off('wallet-updated', handleWalletUpdate);
    };
  }, [isClient, webSocketService, user, betAmount]);

  useEffect(() => {
    if (!isClient) return;
    
    // Countdown timer
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Auto-start game when timer reaches 0 if there are players
      // This will trigger the onStartGame which should update session status
      if (playerCount > 2) {
        onStartGame(selectedPlayers, betAmount);
      } else if (playerCount === 0 && onBackToLobby) {
        onBackToLobby();
      }
      else{
     const msg = language === 'am'
      ? 'በጨዋታ መጀመሪያ 3 ተጫዋቾች ያስፈልጋሉ!'
      : 'At least 3 players are required to start the game!';
        setToastMessage(msg  );
        setShowToast(true);
      }
    }
  }, [isClient, remainingTime, selectedPlayers, betAmount, onStartGame, playerCount, onBackToLobby]);

  const calculateRemainingTime = (sessions: GameSession[]) => {
    // Filter sessions for current bet amount and active status
    const activeSessions = sessions.filter(
      session => session.betAmount === betAmount && session.status === 'active'
    );
    
    if (activeSessions.length === 0) {
      // No active sessions, use the initial time from props
      return initialTime;
    }
    
    // Find the earliest createdAt time among active sessions
    const earliestSession = activeSessions.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    
    if (!earliestSession || !earliestSession.createdAt) {
      return initialTime;
    }
    
    try {
      const sessionStartTime = new Date(earliestSession.createdAt).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - sessionStartTime) / 1000);
      const calculatedRemainingTime = Math.max(0, 45 - elapsedSeconds);
      
      return calculatedRemainingTime;
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return initialTime;
    }
  };

  const handleSessionsUpdate = (sessions: GameSession[]) => {
    // Calculate remaining time based on session data
    const calculatedRemainingTime = calculateRemainingTime(sessions);
    setRemainingTime(calculatedRemainingTime);
    
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
    
    const activePlayers = betSessions.length;
    const pool = activePlayers * betAmount * 0.8;
    setPrizePool(pool);
    setPlayerCount(activePlayers);
  };

  const handleSessionCreated = (session: GameSession) => {
    if (session.betAmount === betAmount) {
      setOccupiedCards(prev => [...prev, session.cardNumber]);
      
      setOccupiedCardsByUser(prev => ({
        ...prev,
        [session.cardNumber]: session.userId._id
      }));
      
      setPlayerCount(prev => prev + 1);
      setPrizePool(prev => prev + betAmount * 0.8);
      
      if (user && session.userId._id === user._id) {
        setSelectedPlayers(prev => [...prev, { id: session.cardNumber, userId: session.userId._id }]);
      }
    }
  };

  const handleWalletUpdate = (newWallet: number) => {
    setWallet(newWallet);
  };

  const togglePlayer = async (id: number) => {
    if (!isClient || !webSocketService) return;
    
    if (!user) {
      setErrorMessage(language === 'am' ? "እባክዎ በመጀመሪያ ይግቡ" : "Please login first!");
      setWalletError(true);
      return;
    }

    const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
    
    if (isSelectedByUser) {
      setIsLoading(true);
      try {
        webSocketService.send('delete-session', {
          cardNumber: id,
          betAmount,
        });
        
        setSelectedPlayers(prev => prev.filter(p => p.id !== id));
        
      } catch (error: any) {
        console.error('Error deselecting card:', error);
        const errorMsg = error.response?.data?.error || "Error deselecting card";
        setErrorMessage(errorMsg);
        setWalletError(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (occupiedCards.includes(id) && occupiedCardsByUser[id] !== user._id) {
      setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ የተመረጠ ነው" : "This card is already selected!");
      setWalletError(true);
      return;
    }

    if (selectedPlayers.length < 2) {
      if (wallet < betAmount) {
        setErrorMessage(language === 'am' ? "በበቂ ሁኔታ ገንዘብ የሎትም" : "Insufficient balance!");
        setWalletError(true);
        return;
      }

      setIsLoading(true);
      try {
        webSocketService.send('create-session', {
          userId: user._id,
          cardNumber: id,
          betAmount,
          createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()
        });
        
        setSelectedPlayers(prev => [...prev, { id, userId: user._id }]);
        
      } catch (error: any) {
        console.error('Error selecting card:', error);
        const errorMsg = error.response?.data?.error || "Error selecting card";
        setErrorMessage(errorMsg);
        setWalletError(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage(language === 'am' ? "ከ 2 በላይ ተጫዋቾችን መምረጥ አይችሉም!" : "You can't select more than 2 players!");
      setWalletError(true);
    }
  };

  // Handle direct navigation to game (without updating session status)
  const handleDirectToGame = () => {
    if (selectedPlayers.length > 0 && onDirectToGame) {
      onDirectToGame(selectedPlayers, betAmount);
    }
  };

  // New method to handle canceling selections
  const handleCancelSelections = async () => {
    if (!isClient || !webSocketService || !user) return;
    
    if (selectedPlayers.length === 0) return;
    
    setIsLoading(true);
    try {
      // Loop through all selected cards and delete each session
      for (let i = 0; i < selectedPlayers.length; i++) {
        const player = selectedPlayers[i];
        webSocketService.send('delete-session', {
          cardNumber: player.id,
          betAmount,
        });
      }
      
      // Clear selected players
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
    >
      {/* Bet Amount and Stats Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          background: "rgba(255,255,255,0.8)",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          mb: 2,
          flexDirection: "row",
          gap: { xs: 1, sm: 2 },
          flexWrap: "nowrap",
        }}
      >
        {/* Bet Input */}
        <TextField
          label={language === "am" ? "የተጫዋቾች በቢር" : "Bet (Birr)"}
          type="number"
          size="small"
          value={betAmount}
          disabled
          onChange={(e) => setBetAmount(Number(e.target.value))}
          sx={{
            width: { xs: 100, sm: 150 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              background: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            },
            "& .MuiInputBase-input": {
              fontSize: { xs: "0.75rem", sm: "0.9rem" },
              p: { xs: 0.5, sm: 1 },
            },
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
              minWidth: { xs: 45, sm: 70 },
              height: { xs: 45, sm: 70 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, #4CAF50, #8BC34A)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            <CardContent sx={{ textAlign: "center", p: { xs: 0.5, sm: 1 } }}>
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" }, color: "white" }}
              >
                {language === "am" ? "ተጫዋቾች" : "Players"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {playerCount}
              </Typography>
            </CardContent>
          </Card>

          {/* Prize Pool */}
          <Card
            sx={{
              minWidth: { xs: 45, sm: 70 },
              height: { xs: 45, sm: 70 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, #FF9800, #FFC107)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            <CardContent sx={{ textAlign: "center", p: { xs: 0.5, sm: 1 } }}>
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" }, color: "white" }}
              >
                {language === "am" ? "ደራሽ" : "Derash"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  fontWeight: "bold",
                  color: "white",
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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden'
      }}>
        <Box
          ref={gridContainerRef}
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(10, minmax(30px, 1fr))`,
            gridAutoRows: 'minmax(30px, auto)',
            gap: 0.5,
            justifyContent: 'center',
            p: 0.5,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'auto',
            mb: 0.5,
            mx: 'auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map((id) => {
            const isOccupied = occupiedCards.includes(id);
            const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
            const isSelectedByOthers = isOccupied && !isSelectedByUser;

            return (
              <motion.div
                key={id}
                whileHover={{ scale: isSelectedByOthers ? 1 : 1.05 }}
                whileTap={{ scale: isSelectedByOthers ? 1 : 0.95 }}
              >
                <Box
                  onClick={() => togglePlayer(id)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    cursor: (isSelectedByOthers || isLoading || remainingTime <= 0)
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.2s ease',

                    background: isSelectedByUser
                      ? 'linear-gradient(145deg, #4CAF50, #8BC34A)'
                      : isSelectedByOthers
                      ? 'linear-gradient(145deg, #ffcdd2, #ef9a9a)'
                      : 'linear-gradient(145deg, #ffffff, #e0e0e0)',

                    color: isSelectedByUser
                      ? 'white'
                      : isSelectedByOthers
                      ? '#d32f2f'
                      : 'text.primary',

                    border: isSelectedByUser
                      ? '2px solid #2E7D32'
                      : isSelectedByOthers
                      ? '2px solid #d32f2f'
                      : '1px solid #e0e0e0',

                    boxShadow: isSelectedByUser
                      ? '0 4px 8px rgba(76,175,80,0.3)'
                      : isSelectedByOthers
                      ? '0 2px 4px rgba(244,67,54,0.2)'
                      : '0 2px 4px rgba(33,150,243,0.2)',

                    '&:hover': {
                      background: isSelectedByUser
                        ? 'linear-gradient(145deg, #388E3C, #689F38)'
                        : isSelectedByOthers
                        ? 'linear-gradient(145deg, #ef9a9a, #e57373)'
                        : 'linear-gradient(145deg, #f5f5f5, #e0e0e0)',
                    },
                  }}
                >
                  {isLoading && isSelectedByUser ? (
                    <CircularProgress size={20} />
                  ) : (
                    id
                  )}
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Action Buttons - Two buttons in one row */}
        <Box
          sx={{
            width: '100%',
            maxWidth: gridContainerRef.current ? gridContainerRef.current.offsetWidth : '100%',
            mx: 'auto',
            px: 1,
            display: 'flex',
            gap: 1,
          }}
        >
          {/* Left Button */}
          <Button
            variant="contained"
            color={
              playerCount > 2
                ? 'success'
                : selectedPlayers.length === 0
                ? 'primary'
                : 'warning'
            }
            onClick={() => {
              if (playerCount > 2) {
                handleDirectToGame();
              } else if (selectedPlayers.length && onBackToLobby) {
                onBackToLobby();
              } else {
                // 1–3 players → do nothing (waiting)
              }
            }}
            sx={{
              flex: 2,
              py: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }}
          >
            {playerCount > 2
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

          {/* Right Button (Clear) */}
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSelections}
            disabled={selectedPlayers.length === 0}
            sx={{
              flex: 1,
              py: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              opacity: selectedPlayers.length === 0 ? 0.6 : 1,
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
      </Box>
    </motion.div>
  );
};

export default PlayerLobby;