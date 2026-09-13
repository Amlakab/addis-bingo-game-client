'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, Box, Typography, Card, 
  Alert, Snackbar, Modal, Switch,
  CircularProgress
} from '@mui/material';
import { getCardById } from '@/app/utils/generateCards';
import Confetti from 'react-confetti';
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
  backgroundColor = 'white',
}: FullGameInterfaceProps) => {
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
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  
  const [gameStopped, setGameStopped] = useState(false);
  const [submittedBingoCards, setSubmittedBingoCards] = useState<number[]>([]);
  const [totalNumbers] = useState(75);
  const [remainingNumbers, setRemainingNumbers] = useState(75);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(7);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Exact Partial Game Palette Helpers
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
      audioRef.current.play().catch(() => {});
    } catch {}
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
        const wsModule = await import('@/app/utils/websocket');
        setWebSocketService(wsModule.webSocketService);
      } catch (error) {
        console.error('Failed to load websocket:', error);
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

  // Connect to Socket and Listen for Game Calling
  useEffect(() => {
    if (!isClient || !webSocketService) return;

    const handleNumberCalled = (data: { betAmount: number; number: string; calledNumbers: string[]; totalNumbers: number; remaining: number }) => {
      if (data.betAmount !== bet) return;
      
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers);
      setRemainingNumbers(data.remaining);
      setIsCalling(true);
      
      if (soundOn && language === 'am') {
        playAmharicNumberAudio(data.number);
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
      if (data.calledNumbers.length > 0) setIsCalling(true);
    };

    const handleSessionsUpdate = (sessions: any[]) => {
      const currentSessions = sessions.filter(s => s.betAmount === bet);
      setNumberOfPlayers(currentSessions.length);
      setPrizePool(currentSessions.length * bet * 0.8);
    };

    webSocketService.on('full-number-called', handleNumberCalled);
    webSocketService.on('full-game-stopped', handleGameStopped);
    webSocketService.on('full-winner-announced', handleWinnerAnnounced);
    webSocketService.on('full-game-ended', handleGameEnded);
    webSocketService.on('full-game-state', handleGameState);
    webSocketService.on('full-sessions-updated', handleSessionsUpdate);

    // Initial requests to start or sync calling
    webSocketService.send('start-full-game', { betAmount: bet });
    webSocketService.send('get-full-game-state', { betAmount: bet });
    webSocketService.send('get-full-sessions', { betAmount: bet });

    return () => {
      webSocketService.off('full-number-called', handleNumberCalled);
      webSocketService.off('full-game-stopped', handleGameStopped);
      webSocketService.off('full-winner-announced', handleWinnerAnnounced);
      webSocketService.off('full-game-ended', handleGameEnded);
      webSocketService.off('full-game-state', handleGameState);
      webSocketService.off('full-sessions-updated', handleSessionsUpdate);
    };
  }, [isClient, webSocketService, bet, language, user, soundOn, players]);

  // Full Card Win Validation (All 24 non-free spaces must be called)
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
  }, [autoPlayOn, gameStopped, calledNumbers, players, userMarkedNumbers, checkFullCardWin, handleBingo]);

  // Auto-close modal timer
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
      {/* Header Cards (Mirrors Partial Game Exactly) */}
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
        {/* Left Side: 75-Ball Board */}
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
        </Box>

        {/* Right Side: Controls & Cards */}
        <Box sx={{ 
          flex: '0 0 60%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: '25vh',
        }}>
          {/* Controls Bar */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.75,
            flexWrap: 'nowrap',
            justifyContent: 'center',
            width: '100%',
            mb: 0.5
          }}>
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
          </Box>

          {/* User Cards Grid */}
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
                    {hasSubmittedBingo ? (language === "am" ? "ቀርቧል" : "SUBMITTED") : "BINGO"}
                  </Button>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Winner Modal */}
      <Modal open={showWinnerModal} onClose={() => { setShowWinnerModal(false); onBackToPlayerLobby(); }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: 450, bgcolor: '#1a1a2e', color: 'white', p: 3, borderRadius: 3, textAlign: 'center', border: '2px solid gold'
        }}>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} />
          <Typography variant="h5" sx={{ color: 'gold', fontWeight: 'bold', mb: 2 }}>🎉 {language === 'am' ? 'እንኳን ደስ ያለህ!' : 'WINNER!'} 🎉</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{language === 'am' ? 'ወደ ሎቢ ይመለሳል:' : 'Returning to lobby in:'} {autoCloseCountdown}s</Typography>
          {gameEndData && (
            <Box sx={{ bgcolor: 'rgba(255,215,0,0.1)', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'gold' }}>+{gameEndData.split.toFixed(0)} Birr</Typography>
            </Box>
          )}
          <Button variant="contained" color="warning" fullWidth onClick={() => { setShowWinnerModal(false); onBackToPlayerLobby(); }}>
            {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
          </Button>
        </Box>
      </Modal>

      {/* Game Over Modal */}
      <Modal open={showGameOverModal} onClose={() => { setShowGameOverModal(false); onBackToPlayerLobby(); }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: 400, bgcolor: '#1a1a2e', color: 'white', p: 3, borderRadius: 3, textAlign: 'center', border: '2px solid #ef5350'
        }}>
          <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 'bold', mb: 1 }}>{language === 'am' ? 'ጨዋታው አልቋል' : 'Game Over'}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{language === 'am' ? 'ወደ ሎቢ ይመለሳል:' : 'Returning to lobby in:'} {autoCloseCountdown}s</Typography>
          <Button variant="contained" fullWidth onClick={() => { setShowGameOverModal(false); onBackToPlayerLobby(); }}>
            {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
          </Button>
        </Box>
      </Modal>

      {/* Disqualified Modal */}
      <Modal open={showLoserModal} onClose={() => setShowLoserModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '85%', maxWidth: 350, bgcolor: '#1a1a2e', color: 'white', p: 2.5, borderRadius: 2, textAlign: 'center', border: '2px solid #ef5350'
        }}>
          <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 'bold', mb: 1 }}>{language === 'am' ? 'ይቅርታ!' : 'Invalid Bingo!'}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{loserMessage}</Typography>
          <Button variant="contained" onClick={() => setShowLoserModal(false)}>{language === 'am' ? 'እሺ' : 'OK'}</Button>
        </Box>
      </Modal>

      <Snackbar open={showToast} autoHideDuration={2500} onClose={() => setShowToast(false)}>
        <Alert severity="info">{toastMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FullGameInterface;