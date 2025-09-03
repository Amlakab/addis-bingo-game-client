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
  onBackToLobby
}: PlayerLobbyProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelection[]>([]);
  const [betAmount, setBetAmount] = useState(initialBet);
  const [remainingTime, setRemainingTime] = useState(initialTime);
  const [prizePool, setPrizePool] = useState(0);
  const [wallet, setWallet] = useState(0);
  const [walletError, setWalletError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [occupiedCards, setOccupiedCards] = useState<number[]>([]);
  const [occupiedCardsByUser, setOccupiedCardsByUser] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const { user } = useAuth();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [buttonSize, setButtonSize] = useState(50);

  // Set client-side flag and load WebSocket service
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
      if (selectedPlayers.length > 0) {
        onStartGame(selectedPlayers, betAmount);
      } else if (playerCount === 0 && onBackToLobby) {
        // If no players and callback provided, go back to bet selection
        onBackToLobby();
      }
    }
  }, [isClient, remainingTime, selectedPlayers, betAmount, onStartGame, playerCount, onBackToLobby]);

  const handleSessionsUpdate = (sessions: GameSession[]) => {
    // Filter sessions for the current bet amount
    const betSessions = sessions.filter(session => session.betAmount === betAmount);
    const occupied = betSessions.map(session => session.cardNumber);
    setOccupiedCards(occupied);
    
    // Create a mapping of card numbers to user IDs
    const cardUserMap: {[key: number]: string} = {};
    betSessions.forEach(session => {
      cardUserMap[session.cardNumber] = session.userId._id; // Use session.userId._id
    });
    setOccupiedCardsByUser(cardUserMap);
    
    // Update selected players - only include cards selected by the current user
    if (user) {
      const userSelectedCards = betSessions
        .filter(session => session.userId._id === user._id) // Compare with session.userId._id
        .map(session => ({ id: session.cardNumber, userId: session.userId._id }));
      
      setSelectedPlayers(userSelectedCards);
    }
    
    // Calculate prize pool and player count
    const activePlayers = betSessions.filter(session => session.status === 'active').length;
    const pool = activePlayers * betAmount * 0.8;
    setPrizePool(pool);
    setPlayerCount(activePlayers);
  };

  const handleSessionCreated = (session: GameSession) => {
    if (session.betAmount === betAmount) {
      // Update occupied cards
      setOccupiedCards(prev => [...prev, session.cardNumber]);
      
      // Update card-user mapping
      setOccupiedCardsByUser(prev => ({
        ...prev,
        [session.cardNumber]: session.userId._id // Use session.userId._id
      }));
      
      // Update player count and prize pool
      setPlayerCount(prev => prev + 1);
      setPrizePool(prev => prev + betAmount * 0.8);
      
      // If this session belongs to the current user, add to selected players
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

    // Check if this card is already selected by the current user
    const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
    
    if (isSelectedByUser) {
      // Deselect the card - delete session and refund
      setIsLoading(true);
      try {
        // Delete game session via WebSocket
        webSocketService.send('delete-session', {
          cardNumber: id,
          betAmount,
        });
        
        // Remove from selected players
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

    // If card is occupied by someone else, show error
    if (occupiedCards.includes(id) && occupiedCardsByUser[id] !== user._id) {
      setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ የተመረጠ ነው" : "This card is already selected!");
      setWalletError(true);
      return;
    }

    // Select a new card
    if (selectedPlayers.length < 2) {
      if (wallet < betAmount) {
        setErrorMessage(language === 'am' ? "በበቂ ሁኔታ ገንዘብ የሎትም" : "Insufficient balance!");
        setWalletError(true);
        return;
      }

      setIsLoading(true);
      try {
        // Create game session via WebSocket
        webSocketService.send('create-session', {
          userId: user._id,
          cardNumber: id,
          betAmount,
          createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()
        });
        
        // Add to selected players
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
      {/* Timer Display */}
      <Box sx={{
        p: 2,
        background: 'linear-gradient(135deg, #ff4b1f 0%, #ff9068 100%)',
        color: 'white',
        textAlign: 'center',
        mb: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {language === 'am' ? 'ጨዋታ ይጀምራል በ' : 'Game starts in'} {remainingTime}s
        </Typography>
      </Box>

      {/* Bet Amount and Stats Row */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        background: 'rgba(255,255,255,0.8)', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <TextField
          label={language === 'am' ? "የተጫዋቾች በቢር" : "Bet (Birr)"}
          type="number"
          size="small"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          sx={{ 
            width: { xs: '100%', sm: 150 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
          InputProps={{
            inputProps: { min: 0 }
          }}
        />

        <Typography variant="h6">
          {remainingTime}s {language === 'am' ? 'ይቀራል' : 'left'} 
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          {/* Selected Players Card */}
          <Card sx={{
            minWidth: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="white">
                {language === 'am' ? "ተጫዋቾች" : "Players"}
              </Typography>
              <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                {playerCount}
              </Typography>
            </CardContent>
          </Card>
          
          {/* Prize Pool Card */}
          <Card sx={{
            minWidth: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #FF9800, #FFC107)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="white">
                {language === 'am' ? "ደራሽ" : "Derash"}
              </Typography>
              <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                {prizePool.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* User Info and Wallet */}
      {user && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          background: 'rgba(255,255,255,0.8)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h6">
            {language === 'am' ? 'ተጠቃሚ' : 'User'}: {user.phone}
          </Typography>
          <Card sx={{
            minWidth: 100,
            height: 60,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #2196F3, #21CBF3)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="body2" color="white">
                {language === 'am' ? "የተቀማጭ ሂሳብ" : "Wallet"}
              </Typography>
              <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                {wallet.toFixed(2)} ብር
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Main Game Lobby Content */}
      <Box sx={{ 
        p: { xs: 1, sm: 2 }, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '60vh',
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
            gridTemplateColumns: `repeat(10, ${buttonSize}px)`,
            gridAutoRows: `${buttonSize}px`,
            gap: 1,
            justifyContent: 'center',
            p: 2,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'auto',
            mb: 2,
            mx: 'auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map((id) => {
            const isOccupied = occupiedCards.includes(id);
            const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
            const isSelectedByOthers = isOccupied && !isSelectedByUser;
            
            return (
              <motion.div
                key={id}
                whileHover={{ scale: isSelectedByOthers ? 1 : 1.1 }}
                whileTap={{ scale: isSelectedByOthers ? 1 : 0.95 }}
                style={{ width: buttonSize, height: buttonSize }}
              >
                <Button
                  variant={isSelectedByUser ? "contained" : isSelectedByOthers ? "outlined" : "outlined"}
                  color={
                    isSelectedByUser ? "success" : 
                    isSelectedByOthers ? "error" : "primary"
                  }
                  onClick={() => togglePlayer(id)}
                  disabled={(isSelectedByOthers) || isLoading || remainingTime <= 0}
                  sx={{ 
                    minWidth: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    fontSize: buttonSize > 40 ? '1.2rem' : buttonSize > 30 ? '1rem' : '0.8rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelectedByUser 
                      ? '0 4px 8px rgba(76,175,80,0.3)'
                      : isSelectedByOthers 
                        ? '0 2px 4px rgba(244,67,54,0.2)'
                        : '0 2px 4px rgba(33,150,243,0.2)',
                    background: isSelectedByUser 
                      ? 'linear-gradient(145deg, #4CAF50, #8BC34A)'
                      : isSelectedByOthers 
                        ? 'linear-gradient(145deg, #ffcdd2, #ef9a9a)'
                        : 'linear-gradient(145deg, #ffffff, #e0e0e0)',
                    border: isSelectedByUser 
                      ? '2px solid #2E7D32'
                      : isSelectedByOthers 
                        ? '2px solid #d32f2f'
                        : '2px solid #e0e0e0',
                    '&:hover': {
                      background: isSelectedByUser 
                        ? 'linear-gradient(145deg, #388E3C, #689F38)'
                        : isSelectedByOthers 
                          ? 'linear-gradient(145deg, #ef9a9a, #e57373)'
                          : 'linear-gradient(145deg, #f5f5f5, #e0e0e0)'
                    }
                  }}
                >
                  {isLoading && isSelectedByUser ? (
                    <CircularProgress size={buttonSize > 40 ? 24 : 20} />
                  ) : (
                    id
                  )}
                </Button>
              </motion.div>
            );
          })}
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