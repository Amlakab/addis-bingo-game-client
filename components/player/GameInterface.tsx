'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Button, Box, Typography, Card, 
  useTheme, useMediaQuery, Alert, Snackbar,
  IconButton, CircularProgress, Modal, Switch,
  FormControlLabel, Select, MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import { getCardById } from '@/app/utils/generateCards';
import Confetti from 'react-confetti';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/auth';

type WinPattern = 'row' | 'column' | 'diagonal' | 'corners';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface Winner {
  id: number;
  userId: string;
  pattern: WinPattern;
  prize?: number;
  totalWinners?: number;
}

interface GameEndData {
  winners: { userId: string; card: number; prize: number }[];
  prizePool: number;
  split: number;
  totalWinners: number;
}

interface GameSession {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  status: string;
  createdAt: string;
}

interface WinnerAnnouncement {
  betAmount: number;
  winnerId: string;
  winnerCard: number;
  message: string;
  timestamp: Date;
}

interface GameInterfaceProps {
  players: PlayerSelection[]; 
  bet: number; 
  onGameEnd: () => void;
  onBackToPlayerLobby: () => void;
  language: 'en' | 'am';
  earningsPercentage?: number;
  setLanguage?: (lang: 'en' | 'am') => void;
  webSocketService: any;
  voiceService: any;
}

