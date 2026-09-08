'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, Box, Typography, Card, CardContent, 
  useTheme, useMediaQuery, Alert, Snackbar, TextField,
  IconButton, Modal, Switch,
  FormControlLabel, Select, MenuItem,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { getCardById } from '@/app/utils/generateCards';
import Confetti from 'react-confetti';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface Winner {
  id: number;
  userId: string;
  prize?: number;
  totalWinners?: number;
}

interface GameEndData {
  winners: { id: string; card: number }[];
  prizePool: number;
  split: number;
  totalWinners: number;
  betAmount: number;
}

interface GameSession {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  gameId: string;
  status: string;
  createdAt: string;
  cardNumbers: number[][];
}

interface FullGameInterfaceProps {
  players: PlayerSelection[]; 
  bet: number;
  gameId: string;
  onGameEnd: () => void;
  onBackToPlayerLobby: () => void;
  language?: 'en' | 'am';
  earningsPercentage?: number;
  setLanguage?: (lang: 'en' | 'am') => void;
  backgroundColor?: string;
  setBackgroundColor?: (color: string) => void;
}

const FullGameInterface = ({ 
  players, 
  bet,
  gameId,
  onGameEnd,
  onBackToPlayerLobby,
  language = 'am',
  earningsPercentage = 20,
  setLanguage,
  backgroundColor = 'white',
  setBackgroundColor
}: FullGameInterfaceProps) => {
  // State declarations
  const [calledNumbers, setCalledNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [autoPlayOn, setAutoPlayOn] = useState(true);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showLoserModal, setShowLoserModal] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [blockedPlayers, setBlockedPlayers] = useState<number[]>([]);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [userMarkedNumbers, setUserMarkedNumbers] = useState<{[key: string]: boolean}>({});
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loserMessage, setLoserMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [loserCardId, setLoserCardId] = useState<number | null>(null);
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [voiceService, setVoiceService] = useState<any>(null);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Game control state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameStopped, setGameStopped] = useState(false);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [announcedWinners, setAnnouncedWinners] = useState<Array<{userId: string; card: number}>>([]);
  const [gracePeriodCountdown, setGracePeriodCountdown] = useState(3);
  const [submittedBingoCards, setSubmittedBingoCards] = useState<number[]>([]);
  const [totalNumbers, setTotalNumbers] = useState(75);
  const [remainingNumbers, setRemainingNumbers] = useState(75);
  
  // Auto-close countdown state
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(7);
  
  // Refs
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Audio functions
  const playAmharicNumberAudio = (number: string) => {
    if (!soundOn) return;
    try {
      const [letter, num] = number.split('-');
      const audioPath = `/Audio/${letter}/${letter}${num}.aac`;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(audioPath);
      audioRef.current.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const playGameAudio = (soundType: 'won' | 'not-won') => {
    if (!soundOn) return;
    try {
      const audioPath = `/Audio/game/${soundType}.mp3`;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(audioPath);
      audioRef.current.play().catch(error => {
        console.warn('Game audio play failed:', error);
      });
    } catch (error) {
      console.error('Error playing game audio:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    const loadBrowserModules = async () => {
      try {
        const voiceModule = await import('@/app/utils/voiceService');
        setVoiceService(voiceModule.voiceService);
        const wsModule = await import('@/app/utils/websocket');
        setWebSocketService(wsModule.webSocketService);
      } catch (error) {
        console.error('Failed to load browser modules:', error);
      }
    };
    loadBrowserModules();
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]);

  useEffect(() => {
    if (calledNumbers.length > 0) {
      const recent = calledNumbers.slice(-2);
      setRecentNumbers(recent);
    }
  }, [calledNumbers]);

  useEffect(() => {
    if (!isClient || !webSocketService) return;

    const handleNumberCalled = (data: { 
      gameId: string; 
      number: string; 
      calledNumbers: string[];
      totalNumbers: number;
      remaining: number;
    }) => {
      if (data.gameId !== gameId) return;
      
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers);
      setTotalNumbers(data.totalNumbers);
      setRemainingNumbers(data.remaining);
      setIsCalling(true);
      
      if (soundOn) {
        if (language === 'am') {
          playAmharicNumberAudio(data.number);
        }
      }
    };

    const handleGameStopped = (data: { 
      gameId: string; 
      firstWinner: { userId: string; card: number };
      message: string;
    }) => {
      if (data.gameId !== gameId) return;
      
      setGameStopped(true);
      setGracePeriodActive(true);
      setGracePeriodCountdown(4);
      setIsCalling(false);
      setToastMessage(data.message);
      setShowToast(true);
    };

    const handleWinnerAnnounced = (data: {
      gameId: string;
      winnerId: string;
      winnerCard: number;
      totalWinnersSoFar: number;
      message: string;
    }) => {
      if (data.gameId !== gameId) return;
      
      setAnnouncedWinners(prev => {
        const isDuplicate = prev.some(w => w.userId === data.winnerId && w.card === data.winnerCard);
        if (!isDuplicate) {
          return [...prev, { userId: data.winnerId, card: data.winnerCard }];
        }
        return prev;
      });
      
      setToastMessage(data.message);
      setShowToast(true);
    };

    const handleGameEnded = (data: GameEndData & { gameId: string }) => {
      if (data.gameId !== gameId) return;
      
      setGameEnded(true);
      setGracePeriodActive(false);
      setGameStopped(true);
      setIsCalling(false);
      setSubmittedBingoCards([]);
      
      const formattedWinners: Winner[] = data.winners.map(winner => ({
        id: winner.card,
        userId: winner.id,
        prize: data.split,
        totalWinners: data.totalWinners
      }));
      
      setWinners(formattedWinners);
      setGameEndData(data);

      const userCardNumbers = players.map(p => p.id);
      const userWon = user && data.winners.some(winner => 
        userCardNumbers.includes(winner.card)
      );
      
      if (userWon) {
        playGameAudio('won');
        setTimeout(() => setShowWinnerModal(true), 1000);
      } else {
        playGameAudio('not-won');
        setShowGameOverModal(true);
      }
    };

    const handleGameState = (data: { 
      gameId: string; 
      calledNumbers: string[]; 
      currentNumber: string;
      totalNumbers: number;
      remaining: number;
    }) => {
      if (data.gameId !== gameId) return;
      
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.currentNumber);
      setTotalNumbers(data.totalNumbers);
      setRemainingNumbers(data.remaining);
    };

    const handleSessionsUpdate = (sessions: GameSession[]) => {
      const gameSessions = sessions.filter(session => session.gameId === gameId);
      setGameSessions(gameSessions);
      
      const activePlayers = gameSessions.filter(
        (session) => session.status !== "active"
      ).length;
      setNumberOfPlayers(activePlayers);
      
      const pool = activePlayers * bet * 0.8;
      setPrizePool(pool);
    };

    webSocketService.off('full-number-called', handleNumberCalled);
    webSocketService.off('full-game-stopped', handleGameStopped);
    webSocketService.off('full-winner-announced', handleWinnerAnnounced);
    webSocketService.off('full-game-ended', handleGameEnded);
    webSocketService.off('full-game-state', handleGameState);
    webSocketService.off('full-sessions-updated', handleSessionsUpdate);

    webSocketService.on('full-number-called', handleNumberCalled);
    webSocketService.on('full-game-stopped', handleGameStopped);
    webSocketService.on('full-winner-announced', handleWinnerAnnounced);
    webSocketService.on('full-game-ended', handleGameEnded);
    webSocketService.on('full-game-state', handleGameState);
    webSocketService.on('full-sessions-updated', handleSessionsUpdate);

    webSocketService.send('get-full-sessions', { gameId });
    webSocketService.send('get-full-game-state', { gameId });

    return () => {
      webSocketService.off('full-number-called', handleNumberCalled);
      webSocketService.off('full-game-stopped', handleGameStopped);
      webSocketService.off('full-winner-announced', handleWinnerAnnounced);
      webSocketService.off('full-game-ended', handleGameEnded);
      webSocketService.off('full-game-state', handleGameState);
      webSocketService.off('full-sessions-updated', handleSessionsUpdate);
    };
  }, [isClient, webSocketService, gameId, bet, language, user, soundOn, players]);

  // Auto-play effect
  useEffect(() => {
    if (autoPlayOn && gameStarted && !gameStopped && calledNumbers.length > 0) {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      
      autoPlayTimerRef.current = setTimeout(() => {
        checkAndAutoMarkNumbers();
      }, 200);
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [autoPlayOn, gameStarted, gameStopped, calledNumbers, currentNumber]);

  // Auto-close countdown
  useEffect(() => {
    if (showWinnerModal || showGameOverModal) {
      setAutoCloseCountdown(7);
      
      if (autoCloseTimerRef.current) {
        clearInterval(autoCloseTimerRef.current);
      }
      
      autoCloseTimerRef.current = setInterval(() => {
        setAutoCloseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(autoCloseTimerRef.current!);
            if (showWinnerModal) {
              setShowWinnerModal(false);
              onBackToPlayerLobby();
            } else if (showGameOverModal) {
              setShowGameOverModal(false);
              onBackToPlayerLobby();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (autoCloseTimerRef.current) {
          clearInterval(autoCloseTimerRef.current);
        }
      };
    }
  }, [showWinnerModal, showGameOverModal, onBackToPlayerLobby]);

  const isNumberCalled = (number: number, letter: string) => {
    if (number === 0) return true;
    const fullNumber = `${letter}-${number}`;
    return calledNumbers.includes(fullNumber);
  };

  const checkAndAutoMarkNumbers = useCallback(() => {
    if (!autoPlayOn || !gameStarted || gameStopped) return;

    const userCards = players.filter(p => p.userId === user?._id);
    
    userCards.forEach(player => {
      if (blockedPlayers.includes(player.id)) return;
      if (submittedBingoCards.includes(player.id)) return;
      
      const card = getCardById(player.id);
      const transposedCard = transposeCard(card);
      let anyNewMark = false;
      
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const num = transposedCard[row][col];
          const letter = "BINGO"[col];
          const fullNumber = `${letter}-${num}`;
          const isFreeSpace = (col === 2 && row === 2);
          
          if (!isFreeSpace && num !== 0) {
            if (calledNumbers.includes(fullNumber)) {
              setUserMarkedNumbers(prev => ({
                ...prev,
                [fullNumber]: true
              }));
              anyNewMark = true;
            }
          }
        }
      }
      
      if (anyNewMark) {
        handleBingo(player.id);
      }
    });
  }, [autoPlayOn, gameStarted, gameStopped, blockedPlayers, submittedBingoCards, calledNumbers, players, user]);

  const checkFullCardWin = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return { isWinner: false, message: 'Player not found' };
    }

    if (blockedPlayers.includes(playerId)) {
      return { isWinner: false, message: 'Player is blocked' };
    }

    const card = getCardById(playerId);
    const transposedCard = transposeCard(card);
    const calledSet = new Set(calledNumbers);

    // Check every number on the card
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const num = transposedCard[row][col];
        const isFreeSpace = (col === 2 && row === 2);
        
        if (!isFreeSpace && num !== 0) {
          const letter = "BINGO"[col];
          const fullNumber = `${letter}-${num}`;
          if (!calledSet.has(fullNumber)) {
            return { 
              isWinner: false, 
              message: `Number ${fullNumber} not called yet`,
              missingNumber: fullNumber
            };
          }
        }
      }
    }

    return { isWinner: true, message: 'All numbers called!' };
  };

  const handleBingo = async (playerId: number) => {
    if (!gameStarted) {
      setToastMessage(language === 'am' ? 'ጨዋታው አላለቀም!' : 'Game has not started!');
      setShowToast(true);
      return;
    }

    if (submittedBingoCards.includes(playerId)) {
      return;
    }

    const result = checkFullCardWin(playerId);
    
    if (result.isWinner) {
      try {
        console.log(`Player ${playerId} claims full BINGO!`);
        
        setSubmittedBingoCards(prev => [...prev, playerId]);
        
        if (webSocketService) {
          webSocketService.send('end-full-game', {
            gameId: gameId,
            winnerId: players.find(p => p.id === playerId)?.userId,
            winnerCard: playerId
          });
        }
      } catch (error) {
        console.error('Error announcing win:', error);
        setToastMessage(language === 'am' ? 'የአሸናፊ ማስታወቂያ አልተሳካም!' : 'Win announcement failed!');
        setShowToast(true);
        setSubmittedBingoCards(prev => prev.filter(id => id !== playerId));
      }
    } else {
      const message = language === 'am' 
        ? `ቁጥር ${result.missingNumber || ''} ገና አልተጠራም` 
        : `Number ${result.missingNumber || ''} not called yet`;
      setLoserMessage(message);
      setLoserCardId(playerId);
      setShowLoserModal(true);
      playGameAudio('not-won');
    }
  };

  const handleBackToLobbyWithRefund = async () => {
    try {
      if (!user) return;

      if (webSocketService) {
        webSocketService.send('refund-full-wallet', {
          gameId: gameId,
          userId: user._id
        });
        
        webSocketService.once('wallet-updated', () => {
          onBackToPlayerLobby();
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const toggleUserMark = (number: string) => {
    setUserMarkedNumbers(prev => ({
      ...prev,
      [number]: !prev[number]
    }));
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

  const userCards = players.filter(p => p.userId === user?._id);

  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: backgroundColor === 'white' 
          ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          : backgroundColor,
        color: getTextColor()
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 0,
      pt: 0,
      textAlign: 'center',
      background: backgroundColor === 'white' 
        ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        : backgroundColor,
      minHeight: '40vh',
      display: 'flex',
      flexDirection: 'column',
      color: getTextColor()
    }}>
      {/* Stats Header */}
      <Box sx={{
        display: 'flex',
        gap: 0.75,
        p: 0.5,
        mb: 1,
        flexWrap: 'nowrap',
        overflow: 'auto',
        color: getTextColor(),
        width: '100%'
      }}>
        <Card sx={{
          flex: '0 0 20%',
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
            {language === 'am' ? 'ተጠሩ' : 'Called'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {calledNumbers.length}/{totalNumbers}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 20%',
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
            {language === 'am' ? 'የቀሩ' : 'Remaining'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            {remainingNumbers}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 20%',
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
            {numberOfPlayers}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 20%',
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
            {language === 'am' ? 'አሁን' : 'Curr'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
            {currentNumber || "-"}
          </Typography>
        </Card>

        <Card sx={{
          flex: '0 0 20%',
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
            {language === 'am' ? 'ደራሽ' : 'Prize'}
          </Typography>
          <Typography sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1.1rem' }}>
            {prizePool.toFixed(0)}
          </Typography>
        </Card>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'row' },
        flex: 1,
        gap: 0.5,
        minHeight: '24vh',
        overflow: 'hidden'
      }}>
        {/* Left Side - Number Grid */}
        <Box sx={{ 
          flex: '0 0 40%',
          display: 'flex',
          flexDirection: 'column',
          p: 0.5,
          background: getCardBackground(),
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'auto',
          minHeight: '25vh',
          minWidth: 0,
          color: getTextColor()
        }}>
          {/* BINGO Header */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: 0.5, 
            mb: 1 
          }}>
            {['B', 'I', 'N', 'G', 'O'].map(letter => (
              <Box key={letter} sx={{
                p: 0.5,
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                borderRadius: 1,
                fontSize: '0.9rem'
              }}>
                {letter}
              </Box>
            ))}
          </Box>

          {/* Number Grid */}
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gridAutoRows: "minmax(30px, auto)",
              gap: 0.15,
              overflow: "auto",
              p: 0.15,
            }}
          >
            {["B", "I", "N", "G", "O"].map((letter, colIndex) => {
              const ranges = [
                { min: 1, max: 15 },
                { min: 16, max: 30 },
                { min: 31, max: 45 },
                { min: 46, max: 60 },
                { min: 61, max: 75 },
              ];

              return (
                <Box
                  key={letter}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.2,
                  }}
                >
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = ranges[colIndex].min + i;
                    const fullNumber = `${letter}-${num}`;
                    const isCalled = calledNumbers.includes(fullNumber);

                    return (
                      <motion.div key={num} whileHover={{ scale: 1.05 }}>
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            minHeight: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            background: isCalled
                                ? "linear-gradient(135deg, #c62828, #ef5350)"
                                : backgroundColor === 'white'
                                  ? "linear-gradient(135deg, #fafafa, #e9e9e9)"
                                  : "rgba(255,255,255,0.15)",
                            color: isCalled ? "white" : getTextColor(),
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            transition: "all 0.15s ease-in-out",
                            border: isCalled
                              ? "2px solid #b71c1c"
                              : backgroundColor === 'white'
                                ? "2px solid #cfcfcf"
                                : "2px solid rgba(255,255,255,0.2)",
                            boxShadow: isCalled
                              ? "0 2px 5px rgba(0,0,0,0.20)"
                              : "0 1px 3px rgba(0,0,0,0.10)",
                          }}
                        >
                          {num}
                        </Box>
                      </motion.div>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Right Side - Controls and Cards */}
        <Box sx={{ 
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: '25vh',
        }}>
          {/* Controls */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.75,
            flexWrap: 'nowrap',
            justifyContent: 'center',
            width: '100%',
            mb: 0.5
          }}>
            {/* Sound Toggle */}
            <Card sx={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.5,
              px: 1,
              background: getCardBackground(),
              borderRadius: 1.5,
              minHeight: '5vh',
              color: getTextColor(),
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography sx={{ 
                fontWeight: 'bold', 
                fontSize: '0.6rem', 
                color: getTextColor(), 
                whiteSpace: 'nowrap',
                mb: 0.25
              }}>
                {soundOn ? '🔊' : '🔇'} {language === 'am' ? 'ድምፅ' : 'Sound'}
              </Typography>
              <Switch
                checked={soundOn}
                onChange={() => setSoundOn(!soundOn)}
                color="primary"
                size="small"
                sx={{ 
                  '& .MuiSwitch-track': { width: 28 },
                  '& .MuiSwitch-thumb': { width: 14, height: 14 },
                  '& .MuiSwitch-switchBase': { padding: '4px' }
                }}
              />
            </Card>

            {/* Auto-play Toggle */}
            <Card sx={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.5,
              px: 1,
              background: getCardBackground(),
              borderRadius: 1.5,
              minHeight: '5vh',
              color: getTextColor(),
              border: autoPlayOn ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography sx={{ 
                fontWeight: 'bold', 
                fontSize: '0.6rem', 
                color: autoPlayOn ? '#4CAF50' : getTextColor(),
                whiteSpace: 'nowrap',
                mb: 0.25
              }}>
                🤖 {language === 'am' ? 'አውቶ' : 'Auto'}
              </Typography>
              <Switch
                checked={autoPlayOn}
                onChange={() => setAutoPlayOn(!autoPlayOn)}
                color="success"
                size="small"
                sx={{ 
                  '& .MuiSwitch-track': { width: 28 },
                  '& .MuiSwitch-thumb': { width: 14, height: 14 },
                  '& .MuiSwitch-switchBase': { padding: '4px' }
                }}
              />
            </Card>
          </Box>

          {/* User Cards */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 0.5,
            background: getCardBackground(),
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: '25vh',
            color: getTextColor()
          }}>
            {userCards.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 0.5, fontSize: '0.8rem' }}>
                {language === 'am' ? 'ምንም ካርዶች አልተመረጡም' : 'No cards selected'}
              </Typography>
            ) : (
              userCards.map(player => {
                const card = getCardById(player.id);
                const isBlocked = blockedPlayers.includes(player.id);
                const hasSubmittedBingo = submittedBingoCards.includes(player.id);
                
                return (
                  <Card 
                    key={player.id} 
                    sx={{ 
                      p: 0.4,
                      background: isBlocked 
                        ? "rgba(244,67,54,0.10)" 
                        : getCardBackground(),
                      border: isBlocked 
                        ? "2px solid #f44336" 
                        : "1.5px solid rgba(255,255,255,0.2)",
                      borderRadius: "4px",
                      boxShadow: isBlocked
                        ? "0 2px 6px rgba(244,67,54,0.25)"
                        : "0 2px 5px rgba(0,0,0,0.10)",
                      transition: "all 0.2s ease",
                      color: getTextColor()
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: "1rem",
                        color: isBlocked ? "#d32f2f" : getTextColor()
                      }}
                    >
                      {language === "am" ? "ካርድ" : "Card"} #{player.id}
                      {isBlocked && ` (${language === "am" ? "ታግዷል" : "Blocked"})`}
                      {hasSubmittedBingo && ` (${language === "am" ? "ቀርቧል" : "Submitted"})`}
                    </Typography>

                    {/* BINGO Card Container */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 0.15,
                        mb: 0.6
                      }}
                    >
                      {/* BINGO Header */}
                      {["B", "I", "N", "G", "O"].map((letter) => (
                        <Box
                          key={letter}
                          sx={{
                            p: 0.4,
                            background: "linear-gradient(135deg, #1976d2, #2196f3)",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "6px 6px 0 0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                          }}
                        >
                          {letter}
                        </Box>
                      ))}

                      {/* Card Numbers */}
                      {transposeCard(card).map((row, rowIdx) =>
                        row.map((num, colIdx) => {
                          const letter = "BINGO"[colIdx];
                          const fullNumber = `${letter}-${num}`;
                          const isUserMarked = userMarkedNumbers[fullNumber];

                          return (
                            <Box
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => toggleUserMark(fullNumber)}
                              sx={{
                                p: 0.35,
                                border: isUserMarked || (rowIdx === 2 && colIdx === 2)
                                  ? "2px solid #2E7D32"
                                  : backgroundColor === 'white'
                                    ? "2px solid #cfcfcf"
                                    : "2px solid rgba(255,255,255,0.2)",
                                borderRadius: "4px",
                                background:
                                  rowIdx === 2 && colIdx === 2
                                    ? "#4CAF50"
                                    : isUserMarked
                                    ? "#4CAF50"
                                    : backgroundColor === 'white'
                                      ? "linear-gradient(135deg, #ffffff, #f1f1f1)"
                                      : "rgba(255,255,255,0.1)",
                                color: isUserMarked ? "white" : getTextColor(),
                                fontWeight: isUserMarked ? "bold" : "normal",
                                fontSize: "1rem",
                                minHeight: 26,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: isUserMarked
                                  ? "0 2px 5px rgba(0,0,0,0.20)"
                                  : "0 1px 3px rgba(0,0,0,0.10)",
                                "&:hover": {
                                  background: isUserMarked
                                    ? "#388E3C"
                                    : "rgba(0,0,0,0.08)"
                                }
                              }}
                            >
                              {num === 0 ? (
                                <Box sx={{ 
                                  color: 'white',
                                  fontSize: '1.15rem',
                                  fontWeight: 'bold',
                                  textShadow: '0 0 12px rgba(255,255,255,0.3)',
                                  lineHeight: 1,
                                  animation: 'pulse 2s infinite'
                                }}>
                                  ★
                                </Box>
                              ) : num}
                            </Box>
                          );
                        })
                      )}
                    </Box>

                    {/* Bingo Button */}
                    <Button
                      variant={getButtonVariant()}
                      color="success"
                      onClick={() => handleBingo(player.id)}
                      disabled={
                        isBlocked || !gameStarted || submittedBingoCards.includes(player.id)
                      }
                      fullWidth
                      size="small"
                      sx={{
                        fontSize: "0.9rem",
                        borderRadius: "6px",
                        opacity:
                          isBlocked || !gameStarted || submittedBingoCards.includes(player.id)
                            ? 0.6
                            : 1,
                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        ...getButtonStyle()
                      }}
                    >
                      {submittedBingoCards.includes(player.id)
                        ? language === "am"
                          ? "ቀርቧል"
                          : "SUBMITTED"
                        : "BINGO"}
                    </Button>
                  </Card>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Toast Message */}
      <Snackbar
        open={showToast}
        autoHideDuration={2000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Winner Modal */}
      <Modal open={showWinnerModal} onClose={() => {
        if (autoCloseTimerRef.current) {
          clearInterval(autoCloseTimerRef.current);
        }
        setShowWinnerModal(false);
        onGameEnd();
      }}>
        <>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
          />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95%',
            maxWidth: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: '3px solid gold',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <IconButton
              aria-label="close"
              onClick={() => {
                if (autoCloseTimerRef.current) {
                  clearInterval(autoCloseTimerRef.current);
                }
                setShowWinnerModal(false);
                onGameEnd();
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'white'
              }}
            >
              <CloseIcon />
            </IconButton>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h4" gutterBottom sx={{ 
                color: 'gold',
                mb: 2,
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(255,215,0,0.7)',
                fontSize: '1.8rem'
              }}>
                {language === 'am' ? 'እንኳን ደስ ያለህ! 🎉' : '🎉 CONGRATULATIONS! 🎉'}
              </Typography>
            </motion.div>

            {/* Auto-close countdown */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>
                {language === 'am' ? 'ወደ ሎቢ ይመለሳል:' : 'Returning to lobby in:'}
              </Typography>
              <Box sx={{
                backgroundColor: 'rgba(255,215,0,0.2)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid gold'
              }}>
                <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {autoCloseCountdown}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>
                s
              </Typography>
            </Box>

            {/* Prize Information */}
            {gameEndData && (
              <Box sx={{ 
                background: 'rgba(255,215,0,0.2)',
                borderRadius: 2,
                p: 2,
                mb: 3,
                border: '2px solid gold'
              }}>
                <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', mb: 1, fontSize: '1.1rem' }}>
                  {language === 'am' ? 'የጨዋታ ውጤት' : 'Game Results'}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.8rem' }}>
                      {language === 'am' ? 'ጠቅላላ ደራሽ' : 'Total Prize Pool'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {gameEndData.prizePool.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.8rem' }}>
                      {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {gameEndData.totalWinners}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.8rem' }}>
                      {language === 'am' ? 'ለእያንዳንዱ' : 'Each Gets'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {gameEndData.split.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Winners List */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: 'white',
                mb: 2,
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
              </Typography>
              
              {winners.map((winner, index) => (
                <Box key={index} sx={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                    {language === 'am' ? 'ተጫዋች' : 'Player'} #{winner.id}
                    {winner.userId === user?._id && ' (You)'}
                  </Typography>
                  <Typography sx={{ color: 'gold', fontWeight: 'bold' }}>
                    +{winner.prize?.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                if (autoCloseTimerRef.current) {
                  clearInterval(autoCloseTimerRef.current);
                }
                setShowWinnerModal(false);
                onBackToPlayerLobby();
              }}
              sx={{ 
                mt: 2,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 4px 12px rgba(255, 105, 135, 0.4)',
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #FE6B8B 40%, #FF8E53 100%)',
                }
              }}
            >
              {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
            </Button>
          </Box>
        </>
      </Modal>

      {/* Loser Modal */}
      <Modal open={showLoserModal} onClose={() => setShowLoserModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 2,
          borderRadius: 3,
          textAlign: 'center',
          border: '3px solid #f44336',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <IconButton
            aria-label="close"
            onClick={() => setShowLoserModal(false)}
            sx={{
              position: 'absolute',
              right: 4,
              top: 4,
              color: 'white'
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          
          <Typography variant="h6" gutterBottom sx={{ 
            color: '#f44336',
            mb: 2,
            fontWeight: 'bold'
          }}>
            {language === 'am' ? 'ይቅርታ!' : 'Sorry!'}
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: 'white',
            mb: 2
          }}>
            {loserMessage}
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setShowLoserModal(false)}
            sx={{ 
              mt: 1,
              fontWeight: 'bold'
            }}
          >
            {language === 'am' ? 'እሺ' : 'OK'}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default FullGameInterface;