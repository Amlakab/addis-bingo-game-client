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
  
  // Server time synchronization states
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [isTimeSynced, setIsTimeSynced] = useState(false);
  
  const { user } = useAuth();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [buttonSize, setButtonSize] = useState(40);
  
  const [pendingOperations, setPendingOperations] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Server time synchronization function
  const syncServerTime = async (): Promise<boolean> => {
    if (!webSocketService) return false;
    
    return new Promise((resolve) => {
      try {
        const clientSendTime = Date.now();
        
        webSocketService.send('get-server-time', {}, (response: any) => {
          if (response?.error) {
            console.error('Failed to sync server time:', response.error);
            resolve(false);
            return;
          }

          const clientReceiveTime = Date.now();
          const roundTripTime = clientReceiveTime - clientSendTime;
          
          if (response && response.serverTime) {
            const estimatedServerTime = response.serverTime + (roundTripTime / 2);
            const offset = estimatedServerTime - clientReceiveTime;
            
            setServerTimeOffset(offset);
            setIsTimeSynced(true);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        console.error('Error syncing server time:', error);
        resolve(false);
      }
    });
  };

  const getCurrentServerTime = (): number => {
    return Date.now() + serverTimeOffset;
  };

  // Fetch remaining time from server
  const fetchRemainingTimeFromServer = async (): Promise<number> => {
    if (!webSocketService) return initialTime;
    
    return new Promise((resolve) => {
      webSocketService.send('get-remaining-time', 
        { 
          betAmount,
          createdAt: new Date(createdAt).toISOString()
        }, 
        (response: any) => {
          if (response?.error) {
            console.error('Server time calculation error:', response.error);
            resolve(initialTime);
            return;
          }
          resolve(response.remainingTime);
        }
      );
    });
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

  // Time synchronization effect
  useEffect(() => {
    if (!isClient || !webSocketService) return;

    const initializeTimeSync = async () => {
      await syncServerTime();
    };

    initializeTimeSync();
    
    // Sync time every 30 seconds
    const timeSyncInterval = setInterval(syncServerTime, 30000);
    
    return () => {
      clearInterval(timeSyncInterval);
    };
  }, [isClient, webSocketService]);

  // WebSocket listeners setup
  useEffect(() => {
    if (!isClient || !webSocketService) return;
    
    if (user) {
      setWallet(user.wallet || 0);
    }
    
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('session-created', handleSessionCreated);
    webSocketService.on('wallet-updated', handleWalletUpdate);
    
    webSocketService.send('get-sessions', { betAmount });
    
    return () => {
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('session-created', handleSessionCreated);
      webSocketService.off('wallet-updated', handleWalletUpdate);
    };
  }, [isClient, webSocketService, user, betAmount]);

  // Periodic time updates
  useEffect(() => {
    if (!isClient || !webSocketService) return;

    const interval = setInterval(async () => {
      const updatedTime = await fetchRemainingTimeFromServer();
      setRemainingTime(updatedTime);
    }, 2000);

    return () => clearInterval(interval);
  }, [isClient, webSocketService, betAmount]);

  // Timer countdown and game logic
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
    
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      if (playerCount < 3) {
        if (selectedPlayers.length > 0) {
          handleCancelSelectionsAndGoBack();
        } else if (onBackToLobby) {
          onBackToLobby();
        }
      } else {
        handleDirectToGame();
      }
    }
  }, [isClient, remainingTime, selectedPlayers, betAmount, playerCount, onBackToLobby, occupiedCardsByUser, user, webSocketService]);

  // Updated sessions handler with server timing
  const handleSessionsUpdate = async (sessions: GameSession[]) => {
    const calculatedRemainingTime = await fetchRemainingTimeFromServer();
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

    const activePlayers = betSessions.filter(
      (session) => session.status === "active" || session.status === "ready"
    ).length;

    const pool = activePlayers * betAmount * 0.8;
    setPrizePool(pool);
    setPlayerCount(activePlayers);
    
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
          cardNumber: id,
          betAmount,
          createdAt: new Date(getCurrentServerTime()).toISOString()
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
    if (!isClient || !webSocketService || !user || selectedPlayers.length === 0 || !onDirectToGame) return;

    try {
      webSocketService.send('fund-wallet', {
        betAmount: betAmount,
        userId: user._id
      });

      webSocketService.send('update-session-status-by-user-bet', {
        userId: user._id,
        betAmount: betAmount,
        status: 'ready'
      });

      onDirectToGame(selectedPlayers, betAmount);

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
    >
      {/* Your existing JSX remains exactly the same */}
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

        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "0.8rem", sm: "1rem" },
            whiteSpace: "nowrap",
          }}
        >
          {remainingTime}s {language === "am" ? "ይቀራል" : "left"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 2 },
            flexDirection: "row",
            flexWrap: "nowrap",
          }}
        >
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
                {language === "am" ? "ተጫዋች" : "Players"}
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
                {language === "am" ? "ደራሽ" : "Derash"}
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
            const isPending = pendingOperations.has(id);
            const isDisabled = isSelectedByOthers || isProcessing || remainingTime <= 0;

            return (
              <motion.div
                key={id}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
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

                    '&:hover': !isDisabled ? {
                      background: isSelectedByUser
                        ? 'linear-gradient(145deg, #388E3C, #689F38)'
                        : 'linear-gradient(145deg, #f5f5f5, #e0e0e0)',
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

          <Button
            variant="contained"
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