const GameInterface = ({ 
  players, 
  bet, 
  onGameEnd,
  onBackToPlayerLobby,
  language = 'en',
  webSocketService,
  voiceService
}: GameInterfaceProps) => {
  const [calledNumbers, setCalledNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
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
  const [gameEnded, setGameEnded] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [announcedWinners, setAnnouncedWinners] = useState<WinnerAnnouncement[]>([]);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize window size
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket listeners
  useEffect(() => {
    if (!webSocketService) return;

    const handleSessionsUpdate = (sessions: GameSession[]) => {
      const betSessions = sessions.filter(session => session.betAmount === bet);
      const activePlayers = betSessions.filter(session => session.status !== "active").length;
      setNumberOfPlayers(activePlayers);
      setPrizePool(activePlayers * bet * 0.8);
      setGameSessions(betSessions);
    };

    const handleNumberCalled = (data: { betAmount: number; number: string; calledNumbers: string[] }) => {
      if (data.betAmount !== bet) return;
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers);
      
      if (soundOn && voiceService) {
        const langCode = language === 'am' ? 'am-ET' : 'en-US';
        voiceService.speak(data.number, langCode, 1);
      }
    };

    const handleWinnerAnnouncement = (data: WinnerAnnouncement) => {
      if (data.betAmount !== bet) return;
      
      setAnnouncedWinners(prev => [...prev, data]);
      setToastMessage(data.message);
      setShowToast(true);
      
      if (soundOn && voiceService) {
        const langCode = language === 'am' ? 'am-ET' : 'en-US';
        voiceService.speak(data.message, langCode, 1);
      }
    };

    const handleGameEnded = (data: GameEndData) => {
      setGameEnded(true);
      setGameEndData(data);
      
      const formattedWinners: Winner[] = data.winners.map(winner => ({
        id: winner.card,
        userId: winner.userId,
        pattern: 'row',
        prize: winner.prize,
        totalWinners: data.totalWinners
      }));
      
      setWinners(formattedWinners);
      
      const userWon = user && data.winners.some(winner => winner.userId === user._id);
      if (userWon) {
        setTimeout(() => setShowWinnerModal(true), 1000);
      } else {
        setShowGameOverModal(true);
      }
    };

    const handleGameState = (data: { betAmount: number; calledNumbers: string[]; currentNumber: string }) => {
      if (data.betAmount !== bet) return;
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.currentNumber);
    };

    // Setup listeners
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('number-called', handleNumberCalled);
    webSocketService.on('winner-announcement', handleWinnerAnnouncement);
    webSocketService.on('game-ended', handleGameEnded);
    webSocketService.on('game-state', handleGameState);

    // Request initial data
    webSocketService.send('get-sessions', { betAmount: bet });

    return () => {
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('number-called', handleNumberCalled);
      webSocketService.off('winner-announcement', handleWinnerAnnouncement);
      webSocketService.off('game-ended', handleGameEnded);
      webSocketService.off('game-state', handleGameState);
    };
  }, [webSocketService, bet, soundOn, voiceService, language, user]);

  // Start game when countdown ends
  useEffect(() => {
    if (gameSessions.length > 0) {
      const earliestSession = gameSessions.reduce((earliest, session) => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate < earliest ? sessionDate : earliest;
      }, new Date(gameSessions[0].createdAt));
      
      const currentDate = new Date();
      const timeDifference = Math.floor((currentDate.getTime() - earliestSession.getTime()) / 1000);
      const remainingTime = Math.max(0, 46 - timeDifference);
      
      setCountdown(remainingTime);
      if (remainingTime > 0) {
        startCountdown(remainingTime);
      } else {
        startGame();
      }
    }
  }, [gameSessions]);

  const startCountdown = (initialTime: number) => {
    setCountdown(initialTime);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    webSocketService.send('update-session-status-by-bet', { betAmount: bet, status: 'playing' });
  };

  useEffect(() => {
    if (calledNumbers.length > 0) {
      setRecentNumbers(calledNumbers.slice(-3));
    }
  }, [calledNumbers]);

  const checkForWinner = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { isWinner: false, message: 'Player not found', playerId };
    if (blockedPlayers.includes(playerId)) return { isWinner: false, message: 'Player blocked', playerId };

    const card = getCardById(playerId);
    const patterns: WinPattern[] = ["row", "column", "diagonal", "corners"];

    for (const pattern of patterns) {
      const winningCells = getWinningPatternCells(card, pattern);
      if (winningCells.length > 0) {
        return {
          isWinner: true,
          pattern,
          message: `Player ${playerId} wins with ${pattern} pattern!`,
          playerId,
          userId: player.userId
        };
      }
    }

    return { isWinner: false, message: 'No winning pattern', playerId };
  };

  const handleBingo = async (playerId: number) => {
    if (gameEnded) {
      setToastMessage('Game already ended!');
      setShowToast(true);
      return;
    }

    const result = checkForWinner(playerId);
    
    if (result.isWinner) {
      const prizeAmount = numberOfPlayers * bet * 0.8;
      webSocketService.send('end-game', {
        betAmount: bet,
        winnerId: result.userId!,
        winnerCard: playerId,
        prizePool: prizeAmount
      });

      if (soundOn && voiceService) {
        const langCode = language === 'am' ? 'am-ET' : 'en-US';
        voiceService.speak(`Player ${playerId} wins!`, langCode, 1);
      }
    } else {
      setBlockedPlayers([...blockedPlayers, playerId]);
      setLoserMessage(result.message);
      setLoserCardId(playerId);
      setShowLoserModal(true);

      if (soundOn && voiceService) {
        const langCode = language === 'am' ? 'am-ET' : 'en-US';
        voiceService.speak('No winner found!', langCode, 1);
      }
    }
  };

  const toggleUserMark = (number: string) => {
    setUserMarkedNumbers(prev => ({ ...prev, [number]: !prev[number] }));
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

  const getUserCards = () => {
    if (!user) return [];
    return players.filter(player => player.userId === user._id);
  };

  const isNumberCalled = (number: number, letter: string) => {
    return calledNumbers.includes(`${letter}-${number}`);
  };

  const getWinningPatternCells = (card: number[][], pattern: WinPattern) => {
    const cells: {row: number, col: number}[] = [];
    
    if (pattern === 'row') {
      for (let row = 0; row < 5; row++) {
        let isWinningRow = true;
        for (let col = 0; col < 5; col++) {
          const number = card[col][row];
          const letter = "BINGO"[col];
          if (!isNumberCalled(number, letter)) {
            isWinningRow = false;
            break;
          }
        }
        if (isWinningRow) {
          for (let col = 0; col < 5; col++) cells.push({row, col});
          break;
        }
      }
    } else if (pattern === 'column') {
      for (let col = 0; col < 5; col++) {
        let isWinningCol = true;
        for (let row = 0; row < 5; row++) {
          const number = card[col][row];
          const letter = "BINGO"[col];
          if (!isNumberCalled(number, letter)) {
            isWinningCol = false;
            break;
          }
        }
        if (isWinningCol) {
          for (let row = 0; row < 5; row++) cells.push({row, col});
          break;
        }
      }
    } else if (pattern === 'diagonal') {
      let isWinningDiagonal = true;
      for (let i = 0; i < 5; i++) {
        const number = card[i][i];
        const letter = "BINGO"[i];
        if (!isNumberCalled(number, letter)) {
          isWinningDiagonal = false;
          break;
        }
      }
      if (isWinningDiagonal) {
        for (let i = 0; i < 5; i++) cells.push({row: i, col: i});
      }
      
      isWinningDiagonal = true;
      for (let i = 0; i < 5; i++) {
        const number = card[i][4 - i];
        const letter = "BINGO"[i];
        if (!isNumberCalled(number, letter)) {
          isWinningDiagonal = false;
          break;
        }
      }
      if (isWinningDiagonal) {
        for (let i = 0; i < 5; i++) cells.push({row: 4 - i, col: i});
      }
    } else if (pattern === 'corners') {
      const corners = [{row: 0, col: 0}, {row: 0, col: 4}, {row: 4, col: 0}, {row: 4, col: 4}];
      let isWinningCorners = true;
      for (const corner of corners) {
        const number = card[corner.col][corner.row];
        const letter = "BINGO"[corner.col];
        if (!isNumberCalled(number, letter)) {
          isWinningCorners = false;
          break;
        }
      }
      if (isWinningCorners) cells.push(...corners);
    }
    
    return cells;
  };

  const userCards = getUserCards();

  return (
    <Box sx={{ p: 1, textAlign: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '40vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Game Info Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5, minHeight: "8vh", background: 'rgba(255,255,255,0.8)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', mb: 1, flexWrap: 'wrap' }}>
        
        {!gameStarted ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Time Left</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>{countdown}s</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Current</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>{currentNumber || "-"}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Called</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{calledNumbers.length}</Typography>
            </Box>
          </>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Players</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{numberOfPlayers}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Prize Pool</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1.2rem' }}>{prizePool.toFixed(0)} Birr</Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'row' }, flex: 1, gap: 0.5, minHeight: '25vh', overflow: 'hidden' }}>
        
        {/* Left Side - Number Grid */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0.5, background: 'rgba(255,255,255,0.7)', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto', minHeight: '25vh', minWidth: 0 }}>
          
          {/* BINGO Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5, mb: 1 }}>
            {['B', 'I', 'N', 'G', 'O'].map(letter => (
              <Box key={letter} sx={{ p: 0.5, backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold', textAlign: 'center', borderRadius: 1, fontSize: '0.9rem' }}>
                {letter}
              </Box>
            ))}
          </Box>

          {/* Number Grid */}
          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridAutoRows: 'minmax(30px, auto)', gap: 0.5, overflow: 'auto', p: 0.5 }}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => {
              const ranges = [{ min: 1, max: 15 }, { min: 16, max: 30 }, { min: 31, max: 45 }, { min: 46, max: 60 }, { min: 61, max: 75 }];
              
              return (
                <Box key={letter} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = ranges[colIndex].min + i;
                    const fullNumber = `${letter}-${num}`;
                    const isCalled = calledNumbers.includes(fullNumber);
                    
                    return (
                      <motion.div key={num} whileHover={{ scale: 1.05 }}>
                        <Box sx={{ width: '100%', height: '100%', minHeight: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isCalled ? 'linear-gradient(145deg, #4CAF50, #8BC34A)' : 'linear-gradient(145deg, #ffffff, #e0e0e0)', color: isCalled ? 'white' : 'text.primary', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s ease', border: isCalled ? '1px solid #2E7D32' : '1px solid #e0e0e0' }}>
                          {num}
                        </Box>
                      </motion.div>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          
          {!gameStarted && (
            <Button variant="contained" color="error" onClick={() => webSocketService.send('refund-wallet', { betAmount: bet, userId: user?._id })} fullWidth size="small" sx={{ fontSize: '0.95rem', mt: 1, p: 0.5 }}>
              Clear Card
            </Button>
          )}
          
          {/* Recent Numbers */}
          {gameStarted && (
            <Box sx={{ p: 1, background: 'rgba(255,255,255,0.9)', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', mt: 1, minHeight: '3vh' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1 }}>Recent Numbers</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {recentNumbers.map((num, index) => (
                  <Box key={index} sx={{ px: 1, py: 1, backgroundColor: 'orange', color: 'white', borderRadius: 2, fontWeight: 'bold', fontSize: '0.7rem', minWidth: 15, minHeight: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    {num}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Side - Controls and Cards */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: '25vh' }}>
          
          {/* Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel control={<Switch checked={soundOn} onChange={() => setSoundOn(!soundOn)} color="primary" size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{soundOn ? 'Sound on' : 'Sound Off'}</Typography>} />
            <Select value={language} onChange={(e) => setLanguage && setLanguage(e.target.value as 'en' | 'am')} size="small" sx={{ minWidth: 40, fontSize: '0.7rem' }}>
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="am">AM</MenuItem>
            </Select>
          </Box>

          {/* User Cards */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 0.5, background: 'rgba(255,255,255,0.5)', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 1, minHeight: '25vh' }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Your Cards</Typography>
            
            {userCards.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 0.5, fontSize: '0.8rem' }}>No cards selected</Typography>
            ) : (
              userCards.map(player => {
                const card = getCardById(player.id);
                const isBlocked = blockedPlayers.includes(player.id);
                
                return (
                  <Card key={player.id} sx={{ p: 1, background: isBlocked ? 'rgba(244,67,54,0.1)' : 'rgba(255,255,255,0.8)', border: isBlocked ? '2px solid #f44336' : '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1rem' }}>Card #{player.id}{isBlocked && ' (Blocked)'}</Typography>
                    
                    {/* BINGO Card */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.3, mb: 0.5 }}>
                      {/* BINGO Header */}
                      {["B", "I", "N", "G", "O"].map((letter, idx) => (
                        <Box key={letter} sx={{ p: 0.3, backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px 4px 0 0' }}>
                          {letter}
                        </Box>
                      ))}
                      
                      {/* Card numbers */}
                      {transposeCard(card).map((row, rowIdx) => (
                        row.map((num, colIdx) => {
                          const letter = "BINGO"[colIdx];
                          const fullNumber = `${letter}-${num}`;
                          const isUserMarked = userMarkedNumbers[fullNumber];
                          
                          return (
                            <Box key={`${rowIdx}-${colIdx}`} onClick={() => toggleUserMark(fullNumber)} sx={{ p: 0.3, border: '1px solid rgba(0,0,0,0.1)', backgroundColor: (colIdx === 2 && rowIdx === 2) ? 'rgba(255,235,59,0.3)' : isUserMarked ? 'rgba(255,152,0,0.5)' : 'rgba(255,255,255,0.7)', color: 'text.primary', fontWeight: 'normal', fontSize: '0.8rem', minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { backgroundColor: isUserMarked ? 'rgba(255,152,0,0.7)' : 'rgba(0,0,0,0.1)' } }}>
                              {num === 0 ? '*' : num}
                            </Box>
                          );
                        })
                      ))}
                    </Box>
                    
                    {/* Bingo Button - NEVER DISABLED DURING GRACE PERIOD */}
                    <Button variant="contained" color="success" onClick={() => handleBingo(player.id)} disabled={isBlocked || !gameStarted} fullWidth size="small" sx={{ fontSize: '0.8rem' }}>
                      BINGO
                    </Button>
                  </Card>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Toast Message */}
      <Snackbar open={showToast} autoHideDuration={2000} onClose={() => setShowToast(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>{toastMessage}</Alert>
      </Snackbar>

      {/* Winner Modal */}
      <Modal open={showWinnerModal} onClose={() => { setShowWinnerModal(false); onGameEnd(); }}>
        <>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 500, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 3, textAlign: 'center', border: '3px solid gold', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', maxHeight: '90vh', overflow: 'auto' }}>
            <IconButton aria-label="close" onClick={() => { setShowWinnerModal(false); onGameEnd(); }} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseIcon /></IconButton>
            
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'gold', mb: 3, fontWeight: 'bold', textShadow: '0 0 5px rgba(255,215,0,0.7)' }}>🎉 CONGRATULATIONS! 🎉</Typography>
            </motion.div>

            {gameEndData && (
              <Box sx={{ background: 'rgba(255,215,0,0.2)', borderRadius: 2, p: 2, mb: 3, border: '2px solid gold' }}>
                <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', mb: 1 }}>Game Results</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}><Typography variant="body2" sx={{ color: '#a1c4fd' }}>Total Prize Pool</Typography><Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{gameEndData.prizePool.toFixed(0)} Birr</Typography></Box>
                  <Box sx={{ textAlign: 'center', mb: 1 }}><Typography variant="body2" sx={{ color: '#a1c4fd' }}>Winners</Typography><Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{gameEndData.totalWinners}</Typography></Box>
                  <Box sx={{ textAlign: 'center', mb: 1 }}><Typography variant="body2" sx={{ color: '#a1c4fd' }}>Each Gets</Typography><Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{gameEndData.split.toFixed(0)} Birr</Typography></Box>
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>Winners</Typography>
              {user && winners.filter(winner => winner.userId === user._id).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'gold', mb: 2, fontWeight: 'bold' }}>Your Winning Cards</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {winners.filter(winner => winner.userId === user._id).map((winner, index) => (
                      <Box key={index} sx={{ background: 'rgba(255,215,0,0.15)', borderRadius: 2, p: 2, border: '2px solid gold', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold' }}>Card #{winner.id} (Yours)</Typography>
                          {winner.prize && <Box sx={{ background: 'rgba(76,175,80,0.3)', borderRadius: 2, px: 2, py: 1 }}><Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>{winner.prize.toFixed(0)} Birr</Typography></Box>}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a1c4fd', mb: 2, fontStyle: 'italic' }}>Won with {winner.pattern} pattern!</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Button variant="contained" color="primary" onClick={() => { setShowWinnerModal(false); onGameEnd(); }} sx={{ mt: 2, px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', boxShadow: '0 4px 12px rgba(255, 105, 135, 0.4)', borderRadius: 2, '&:hover': { background: 'linear-gradient(45deg, #FE6B8B 40%, #FF8E53 100%)' } }}>
              Return to Lobby
            </Button>
          </Box>
        </>
      </Modal>

      {/* Loser Modal */}
      <Modal open={showLoserModal} onClose={() => setShowLoserModal(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 400, bgcolor: 'background.paper', boxShadow: 24, p: 2, borderRadius: 3, textAlign: 'center', border: '3px solid #f44336', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', maxHeight: '90vh', overflow: 'auto' }}>
          <IconButton aria-label="close" onClick={() => setShowLoserModal(false)} sx={{ position: 'absolute', right: 4, top: 4, color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
          <Typography variant="h6" gutterBottom sx={{ color: '#f44336', mb: 2, fontWeight: 'bold' }}>Sorry!</Typography>
          <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>{loserMessage}</Typography>
          <Button variant="contained" color="primary" onClick={() => { setShowLoserModal(false); onGameEnd(); }} sx={{ mt: 1, fontWeight: 'bold' }}>OK</Button>
        </Box>
      </Modal>

      {/* Game Over Modal */}
      <Modal open={showGameOverModal} onClose={() => { setShowGameOverModal(false); onGameEnd(); }}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 400, bgcolor: 'background.paper', boxShadow: 24, p: 2, borderRadius: 3, textAlign: 'center', border: '3px solid gold', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', maxHeight: '90vh', overflow: 'auto' }}>
          <IconButton aria-label="close" onClick={() => { setShowGameOverModal(false); onGameEnd(); }} sx={{ position: 'absolute', right: 4, top: 4, color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'gold', mb: 2, fontWeight: 'bold', textShadow: '0 0 5px rgba(255,215,0,0.7)' }}>🎉 GAME OVER! 🎉</Typography>
          </motion.div>
          {gameEndData && (
            <Box sx={{ background: 'rgba(255,215,0,0.2)', borderRadius: 2, p: 1.5, mb: 2, border: '1px solid gold' }}>
              <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold' }}>Total Prize Pool</Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{gameEndData.prizePool.toFixed(0)} Birr</Typography>
              {gameEndData.totalWinners > 1 && <Typography variant="body2" sx={{ color: '#a1c4fd', mt: 1 }}>Split among {gameEndData.totalWinners} winners</Typography>}
            </Box>
          )}
          <Button variant="contained" color="primary" onClick={() => { setShowGameOverModal(false); onGameEnd(); }} sx={{ mt: 1, px: 3, fontWeight: 'bold', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', boxShadow: '0 2px 8px rgba(255, 105, 135, 0.3)', borderRadius: 2 }}>Return to Lobby</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default GameInterface;