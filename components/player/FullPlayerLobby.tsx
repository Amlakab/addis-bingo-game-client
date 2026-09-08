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
  cardNumbers: number[][];
  __v: number;
}

const FullPlayerLobby = ({ 
  onStartGame,
  gameId,
  betAmount,
  language = 'am',
  setLanguage,
  onBackToLobby,
  onDirectToGame,
  backgroundColor = 'white',
  setBackgroundColor
}: FullPlayerLobbyProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelection[]>([]);
  const [wallet, setWallet] = useState(0);
  const [walletError, setWalletError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [occupiedCards, setOccupiedCards] = useState<number[]>([]);
  const [occupiedCardsByUser, setOccupiedCardsByUser] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const { user } = useAuth();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
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
    
    webSocketService.on('full-sessions-updated', handleSessionsUpdate);
    webSocketService.on('full-session-created', handleSessionCreated);
    webSocketService.on('wallet-updated', handleWalletUpdate);
    
    webSocketService.send('get-full-sessions', { gameId });
    
    return () => {
      webSocketService.off('full-sessions-updated', handleSessionsUpdate);
      webSocketService.off('full-session-created', handleSessionCreated);
      webSocketService.off('wallet-updated', handleWalletUpdate);
    };
  }, [isClient, webSocketService, user, gameId]);

  const handleSessionsUpdate = (sessions: GameSession[]) => {
    const betSessions = sessions.filter(session => session.gameId === gameId);
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
  };

  const handleSessionCreated = (session: GameSession) => {
    if (session.gameId === gameId) {
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

  // REMOVED: togglePlayer function - users cannot unselect
  // Users can only select cards, not unselect them

  const handleSelectCard = async (id: number) => {
    if (!isClient || !webSocketService) return;
    
    if (!user) {
      setErrorMessage(language === 'am' ? "እባክዎ በመጀመሪያ ይግቡ" : "Please login first!");
      setWalletError(true);
      return;
    }

    const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
    const isSelectedByOthers = occupiedCards.includes(id) && !isSelectedByUser;
    
    // If already selected by user, do nothing (cannot unselect)
    if (isSelectedByUser) {
      setToastMessage(language === 'am' 
        ? 'ይህ ካርድ አስቀድሞ ተመርጧል' 
        : 'This card is already selected'
      );
      setShowToast(true);
      return;
    }
    
    if (isSelectedByOthers) {
      setErrorMessage(language === 'am' ? "ይህ ካርድ ቀድሞውኑ በሌላ ተጠቃሚ የተመረጠ ነው" : "This card is already selected by another user!");
      setWalletError(true);
      return;
    }

    try {
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

      // Generate card numbers for this card
      const cardNumbers = getCardGrid(id);
      
      webSocketService.send('create-full-session', {
        userId: user._id,
        agentId: user.agent_id || '',
        cardNumber: id,
        betAmount,
        gameId,
        cardNumbers
      });
      
    } catch (error: any) {
      console.error('Error selecting card:', error);
      const errorMsg = error.response?.data?.error || 
        (language === 'am' ? "ካርድ ሲመርጡ ስህተት ተፈጥሯል" : "Error selecting card");
      setErrorMessage(errorMsg);
      setWalletError(true);
    }
  };

  const handleDirectToGame = async () => {
    if (!isClient || !webSocketService || !user || !onDirectToGame) return;

    try {
      const response = await api.get(`/full-game/sessions/user/${user._id}`);
      const userSessions = response.data;
      
      const currentGameSessions = userSessions.filter((session: GameSession) => 
        session.gameId === gameId && 
        ['active', 'ready'].includes(session.status)
      );

      if (currentGameSessions.length === 0) {
        setToastMessage(language === 'am' 
          ? 'እባክዎ ቢያንስ 1 ካርድ ይምረጡ' 
          : 'Please select at least 1 card'
        );
        setShowToast(true);
        return;
      }

      if (currentGameSessions.length > 2) {
        setToastMessage(language === 'am' 
          ? 'ከ 2 በላይ ካርዶችን መምረጥ አይችሉም' 
          : 'You cannot select more than 2 cards'
        );
        setShowToast(true);
        return;
      }

      const validatedSelectedPlayers: PlayerSelection[] = currentGameSessions.map((session: GameSession) => ({
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

      webSocketService.send('fund-full-wallet', {
        gameId: gameId,
        userId: user._id
      });

      webSocketService.send('update-full-sessions-by-user-bet', {
        userId: user._id,
        betAmount: betAmount,
        status: 'ready'
      });

      onDirectToGame(validatedSelectedPlayers, betAmount, gameId);

    } catch (error) {
      console.error('Error in handleDirectToGame:', error);
      setToastMessage(language === 'am' 
        ? 'ወደ ጨዋታ ለመሄድ ሲገነዘብ ስህተት ተፈጥሯል' 
        : 'Error occurred while processing game entry'
      );
      setShowToast(true);
    }
  };

  // Helper function to get card number grid (5x5 BINGO card)
  const getCardGrid = (cardId: number): number[][] => {
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

  // Transpose card for display
  const transposeCard = (card: number[][]) => {
    const transposed: number[][] = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        transposed[i][j] = card[j][i];
      }
    }
    return transposed;
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
        overflow: 'hidden',
        padding: 0,
        paddingTop: 0
      }}
    >
      {/* Header Row */}
      <Box sx={{
        display: 'flex',
        gap: 0.75,
        p: 0.5,
        mb: 1,
        flexWrap: 'nowrap',
        overflow: 'auto',
        color: getTextColor(),
        width: '100%',
        flexShrink: 0
      }}>
        <Card sx={{
          flex: '0 0 33%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          minHeight: '7vh',
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: getTextColor(), whiteSpace: 'nowrap' }}>
            {language === 'am' ? 'ውርርድ' : 'Bet'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
            {betAmount}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 33%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          minHeight: '7vh',
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: getTextColor(), whiteSpace: 'nowrap' }}>
            {language === 'am' ? 'ተጫዋቾች' : 'Players'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {occupiedCards.length}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 33%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75,
          background: getCardBackground(),
          borderRadius: 1.5,
          minHeight: '7vh',
          color: getTextColor()
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: getTextColor(), whiteSpace: 'nowrap' }}>
            {language === 'am' ? 'የተመረጡ' : 'Selected'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {selectedPlayers.length}
          </Typography>
        </Card>
      </Box>

      {/* Main Content */}
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
            maxHeight: selectedPlayers.length > 0 ? '400px' : '400px',
          }}
        >
          {Array.from({ length: 400 }, (_, i) => i + 1).map((id) => {
            const isOccupied = occupiedCards.includes(id);
            const isSelectedByUser = user && occupiedCardsByUser[id] === user._id;
            const isSelectedByOthers = isOccupied && !isSelectedByUser;
            const isDisabled = isSelectedByOthers || isSelectedByUser;

            return (
              <motion.div
                key={id}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Box
                  onClick={() => !isDisabled && handleSelectCard(id)}
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
                  {id}
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Bottom Section - Shows selected cards and Play button */}
        <Box sx={{ 
          flexShrink: 0,
          width: '100%',
          maxWidth: '100%',
          px: 0.5,
          pb: 0.5,
          mt: 'auto',
        }}>
          {selectedPlayers.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              maxWidth: gridContainerRef.current ? gridContainerRef.current.offsetWidth : '100%',
              mx: 'auto',
            }}>
              <Button
                variant={getButtonVariant()}
                color="primary"
                onClick={() => {
                  if (onBackToLobby) {
                    onBackToLobby();
                  }
                }}
                sx={{
                  flex: 1,
                  py: 1,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  ...getButtonStyle()
                }}
              >
                {language === 'am' ? 'ተመለስ' : 'Back'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1,
              maxWidth: gridContainerRef.current ? gridContainerRef.current.offsetWidth : '100%',
              mx: 'auto',
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                overflow: 'auto',
              }}>
                {selectedPlayers.map((player, index) => {
                  const card = getCardGrid(player.id);
                  const transposedCard = transposeCard(card);
                  
                  return (
                    <Card
                      key={player.id}
                      sx={{
                        flex: selectedPlayers.length === 1 ? '1' : '0 0 calc(50% - 4px)',
                        minWidth: selectedPlayers.length === 1 ? 'auto' : '45%',
                        p: 0.5,
                        background: getCardBackground(),
                        borderRadius: 1.5,
                        border: '2px solid #4CAF50',
                        boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem',
                          color: getTextColor() 
                        }}>
                          {language === 'am' ? 'ካርድ' : 'Card'} #{player.id}
                        </Typography>
                        {/* NO DELETE/REMOVE BUTTON - Cannot unselect */}
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: 0.15,
                        }}
                      >
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
                                  background: isFreeSpace
                                    ? 'rgba(76,175,80,0.3)'
                                    : 'rgba(255,255,255,0.05)',
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

              {/* Play Button */}
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
                  '&:disabled': {
                    background: '#bdc3c7',
                  }
                }}
              >
                {language === 'am' ? 'ጨዋታ ጀምር' : 'Start Game'}
              </Button>
            </Box>
          )}
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

export default FullPlayerLobby;