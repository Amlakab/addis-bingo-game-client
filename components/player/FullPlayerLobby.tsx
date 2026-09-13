'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  Button, Box, Typography, Card,
  Alert, Snackbar, CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface FullPlayerLobbyProps {
  onStartGame: (players: PlayerSelection[], bet: number, gameId: string) => void;
  gameId: string;
  betAmount: number;
  language?: 'en' | 'am';
  setLanguage?: (lang: 'en' | 'am') => void;
  onBackToLobby?: () => void;
  onDirectToGame?: (players: PlayerSelection[], bet: number, gameId: string) => void;
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
  gameId: string;
  status: string;
  createdAt: string;
}

interface FullTimerState {
  status: 'ready' | 'active' | 'in-progress';
  timer: number;
  playerCount: number;
  prizePool: number;
  gameId: string;
  betAmount: number;
  createdAt: Date | null;
}

const FullPlayerLobby = ({ 
  onStartGame,
  gameId,
  betAmount,
  language = 'am',
  onBackToLobby,
  onDirectToGame,
  backgroundColor = 'white',
  setBackgroundColor
}: FullPlayerLobbyProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelection[]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [prizePool, setPrizePool] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [wallet, setWallet] = useState(0);
  const [walletError, setWalletError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [occupiedCards, setOccupiedCards] = useState<number[]>([]);
  const [occupiedCardsByUser, setOccupiedCardsByUser] = useState<{[key: number]: string}>({});
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const { user } = useAuth();
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const hasAutoRedirectedRef = useRef(false);

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

    const handleFullTimerUpdate = (timerStates: {[key: number]: FullTimerState}) => {
      if (timerStates[betAmount]) {
        const timerState = timerStates[betAmount];
        setRemainingTime(timerState.timer);
        setPlayerCount(timerState.playerCount);
        setPrizePool(timerState.prizePool);
      }
    };

    const handleSessionsUpdate = (sessions: GameSession[]) => {
      const betSessions = sessions.filter(session => session.betAmount === betAmount);
      const occupied = betSessions.map(session => session.cardNumber);
      setOccupiedCards(occupied);
      
      const cardUserMap: {[key: number]: string} = {};
      betSessions.forEach(session => {
        if (session.userId) {
          cardUserMap[session.cardNumber] = session.userId._id;
        }
      });
      setOccupiedCardsByUser(cardUserMap);
      
      if (user) {
        const userSelectedCards = betSessions
          .filter(session => session.userId && session.userId._id === user._id)
          .map(session => ({ id: session.cardNumber, userId: session.userId._id }));
        
        setSelectedPlayers(userSelectedCards);
      }
    };

    const handleSessionCreated = (session: GameSession) => {
      if (session.betAmount === betAmount) {
        setOccupiedCards(prev => [...prev, session.cardNumber]);
        
        if (session.userId) {
          setOccupiedCardsByUser(prev => ({
            ...prev,
            [session.cardNumber]: session.userId._id
          }));
          
          if (user && session.userId._id === user._id) {
            setSelectedPlayers(prev => {
              if (prev.some(p => p.id === session.cardNumber)) return prev;
              return [...prev, { id: session.cardNumber, userId: session.userId._id }];
            });
          }
        }
      }
    };

    const handleWalletUpdate = (newWallet: number) => {
      setWallet(newWallet);
    };

    webSocketService.on('full-timer-states-update', handleFullTimerUpdate);
    webSocketService.on('full-sessions-updated', handleSessionsUpdate);
    webSocketService.on('full-session-created', handleSessionCreated);
    webSocketService.on('wallet-updated', handleWalletUpdate);
    
    webSocketService.send('get-full-sessions', { betAmount });
    
    return () => {
      webSocketService.off('full-timer-states-update', handleFullTimerUpdate);
      webSocketService.off('full-sessions-updated', handleSessionsUpdate);
      webSocketService.off('full-session-created', handleSessionCreated);
      webSocketService.off('wallet-updated', handleWalletUpdate);
    };
  }, [isClient, webSocketService, user, betAmount]);

  // Automatic navigation when 5 seconds remain
  useEffect(() => {
    if (remainingTime > 0 && remainingTime <= 5 && selectedPlayers.length > 0) {
      if (!hasAutoRedirectedRef.current) {
        hasAutoRedirectedRef.current = true;
        handleDirectToGame();
      }
    }

    if (remainingTime > 5) {
      hasAutoRedirectedRef.current = false;
    }
  }, [remainingTime, selectedPlayers]);

  const selectPlayer = async (id: number) => {
    if (!isClient || !webSocketService) return;
    
    if (!user) {
      setErrorMessage(language === 'am' ? "እባክዎ በመጀመሪያ ይግቡ" : "Please login first!");
      setWalletError(true);
      return;
    }

    const isAlreadySelected = occupiedCards.includes(id);
    if (isAlreadySelected) {
      setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ ተመርጧል" : "This card is already selected!");
      setWalletError(true);
      return;
    }

    if (selectedPlayers.length >= 2) {
      setErrorMessage(language === 'am' ? "ከ 2 በላይ ተጫዋቾችን መምረጥ አይችሉም!" : "You can't select more than 2 players!");
      setWalletError(true);
      return;
    }

    if (wallet < betAmount) {
      setErrorMessage(language === 'am' ? "በበቂ ሁኔታ ገንዘብ የሎትም" : "Insufficient balance!");
      setWalletError(true);
      return;
    }

    try {
      webSocketService.send('create-full-session', {
        userId: user._id,
        agentId: user.agent_id || user._id,
        cardNumber: id,
        betAmount
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 
        (language === 'am' ? "ካርድ ሲመርጡ ስህተት ተፈጥሯል" : "Error selecting card");
      setErrorMessage(errorMsg);
      setWalletError(true);
    }
  };

  // ✅ PRE-GAME READY TRANSITION (Aligns strictly with Partial Game step 5)
  const handleDirectToGame = () => {
    if (!isClient || !webSocketService || !user || !onDirectToGame) return;

    if (selectedPlayers.length === 0) {
      setToastMessage(language === 'am' ? 'እባክዎ ቢያንስ 1 ካርድ ይምረጡ' : 'Please select at least 1 card');
      setShowToast(true);
      return;
    }

    try {
      // Step 5: Transition session from 'active' -> 'ready'
      webSocketService.send('update-full-session-status-by-user-bet', {
        userId: user._id,
        betAmount: betAmount,
        status: 'ready'
      });

      // Notify server to start game calling
      webSocketService.send('start-full-game', { betAmount });

      // Navigate to game view
      onDirectToGame(selectedPlayers, betAmount, gameId);
    } catch (error) {
      console.error('Error navigating to full game interface:', error);
      setToastMessage(language === 'am' ? 'ወደ ጨዋታ ለመሄድ ሲገነዘብ ስህተት ተፈጥሯል' : 'Error occurred while entering game');
      setShowToast(true);
    }
  };

  const getCardGrid = (cardId: number) => {
    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75]
    ];
    
    const seed = cardId * 7 + 13;
    const card: number[][] = [];
    
    for (let row = 0; row < 5; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        if (col === 2 && row === 2) {
          rowData.push(0);
        } else {
          const [min, max] = ranges[col];
          const index = (seed + row * 5 + col) % (max - min + 1);
          rowData.push(min + index);
        }
      }
      card.push(rowData);
    }
    return card;
  };

  const transposeCard = (card: number[][]) => {
    const transposed: number[][] = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        transposed[i][j] = card[j][i];
      }
    }
    return transposed;
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (!isClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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
        overflow: 'hidden',
        padding: 0
      }}
    >
      {/* Header Row */}
      <Box sx={{
        display: 'flex',
        gap: 0.75,
        p: 0.5,
        mb: 1,
        width: '100%',
        flexShrink: 0
      }}>
        <Card sx={{
          flex: '0 0 25%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            {language === 'am' ? 'ውርርድ' : 'Bet'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
            {betAmount}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 25%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            {language === 'am' ? 'የቀረ ጊዜ' : 'Time'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
            {remainingTime > 0 ? formatTimeRemaining(remainingTime) : 'Ready'}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 25%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            {language === 'am' ? 'ተጫዋቾች' : 'Players'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {playerCount}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 25%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            {language === 'am' ? 'ደራሽ' : 'Prize'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1.1rem' }}>
            {prizePool.toFixed(0)}
          </Typography>
        </Card>
      </Box>

      {/* Main Grid */}
      <Box sx={{ 
        p: 0,
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
            p: 0.5,
            background: getCardBackground(),
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'auto',
            mb: 0.5,
            mx: 'auto',
            width: '100%',
            maxWidth: '100%',
            maxHeight: '400px',
          }}
        >
          {Array.from({ length: 400 }, (_, i) => i + 1).map((id) => {
            const isOccupied = occupiedCards.includes(id);
            const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
            const isSelectedByOthers = isOccupied && !isSelectedByUser;
            const isDisabled = isOccupied;

            return (
              <motion.div
                key={id}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Box
                  onClick={() => !isDisabled && selectPlayer(id)}
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
                    opacity: isDisabled ? 0.8 : 1,

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
                  }}
                >
                  {id}
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Selected Cards Display & Action Section */}
        <Box sx={{ 
          flexShrink: 0,
          width: '100%',
          px: 0.5,
          pb: 0.5,
          mt: 'auto',
        }}>
          {selectedPlayers.length === 0 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={getButtonVariant()}
                color="primary"
                onClick={() => onBackToLobby && onBackToLobby()}
                sx={{
                  flex: 1,
                  py: 1,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  ...getButtonStyle()
                }}
              >
                {language === 'am' ? 'ተመለስ' : 'Back'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, overflow: 'auto' }}>
                {selectedPlayers.map((player) => {
                  const card = getCardGrid(player.id);
                  const transposedCard = transposeCard(card);
                  
                  return (
                    <Card
                      key={player.id}
                      sx={{
                        flex: selectedPlayers.length === 1 ? '1' : '0 0 calc(50% - 4px)',
                        p: 0.5,
                        background: getCardBackground(),
                        borderRadius: 1.5,
                        border: '2px solid #4CAF50',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: getTextColor() }}>
                          {language === 'am' ? 'ካርድ' : 'Card'} #{player.id}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.15 }}>
                        {["B", "I", "N", "G", "O"].map((letter) => (
                          <Box
                            key={letter}
                            sx={{
                              p: 0.2,
                              background: 'linear-gradient(135deg, #1976d2, #2196f3)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '2px 2px 0 0',
                            }}
                          >
                            {letter}
                          </Box>
                        ))}

                        {transposedCard.map((row, rowIdx) =>
                          row.map((num, colIdx) => {
                            const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                            return (
                              <Box
                                key={`${rowIdx}-${colIdx}`}
                                sx={{
                                  p: 0.15,
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '2px',
                                  background: isFreeSpace ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.05)',
                                  color: getTextColor(),
                                  fontWeight: 'bold',
                                  fontSize: '0.65rem',
                                  minHeight: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isFreeSpace ? '★' : num}
                              </Box>
                            );
                          })
                        )}
                      </Box>
                    </Card>
                  );
                })}
              </Box>

              <Button
                variant="contained"
                color="success"
                onClick={handleDirectToGame}
                disabled={selectedPlayers.length === 0}
                sx={{
                  py: 1.5,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                }}
              >
                {remainingTime > 0 
                  ? (language === 'am' ? `ጨዋታ ይጀምራል ${formatTimeRemaining(remainingTime)}` : `Game starts in ${formatTimeRemaining(remainingTime)}`)
                  : (language === 'am' ? 'ጨዋታ ጀምር' : 'Start Game')
                }
              </Button>
            </Box>
          )}
        </Box>

        <Snackbar open={walletError} autoHideDuration={6000} onClose={() => setWalletError(false)}>
          <Alert severity="error" onClose={() => setWalletError(false)} sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>

        <Snackbar open={showToast} autoHideDuration={3000} onClose={() => setShowToast(false)}>
          <Alert severity="info" onClose={() => setShowToast(false)} sx={{ width: '100%' }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default FullPlayerLobby;