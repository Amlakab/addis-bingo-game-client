'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, Box, Typography, Card, 
  Alert, Snackbar, IconButton, Modal, Switch,
  Select, MenuItem, CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { getCardById } from '@/app/utils/generateCards';
import Confetti from 'react-confetti';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/auth';

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

interface BetTimerState {
  status: 'ready' | 'active' | 'in-progress';
  timer: number;
  playerCount: number;
  prizePool: number;
  createdAt: Date | null;
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
  setLanguage,
  backgroundColor = 'white',
}: FullGameInterfaceProps) => {
  const [calledNumbers, setCalledNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false); // ✅ Added missing state
  const [isCalling, setIsCalling] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [autoPlayOn, setAutoPlayOn] = useState(true);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showLoserModal, setShowLoserModal] = useState(false);
  const [loserCardId, setLoserCardId] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [blockedPlayers, setBlockedPlayers] = useState<number[]>([]);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [userMarkedNumbers, setUserMarkedNumbers] = useState<{[key: string]: boolean}>({});
  const [prizePool, setPrizePool] = useState(players.length * bet * 0.8);
  const [numberOfPlayers, setNumberOfPlayers] = useState(players.length);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loserMessage, setLoserMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const [voiceService, setVoiceService] = useState<any>(null);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  
  const [gameStopped, setGameStopped] = useState(false);
  const [submittedBingoCards, setSubmittedBingoCards] = useState<number[]>([]);
  const [totalNumbers] = useState(75);
  const [remainingNumbers, setRemainingNumbers] = useState(75);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(7);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      default: return 'rgba(255, 255, 255, 0.9)';
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
      audioRef.current.play().catch(() => {
        if (voiceService) voiceService.speak(number, 'am-ET', 1);
      });
    } catch {
      if (voiceService) voiceService.speak(number, 'am-ET', 1);
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
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    setIsClient(true);
    const loadBrowserModules = async () => {
      try {
        const voiceModule = await import('@/app/utils/voiceService');
        setVoiceService(voiceModule.voiceService);
        const wsModule = await import('@/app/utils/websocket');
        setWebSocketService(wsModule.webSocketService);
      } catch (error) {
        console.error('Failed to load modules:', error);
      }
    };
    loadBrowserModules();
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]);

  useEffect(() => {
    if (calledNumbers.length > 0) {
      setRecentNumbers(calledNumbers.slice(-2));
    }
  }, [calledNumbers]);

  useEffect(() => {
    if (!isClient || !webSocketService) return;

    const handleTimerStatesUpdate = (timerStates: {[key: number]: BetTimerState}) => {
      if (timerStates[bet]) {
        setCountdown(timerStates[bet].timer);
      }
    };

    const handleNumberCalled = (data: { betAmount: number; number: string; calledNumbers: string[]; totalNumbers: number; remaining: number }) => {
      if (data.betAmount !== bet) return;
      
      setGameStarted(true);
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers);
      setRemainingNumbers(data.remaining);
      setIsCalling(true);
      
      if (soundOn) {
        if (language === 'am') {
          playAmharicNumberAudio(data.number);
        } else if (voiceService) {
          voiceService.speak(data.number, 'en-US', 1);
        }
      }
    };

    const handleGameStopped = (data: { betAmount: number; firstWinner: { userId: string; card: number }; message: string }) => {
      if (data.betAmount !== bet) return;
      setGameStopped(true);
      setIsCalling(false);
      setToastMessage(data.message);
      setShowToast(true);
    };

    const handleWinnerAnnounced = (data: { betAmount: number; message: string }) => {
      if (data.betAmount !== bet) return;
      setToastMessage(data.message);
      setShowToast(true);
    };

    const handleGameEnded = (data: GameEndData) => {
      if (data.betAmount !== bet) return;
      
      setGameEnded(true);
      setGameStopped(true);
      setIsCalling(false);
      setSubmittedBingoCards([]);
      
      const formattedWinners: Winner[] = data.winners.map(w => ({
        id: w.card,
        userId: w.id,
        prize: data.split,
        totalWinners: data.totalWinners
      }));
      
      setWinners(formattedWinners);
      setGameEndData(data);

      const userCardNumbers = players.map(p => p.id);
      const userWon = user && data.winners.some(w => userCardNumbers.includes(w.card));
      
      if (userWon) {
        playGameAudio('won');
        setTimeout(() => setShowWinnerModal(true), 800);
      } else {
        playGameAudio('not-won');
        setShowGameOverModal(true);
      }
    };

    const handleGameState = (data: { betAmount: number; calledNumbers: string[]; currentNumber: string; remaining: number }) => {
      if (data.betAmount !== bet) return;
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.currentNumber);
      setRemainingNumbers(data.remaining);
      if (data.calledNumbers.length > 0) {
        setGameStarted(true);
        setIsCalling(true);
      }
    };

    const handleSessionsUpdate = (sessions: any[]) => {
      const currentSessions = sessions.filter(s => s.betAmount === bet);
      setNumberOfPlayers(currentSessions.length);
      setPrizePool(currentSessions.length * bet * 0.8);
    };

    webSocketService.on('full-timer-states-update', handleTimerStatesUpdate);
    webSocketService.on('full-number-called', handleNumberCalled);
    webSocketService.on('full-game-stopped', handleGameStopped);
    webSocketService.on('full-winner-announced', handleWinnerAnnounced);
    webSocketService.on('full-game-ended', handleGameEnded);
    webSocketService.on('full-game-state', handleGameState);
    webSocketService.on('full-sessions-updated', handleSessionsUpdate);

    webSocketService.send('start-full-game', { betAmount: bet });
    webSocketService.send('get-full-game-state', { betAmount: bet });
    webSocketService.send('get-full-sessions', { betAmount: bet });
    webSocketService.send('get-full-timer-states');

    return () => {
      webSocketService.off('full-timer-states-update', handleTimerStatesUpdate);
      webSocketService.off('full-number-called', handleNumberCalled);
      webSocketService.off('full-game-stopped', handleGameStopped);
      webSocketService.off('full-winner-announced', handleWinnerAnnounced);
      webSocketService.off('full-game-ended', handleGameEnded);
      webSocketService.off('full-game-state', handleGameState);
      webSocketService.off('full-sessions-updated', handleSessionsUpdate);
    };
  }, [isClient, webSocketService, bet, language, user, soundOn, players]);

  // Full Card Win Validation (All 24 numbers must be called)
  const checkFullCardWin = useCallback((playerId: number) => {
    const card = getCardById(playerId);
    if (!card) return { isWinner: false, message: 'Card not found' };

    const transposedCard = transposeCard(card);
    const calledSet = new Set(calledNumbers);

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const num = transposedCard[row][col];
        const isFreeSpace = (col === 2 && row === 2);
        
        if (!isFreeSpace && num !== 0) {
          const letter = "BINGO"[col];
          const fullNumber = `${letter}-${num}`;
          if (!calledSet.has(fullNumber)) {
            return { isWinner: false, missingNumber: fullNumber };
          }
        }
      }
    }
    return { isWinner: true };
  }, [calledNumbers]);

  // Block user if claiming BINGO without complete coverall
  const handleBingo = useCallback((playerId: number) => {
    if (submittedBingoCards.includes(playerId) || blockedPlayers.includes(playerId)) return;

    const result = checkFullCardWin(playerId);
    
    if (result.isWinner) {
      setSubmittedBingoCards(prev => [...prev, playerId]);
      if (webSocketService) {
        webSocketService.send('end-full-game', {
          betAmount: bet,
          winnerId: user?._id,
          winnerCard: playerId,
          prizePool
        });
      }
    } else {
      setBlockedPlayers(prev => [...prev, playerId]);

      if (webSocketService) {
        webSocketService.send('update-full-session-status', {
          cardNumber: playerId,
          betAmount: bet,
          status: 'blocked'
        });
      }

      setLoserCardId(playerId);
      setLoserMessage(language === 'am' 
        ? `ቁጥር ${result.missingNumber || ''} ገና አልተጠራም` 
        : `Number ${result.missingNumber || ''} not called yet`
      );
      setShowLoserModal(true);
      playGameAudio('not-won');
    }
  }, [submittedBingoCards, blockedPlayers, checkFullCardWin, webSocketService, bet, user, prizePool, language]);

  // Auto-play automation
  useEffect(() => {
    if (!autoPlayOn || gameStopped || calledNumbers.length === 0) return;

    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    autoPlayTimerRef.current = setTimeout(() => {
      players.forEach(p => {
        if (blockedPlayers.includes(p.id)) return;
        const card = getCardById(p.id);
        if (!card) return;
        const transposedCard = transposeCard(card);

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const num = transposedCard[r][c];
            if (num !== 0 && !(r === 2 && c === 2)) {
              const fullNum = `${"BINGO"[c]}-${num}`;
              if (calledNumbers.includes(fullNum) && !userMarkedNumbers[fullNum]) {
                setUserMarkedNumbers(prev => ({ ...prev, [fullNum]: true }));
              }
            }
          }
        }

        const winCheck = checkFullCardWin(p.id);
        if (winCheck.isWinner) {
          handleBingo(p.id);
        }
      });
    }, 150);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlayOn, gameStopped, calledNumbers, players, userMarkedNumbers, blockedPlayers, checkFullCardWin, handleBingo]);

  useEffect(() => {
    if (showWinnerModal || showGameOverModal) {
      setAutoCloseCountdown(7);
      if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);

      autoCloseTimerRef.current = setInterval(() => {
        setAutoCloseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(autoCloseTimerRef.current!);
            onBackToPlayerLobby();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
      };
    }
  }, [showWinnerModal, showGameOverModal, onBackToPlayerLobby]);

  const transposeCard = (card: number[][]) => {
    const transposed: number[][] = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        transposed[i][j] = card[j][i];
      }
    }
    return transposed;
  };

  const toggleUserMark = (number: string) => {
    setUserMarkedNumbers(prev => ({ ...prev, [number]: !prev[number] }));
  };

  // Full Game Winner Card Preview Component
  const WinnerCard = ({ winner, isCurrentUser, language }: { 
    winner: Winner; 
    isCurrentUser: boolean;
    language: 'en' | 'am';
  }) => {
    const card = getCardById(winner.id);

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ 
          background: isCurrentUser ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          p: 2,
          border: isCurrentUser ? '2px solid gold' : '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: isCurrentUser ? 'gold' : 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {language === 'am' ? 'ካርድ' : 'Card'} #{winner.id}
              {isCurrentUser && ` (${language === 'am' ? 'የእርስዎ' : 'Yours'})`}
            </Typography>
            
            {winner.prize && (
              <Box sx={{ background: 'rgba(76,175,80,0.3)', borderRadius: 2, px: 2, py: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {winner.prize.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="body2" sx={{ color: '#a1c4fd', mb: 1.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
            {language === 'am' ? 'ሙሉ ካርድ አሸንፈዋል!' : 'Won with Full Card!'}
          </Typography>
          
          <Box sx={{ 
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5, mb: 1, p: 1, background: 'rgba(255,255,255,0.9)', borderRadius: 1 
          }}>
            {["B", "I", "N", "G", "O"].map((letter) => (
              <Box key={letter} sx={{
                p: 0.3, backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px 4px 0 0'
              }}>
                {letter}
              </Box>
            ))}
            {transposeCard(card).map((row, rowIdx) => (
              row.map((num, colIdx) => {
                const letter = "BINGO"[colIdx];
                const isCalled = calledNumbers.includes(`${letter}-${num}`);
                const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                
                return (
                  <Box
                    key={`${rowIdx}-${colIdx}`}
                    sx={{
                      p: 0.4,
                      border: '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: isFreeSpace ? '#4CAF50' : isCalled ? 'rgba(76,175,80,0.5)' : 'rgba(255,255,255,0.7)',
                      color: 'text.primary',
                      fontWeight: isCalled ? 'bold' : 'normal',
                      fontSize: '0.85rem',
                      minHeight: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                    }}
                  >
                    {isFreeSpace ? '★' : num}
                  </Box>
                );
              })
            ))}
          </Box>
        </Box>
      </motion.div>
    );
  };

  if (!isClient) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
      {/* Header Cards (Mirrors Partial Game Header & Countdown State) */}
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
        {!gameStarted ? (
          <Card sx={{
            flex: '0 0 25%',
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
              {language === 'am' ? 'የቀረ ጊዜ' : 'Time'}
            </Typography>
            <Typography sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
              {countdown > 0 ? `${countdown}s` : 'Ready'}
            </Typography>
          </Card>
        ) : (
          <>
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
                {language === 'am' ? 'ተጠሩ' : 'Called'}
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {calledNumbers.length}/{totalNumbers}
              </Typography>
            </Card>
          </>
        )}

        <Card sx={{
          flex: !gameStarted ? '0 0 25%' : '0 0 20%',
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
          flex: !gameStarted ? '0 0 25%' : '0 0 20%',
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
          flex: !gameStarted ? '0 0 25%' : '0 0 20%',
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
        {/* Left Side: 75-Ball Board & Recent Numbers */}
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
                <Box key={letter} sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = ranges[colIndex].min + i;
                    const fullNumber = `${letter}-${num}`;
                    const isCalled = calledNumbers.includes(fullNumber);

                    return (
                      <Box
                        key={num}
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
                    );
                  })}
                </Box>
              );
            })}
          </Box>

          {/* Recent Numbers Strip */}
          {gameStarted && recentNumbers.length > 0 && (
            <Box sx={{ 
              p: 1,
              background: getCardBackground(),
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              mt: 1,
              color: getTextColor()
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {recentNumbers.map((num, index) => (
                  <Box 
                    key={index}
                    sx={{
                      px: 1,
                      py: 0.5,
                      backgroundColor: 'orange',
                      color: 'white',
                      borderRadius: 1.5,
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {num}
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', mt: 0.5 }}>
                {language === 'am' ? 'ያለፉት ቁጥሮች' : 'Recent Numbers'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right Side: Controls and Cards */}
        <Box sx={{ 
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: '25vh',
        }}>
          {/* Controls with Sound, Auto, and Language Switcher */}
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
              <Typography sx={{ fontWeight: 'bold', fontSize: '0.6rem', color: getTextColor(), whiteSpace: 'nowrap', mb: 0.25 }}>
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
              <Typography sx={{ fontWeight: 'bold', fontSize: '0.6rem', color: autoPlayOn ? '#4CAF50' : getTextColor(), whiteSpace: 'nowrap', mb: 0.25 }}>
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

            {/* Language Switcher */}
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
              <Typography sx={{ fontWeight: 'bold', fontSize: '0.6rem', color: getTextColor(), whiteSpace: 'nowrap', mb: 0.25 }}>
                🌐 {language === 'am' ? 'ቋንቋ' : 'Lang'}
              </Typography>
              <Select
                value={language}
                onChange={(e) => setLanguage && setLanguage(e.target.value as 'en' | 'am')}
                size="small"
                sx={{ 
                  minWidth: 32,
                  height: 24,
                  fontSize: '0.65rem',
                  backgroundColor: getSelectBackground(),
                  color: getSelectTextColor(),
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: getSelectTextColor(),
                    borderWidth: '1px'
                  },
                  '& .MuiSelect-select': {
                    padding: '1px 4px',
                    paddingRight: '16px !important'
                  },
                  '& .MuiSvgIcon-root': {
                    color: getSelectTextColor(),
                    fontSize: '0.8rem',
                    right: 1
                  }
                }}
              >
                <MenuItem value="en" sx={{ fontSize: '0.65rem', minHeight: 24 }}>EN</MenuItem>
                <MenuItem value="am" sx={{ fontSize: '0.65rem', minHeight: 24 }}>AM</MenuItem>
              </Select>
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
            {players.map(player => {
              const card = getCardById(player.id);
              const isBlocked = blockedPlayers.includes(player.id);
              const hasSubmittedBingo = submittedBingoCards.includes(player.id);
              
              return (
                <Card 
                  key={player.id} 
                  sx={{ 
                    p: 0.4,
                    background: isBlocked ? "rgba(244,67,54,0.10)" : getCardBackground(),
                    border: isBlocked ? "2px solid #f44336" : "1.5px solid rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                    boxShadow: isBlocked ? "0 2px 6px rgba(244,67,54,0.25)" : "0 2px 5px rgba(0,0,0,0.10)",
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

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.15, mb: 0.6 }}>
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
                              background: rowIdx === 2 && colIdx === 2
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
                              boxShadow: isUserMarked ? "0 2px 5px rgba(0,0,0,0.20)" : "0 1px 3px rgba(0,0,0,0.10)",
                            }}
                          >
                            {num === 0 ? '★' : num}
                          </Box>
                        );
                      })
                    )}
                  </Box>

                  <Button
                    variant={getButtonVariant()}
                    color="success"
                    onClick={() => handleBingo(player.id)}
                    disabled={isBlocked || !isCalling || hasSubmittedBingo}
                    fullWidth
                    size="small"
                    sx={{
                      fontSize: "0.9rem",
                      borderRadius: "6px",
                      opacity: isBlocked || !isCalling || hasSubmittedBingo ? 0.6 : 1,
                      boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                      ...getButtonStyle()
                    }}
                  >
                    {hasSubmittedBingo 
                      ? (language === "am" ? "ቀርቧል" : "SUBMITTED") 
                      : isBlocked 
                      ? (language === "am" ? "ታግዷል" : "BLOCKED")
                      : "BINGO"}
                  </Button>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Winner Modal with Detailed Card Previews */}
      <Modal open={showWinnerModal} onClose={() => { setShowWinnerModal(false); onBackToPlayerLobby(); }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: 550, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 3, textAlign: 'center', border: '3px solid gold', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', maxHeight: '90vh', overflow: 'auto'
        }}>
          <IconButton aria-label="close" onClick={() => { setShowWinnerModal(false); onBackToPlayerLobby(); }} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <CloseIcon />
          </IconButton>
          
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />

          <Typography variant="h4" gutterBottom sx={{ color: 'gold', mb: 2, fontWeight: 'bold', textShadow: '0 0 5px rgba(255,215,0,0.7)', fontSize: '1.8rem' }}>
            {language === 'am' ? 'እንኳን ደስ ያለህ! 🎉' : '🎉 CONGRATULATIONS! 🎉'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>
              {language === 'am' ? 'ወደ ሎቢ ይመለሳል:' : 'Returning to lobby in:'}
            </Typography>
            <Box sx={{ backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid gold' }}>
              <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {autoCloseCountdown}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>s</Typography>
          </Box>

          {gameEndData && (
            <Box sx={{ background: 'rgba(255,215,0,0.2)', borderRadius: 2, p: 2, mb: 3, border: '2px solid gold' }}>
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

          {/* Detailed Winner Cards Representation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold', fontSize: '1.2rem' }}>
              {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
            </Typography>

            {user && (
              <>
                {winners.filter(w => w.userId === user._id).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'gold', mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {language === 'am' ? 'የእርስዎ አሸናፊ ካርዶች' : 'Your Winning Cards'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {winners.filter(w => w.userId === user._id).map((winner, index) => (
                        <WinnerCard key={index} winner={winner} isCurrentUser={true} language={language} />
                      ))}
                    </Box>
                  </Box>
                )}

                {winners.filter(w => w.userId !== user._id).length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: '#a1c4fd', mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {language === 'am' ? 'ሌሎች አሸናፊዎች' : 'Other Winners'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {winners.filter(w => w.userId !== user._id).map((winner, index) => (
                        <WinnerCard key={index} winner={winner} isCurrentUser={false} language={language} />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
              setShowWinnerModal(false);
              onBackToPlayerLobby();
            }}
            sx={{ 
              mt: 2, px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              boxShadow: '0 4px 12px rgba(255, 105, 135, 0.4)', borderRadius: 2
            }}
          >
            {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
          </Button>
        </Box>
      </Modal>

      {/* Game Over Modal */}
      <Modal open={showGameOverModal} onClose={() => { setShowGameOverModal(false); onBackToPlayerLobby(); }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: 450, bgcolor: 'background.paper', boxShadow: 24, p: 2.5, borderRadius: 3, textAlign: 'center', border: '3px solid gold', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', maxHeight: '90vh', overflow: 'auto'
        }}>
          <IconButton aria-label="close" onClick={() => { setShowGameOverModal(false); onBackToPlayerLobby(); }} sx={{ position: 'absolute', right: 4, top: 4, color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>
              {language === 'am' ? 'ወደ ሎቢ ይመለሳል:' : 'Returning to lobby in:'}
            </Typography>
            <Box sx={{ backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid gold' }}>
              <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {autoCloseCountdown}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#a1c4fd', fontSize: '0.9rem' }}>s</Typography>
          </Box>
          
          {gameEndData && (
            <Box sx={{ background: 'rgba(255,215,0,0.2)', borderRadius: 2, p: 1.5, mb: 2, border: '1px solid gold' }}>
              <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', fontSize: '1rem' }}>
                {language === 'am' ? 'ጠቅላላ ደራሽ' : 'Total Prize Pool'}
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {gameEndData.prizePool.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
              </Typography>
            </Box>
          )}

          {winners.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
              </Typography>
              {winners.map((winner, index) => (
                <WinnerCard key={index} winner={winner} isCurrentUser={false} language={language} />
              ))}
            </Box>
          )}

          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
              setShowGameOverModal(false);
              onBackToPlayerLobby();
            }}
            sx={{ 
              mt: 1, px: 3, fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              boxShadow: '0 2px 8px rgba(255, 105, 135, 0.3)', borderRadius: 2
            }}
          >
            {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
          </Button>
        </Box>
      </Modal>

      {/* Disqualified / Blocked Modal showing card preview */}
      <Modal open={showLoserModal} onClose={() => setShowLoserModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '85%', maxWidth: 380, bgcolor: '#1a1a2e', color: 'white', p: 2.5, borderRadius: 2, textAlign: 'center', border: '2px solid #ef5350'
        }}>
          <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 'bold', mb: 1 }}>{language === 'am' ? 'ይቅርታ!' : 'Invalid Bingo!'}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{loserMessage}</Typography>
          
          {loserCardId && (
            <Box sx={{ 
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.3, mb: 2, p: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 1 
            }}>
              {["B", "I", "N", "G", "O"].map((letter) => (
                <Box key={letter} sx={{ p: 0.3, backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold', fontSize: '0.65rem' }}>
                  {letter}
                </Box>
              ))}
              {transposeCard(getCardById(loserCardId)).map((row, rowIdx) => (
                row.map((num, colIdx) => {
                  const letter = "BINGO"[colIdx];
                  const isCalled = calledNumbers.includes(`${letter}-${num}`);
                  const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                  return (
                    <Box
                      key={`${rowIdx}-${colIdx}`}
                      sx={{
                        p: 0.3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: isFreeSpace ? '#4CAF50' : isCalled ? 'rgba(76,175,80,0.7)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '0.65rem',
                        minHeight: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {num === 0 ? '★' : num}
                    </Box>
                  );
                })
              ))}
            </Box>
          )}

          <Typography variant="caption" sx={{ color: '#ffcdd2', display: 'block', mb: 2 }}>
            {language === 'am' ? 'ይህ ካርድ ታግዷል።' : 'This card has been blocked.'}
          </Typography>
          <Button variant="contained" color="error" onClick={() => setShowLoserModal(false)}>
            {language === 'am' ? 'እሺ' : 'OK'}
          </Button>
        </Box>
      </Modal>

      <Snackbar open={showToast} autoHideDuration={2500} onClose={() => setShowToast(false)}>
        <Alert severity="info">{toastMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FullGameInterface;