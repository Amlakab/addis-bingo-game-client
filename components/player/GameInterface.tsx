'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Button, Box, Typography, Card, CardContent, 
  useTheme, useMediaQuery, Alert, Snackbar, TextField,
  IconButton, CircularProgress, Modal, Switch,
  FormControlLabel,Select, MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import { checkWin } from '@/app/utils/gameLogic';
import { getCardById } from '@/app/utils/generateCards';
import Confetti from 'react-confetti';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

type WinPattern = 'row' | 'column' | 'diagonal' | 'corners';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface Winner {
  id: number;
  userId: string;
  pattern: WinPattern;
}

interface GameSession {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  status: string;
  createdAt: string;
}

interface GameHistory {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  };
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: Date;
}

interface GameInterfaceProps {
  players: PlayerSelection[]; 
  bet: number; 
  onGameEnd: () => void;
  onBackToPlayerLobby: () => void;
  language: 'en' | 'am';
  earningsPercentage?: number;
  setLanguage?: (lang: 'en' | 'am') => void;
}

const GameInterface = ({ 
  players, 
  bet, 
  onGameEnd,
  onBackToPlayerLobby,
  language = 'en',
  earningsPercentage = 20,
  setLanguage
}: GameInterfaceProps) => {
  const [calledNumbers, setCalledNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [isCalling, setIsCalling] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showLoserModal, setShowLoserModal] = useState(false);
  const [remainingNumbers, setRemainingNumbers] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  const [gameStatusText, setGameStatusText] = useState('FETA BINGO');
  const [blockedPlayers, setBlockedPlayers] = useState<number[]>([]);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [userMarkedNumbers, setUserMarkedNumbers] = useState<{[key: string]: boolean}>({});
  const [cardMarkedNumbers, setCardMarkedNumbers] = useState<{[playerId: string]: {[number: string]: boolean}}>({});
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loserMessage, setLoserMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverWinner, setGameOverWinner] = useState<GameHistory | null>(null);
  const [loserCardId, setLoserCardId] = useState<number | null>(null);
  const { user } = useAuth();
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [voiceService, setVoiceService] = useState<any>(null);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  
  // New state for countdown timer
  const [countdown, setCountdown] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize component on client side only
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import browser-only modules
    const loadBrowserModules = async () => {
      try {
        // Load voice service
        const voiceModule = await import('@/app/utils/voiceService');
        setVoiceService(voiceModule.voiceService);
        
        // Load WebSocket service
        const wsModule = await import('@/app/utils/websocket');
        setWebSocketService(wsModule.webSocketService);
      } catch (error) {
        console.error('Failed to load browser modules:', error);
      }
    };
    
    loadBrowserModules();
  }, []);

  // Setup WebSocket listeners when service is available
  useEffect(() => {
    if (!isClient || !webSocketService) return;

    webSocketService.on('connected', handleWebSocketConnected);
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('game-ended', handleGameEnded);
    webSocketService.on('number-called', handleNumberCalled);
    webSocketService.on('game-state', handleGameState);
    
    // Request initial session data
    webSocketService.send('get-sessions', { betAmount: bet });
    
    return () => {
      webSocketService.off('connected', handleWebSocketConnected);
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('game-ended', handleGameEnded);
      webSocketService.off('number-called', handleNumberCalled);
      webSocketService.off('game-state', handleGameState);
    };
  }, [isClient, webSocketService, bet]);

  // Setup WebSocket listeners for server-side number calling
  useEffect(() => {
    if (!isClient || !webSocketService || !gameStarted) return;

    // Request game state when component mounts or game starts
    webSocketService.send('get-game-state', { betAmount: bet });
    
    // Start the game on the server if it's not already running
    webSocketService.send('start-game', { betAmount: bet });
    
    return () => {
      // Cleanup is handled in the main useEffect
    };
  }, [isClient, webSocketService, gameStarted, bet]);

  // Handler for server-called numbers
  const handleNumberCalled = (data: { 
    betAmount: number; 
    number: string; 
    calledNumbers: string[] 
  }) => {
    if (data.betAmount !== bet) return;
    
    setCurrentNumber(data.number);
    setCalledNumbers(data.calledNumbers);
    
    if (soundOn && voiceService) {
      const langCode = language === 'am' ? 'am-ET' : 'en-US';
      voiceService.speak(data.number, langCode, 1);
    }
  };

  // Handler for game state updates
  const handleGameState = (data: { 
    betAmount: number; 
    calledNumbers: string[]; 
    currentNumber: string 
  }) => {
    if (data.betAmount !== bet) return;
    
    setCalledNumbers(data.calledNumbers);
    setCurrentNumber(data.currentNumber);
  };

  // Initialize and set up window size tracking
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial window size
    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  // Fetch game sessions and setup countdown timer
  useEffect(() => {
    if (!isClient || !bet) return;

    // Function to handle sessions update from WebSocket
    const handleSessionsUpdate = (sessions: GameSession[]) => {
      if (sessions.length > 0) {
        // Filter sessions for the current bet amount
        const betSessions = sessions.filter(session => session.betAmount === bet);
        
        if (betSessions.length > 0) {
          // Get the earliest createdAt from all sessions
          const earliestSession = betSessions.reduce((earliest, session) => {
            const sessionDate = new Date(session.createdAt);
            return sessionDate < earliest ? sessionDate : earliest;
          }, new Date(betSessions[0].createdAt));
          
          setSessionCreatedAt(earliestSession);
          
          // Calculate time difference
          const currentDate = new Date();
          const timeDifference = Math.floor((currentDate.getTime() - earliestSession.getTime()) / 1000); // in seconds
          
          // Calculate remaining time (52 seconds - time difference)
          const remainingTime = Math.max(0, 46 - timeDifference);
          setCountdown(remainingTime);
          
          // Start countdown if there's time left
          if (remainingTime > 0) {
            startCountdown(remainingTime);
          } else {
            // If time is already up, start the game immediately
            startGame();
          }
        }
      }
    };

    // Set up WebSocket listener
    if (webSocketService) {
      webSocketService.on('sessions-updated', handleSessionsUpdate);
      
      // Request sessions for the current bet amount
      webSocketService.send('get-sessions', {
        betAmount: bet
      });
    }

    return () => {
      // Clean up interval and WebSocket listener
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      if (webSocketService) {
        webSocketService.off('sessions-updated', handleSessionsUpdate);
      }
    };
  }, [isClient, bet, webSocketService]);

  const startCountdown = (initialTime: number) => {
    setCountdown(initialTime);
    setGameStarted(false);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time's up, start the game
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    
    // Update game sessions status to playing via WebSocket
    if (webSocketService) {
      // First update all sessions with this bet amount to 'playing' status
      webSocketService.send('update-session-status-by-bet', {
        betAmount: bet,
        status: 'playing'
      });
      
      // The server will start calling numbers automatically
      // when we send the 'start-game' message in the useEffect
    } else {
      console.error('WebSocket service not available');
    }
  };

  const handleWebSocketConnected = () => {
    setIsWebSocketConnected(true);
    console.log('WebSocket connected in GameInterface');
  };

  const handleSessionsUpdate = (sessions: GameSession[]) => {
    // Filter sessions for the current bet amount
    const betSessions = sessions.filter(session => session.betAmount === bet);
    
    // Calculate prize pool and player count
    // const activePlayers = betSessions.filter(session =>
    //   ['playing', 'blocked', 'active'].includes(session.status)
    // ).length;

    const activePlayers = betSessions.length;


    setNumberOfPlayers(activePlayers);
    
    // Calculate prize pool as 80% of total bets
    const pool = activePlayers * bet * 0.8;
    setPrizePool(pool);
    
    // Update game sessions
    setGameSessions(betSessions);
  };

  const handleGameEnded = (data: { winnerId: string, winnerCard: number, prizePool: number }) => {
    // Show winner modal
    setWinners([{ 
      id: data.winnerCard, 
      userId: data.winnerId, 
      pattern: 'row' // Default pattern
    }]);
    setShowGameOverModal(true);
    
    // Stop calling numbers
    setIsCalling(false);
  };

  // Check for game over condition
useEffect(() => {
  if (
    (numberOfPlayers === 0 && calledNumbers.length > 0) ||
    calledNumbers.length === 75
  ) {
    checkGameOver();
  }
}, [numberOfPlayers, calledNumbers]);


  const checkGameOver = async () => {
    try {

      
      // Check if there's a winner in game history
      const response = await api.get(`/game/history/latest/${bet}`);
      if (response.data) {
        const winnerHistory: GameHistory = response.data;
        setGameOverWinner(winnerHistory);
        
        // Delete game sessions for this bet amount via WebSocket
        if (webSocketService) {
          webSocketService.send('reset-game', {
            betAmount: bet,
          });
        }
        // Show toast message
        const winMessage = language === 'am' 
          ? `ተጫዋች ${winnerHistory.winnerCard} አሸንፏል!` 
          : `Player ${winnerHistory.winnerCard} wins!`;
        setToastMessage(winMessage);
        setShowToast(true);
        
        // Show winner modal after 2 seconds
        setTimeout(() => {
          setWinners([{ 
            id: winnerHistory.winnerCard, 
            userId: winnerHistory.winnerId._id, 
            pattern: 'row' // Default pattern, will be determined in getWinningPatternCells
          }]);
          setShowGameOverModal(true);
        }, 2000);
        
        // Stop calling numbers
        setIsCalling(false);
      }
    } catch (error) {
      console.error('Error checking game over:', error);
    }
  };

  useEffect(() => {
    // Update recent numbers when calledNumbers changes
    if (calledNumbers.length > 0) {
      const recent = calledNumbers.slice(-3);
      setRecentNumbers(recent);
    }
  }, [calledNumbers]);

  const checkForWinner = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return {
        isWinner: false,
        message: language === 'am' 
          ? `ተጫዋች ${playerId} በጨዋታው ውስጥ አይገኝም` 
          : `Player ${playerId} is not in the game`,
        playerId
      };
    }

    if (blockedPlayers.includes(playerId)) {
      return {
        isWinner: false,
        message: language === 'am' 
          ? `ተጫዋች ${playerId} ተገድቧል` 
          : `Player ${playerId} is blocked`,
        playerId
      };
    }

    const card = getCardById(playerId);
    const patterns: WinPattern[] = ["row", "column", "diagonal", "corners"];
    const lastCalledNumber = calledNumbers[calledNumbers.length - 1];

    for (const pattern of patterns) {
      const winResult = checkWin(calledNumbers, card, pattern);
      if (winResult) {
        // Check if the last called number is part of the winning pattern
        const lastNum = parseInt(lastCalledNumber?.split('-')[1] || '0');
        const lastLetter = lastCalledNumber?.split('-')[0] || '';
        
        let includesLastCalled = false;
        
        if (pattern === 'row') {
          // Check which row has the last called number
          const rowIndex = card.findIndex(col => col.includes(lastNum));
          includesLastCalled = rowIndex !== -1;
        } else if (pattern === 'column') {
          const colIndex = "BINGO".indexOf(lastLetter);
          includesLastCalled = colIndex !== -1 && card[colIndex]?.includes(lastNum);
        } else if (pattern === 'diagonal') {
          // Check both diagonals
          const mainDiagonal = card.map((col, idx) => col[idx]);
          const antiDiagonal = card.map((col, idx) => col[4 - idx]);
          includesLastCalled = mainDiagonal.includes(lastNum) || antiDiagonal.includes(lastNum);
        } else if (pattern === 'corners') {
          const corners = [card[0][0], card[0][4], card[4][0], card[4][4]];
          includesLastCalled = corners.includes(lastNum);
        }

        if (includesLastCalled) {
          return {
            isWinner: true,
            pattern,
            message: language === 'am' 
              ? `ተጫዋች ${playerId} በ${getPatternName(pattern)} ቅደም ተከተል አሸንፏል!` 
              : `Player ${playerId} wins with ${pattern} pattern!`,
            playerId,
            userId: player.userId
          };
        } else {
          return {
            isWinner: false,
            message: language === 'am' 
              ? `ተጫዋች ${playerId} አሸንፏል ነገር ግን ያለፈውን ቁጥር ተጠቅሟል!` 
              : `Player ${playerId} won but missed the last call!`,
            playerId
          };
        }
      }
    }

    return {
      isWinner: false,
      message: language === 'am' 
        ? `ተጫዋች ${playerId} ገና አላሸነፈም` 
        : `Player ${playerId} has not won yet`,
      playerId
    };
  };

  const handleBingo = async (playerId: number) => {
    setIsCalling(false); // Stop calling numbers
    
    const result = checkForWinner(playerId);
    
    if (result.isWinner) {
      try {
        const prizeAmount = numberOfPlayers * bet * 0.8; // 80% of total bets
        
        // Show toast message for all users
        const winMessage = language === 'am' 
          ? `ተጫዋች ${playerId} አሸንፏል!` 
          : `Player ${playerId} wins!`;
        setToastMessage(winMessage);
        setShowToast(true);
        
        // Create game history
        await api.post('/game/history', {
          winnerId: result.userId,
          winnerCard: playerId,
          prizePool: prizeAmount,
          numberOfPlayers: numberOfPlayers,
          betAmount: bet
        });
        
        // Delete game sessions for this bet amount via WebSocket
        if (webSocketService) {
          webSocketService.send('end-game', {
            betAmount: bet,
            winnerId: result.userId,
            winnerCard: playerId,
            prizePool: prizeAmount
          });
        }
        
        // Show winner modal after 2 seconds
        setTimeout(() => {
          setWinners([{ id: playerId, userId: result.userId!, pattern: result.pattern! }]);
          setShowWinnerModal(true);
        }, 2000);
        
        if (soundOn && voiceService) {
          const langCode = language === 'am' ? 'am-ET' : 'en-US';
          voiceService.speak(winMessage, langCode, 1);
        }
      } catch (error) {
        console.error('Error updating game history:', error);
      }
    } else {
      // Show loser modal with card status
      try {
        // Update game session status to blocked via WebSocket
        if (webSocketService) {
          webSocketService.send('update-session-status', {
            cardNumber: playerId,
            betAmount: bet,
            status: 'playing' // Keep as playing to allow re-attempt
          });
        }
        
        setBlockedPlayers([...blockedPlayers, playerId]);
        setLoserMessage(result.message);
        setLoserCardId(playerId);
        setShowLoserModal(true);
        
        if (soundOn && voiceService) {
          const langCode = language === 'am' ? 'am-ET' : 'en-US';
          voiceService.speak(
            language === 'am' 
              ? 'ምንም አሸናፊ አልተገኘም!' 
              : 'No winner found!', 
            langCode, 
            1
          );
        }
        
        // Resume game after 3 seconds
        setTimeout(() => {
          setIsCalling(true);
        }, 3000);
      } catch (error) {
        console.error('Error blocking player:', error);
      }
    }
  };

  const getPatternName = (pattern: WinPattern) => {
    if (language === 'am') {
      return {
        'row': 'ረድፍ',
        'column': 'አምድ',
        'diagonal': 'ዲያግናል',
        'corners': 'ማዕዘኖች'
      }[pattern] || pattern;
    }
    return pattern;
  };

  const toggleUserMark = (number: string) => {
    setUserMarkedNumbers(prev => ({
      ...prev,
      [number]: !prev[number]
    }));
  };

  // Function to transpose the card for display
  const transposeCard = (card: number[][]) => {
    const transposed: number[][] = [[], [], [], [], []];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        transposed[i][j] = card[j][i];
      }
    }
    return transposed;
  };

  // Get user's cards (filtered by user ID from localStorage)
  const getUserCards = () => {
    if (!user) return [];
    return players.filter(player => player.userId === user._id);
  };

  const userCards = getUserCards();

  // Check if a number is called (for card display)
  const isNumberCalled = (number: number, letter: string) => {
    const fullNumber = `${letter}-${number}`;
    return calledNumbers.includes(fullNumber);
  };

  // Get winning pattern cells for highlighting
  const getWinningPatternCells = (card: number[][], pattern: WinPattern) => {
    const cells: {row: number, col: number}[] = [];
    const lastCalledNumber = calledNumbers[calledNumbers.length - 1];
    const lastNum = parseInt(lastCalledNumber?.split('-')[1] || '0');
    const lastLetter = lastCalledNumber?.split('-')[0] || '';
    
    if (pattern === 'row') {
      // Check each row for a win
      for (let row = 0; row < 5; row++) {
        let isWinningRow = true;
        let includesLastCalled = false;
        
        for (let col = 0; col < 5; col++) {
          const number = card[col][row];
          const letter = "BINGO"[col];
          if (!isNumberCalled(number, letter)) {
            isWinningRow = false;
            break;
          }
          // Check if this cell contains the last called number
          if (number === lastNum && letter === lastLetter) {
            includesLastCalled = true;
          }
        }
        
        if (isWinningRow && includesLastCalled) {
          for (let col = 0; col < 5; col++) {
            cells.push({row, col});
          }
          break;
        }
      }
    } else if (pattern === 'column') {
      // Check each column for a win
      for (let col = 0; col < 5; col++) {
        let isWinningCol = true;
        let includesLastCalled = false;
        
        for (let row = 0; row < 5; row++) {
          const number = card[col][row];
          const letter = "BINGO"[col];
          if (!isNumberCalled(number, letter)) {
            isWinningCol = false;
            break;
          }
          // Check if this cell contains the last called number
          if (number === lastNum && letter === lastLetter) {
            includesLastCalled = true;
          }
        }
        
        if (isWinningCol && includesLastCalled) {
          for (let row = 0; row < 5; row++) {
            cells.push({row, col});
          }
          break;
        }
      }
    } else if (pattern === 'diagonal') {
      // Check main diagonal
      let isWinningDiagonal = true;
      let includesLastCalled = false;
      
      for (let i = 0; i < 5; i++) {
        const number = card[i][i];
        const letter = "BINGO"[i];
        if (!isNumberCalled(number, letter)) {
          isWinningDiagonal = false;
          break;
        }
        // Check if this cell contains the last called number
        if (number === lastNum && letter === lastLetter) {
          includesLastCalled = true;
        }
      }
      
      if (isWinningDiagonal && includesLastCalled) {
        for (let i = 0; i < 5; i++) {
          cells.push({row: i, col: i});
        }
      }
      
      // Check anti-diagonal
      isWinningDiagonal = true;
      includesLastCalled = false;
      
      for (let i = 0; i < 5; i++) {
        const number = card[i][4 - i];
        const letter = "BINGO"[i];
        if (!isNumberCalled(number, letter)) {
          isWinningDiagonal = false;
          break;
        }
        // Check if this cell contains the last called number
        if (number === lastNum && letter === lastLetter) {
          includesLastCalled = true;
        }
      }
      
      if (isWinningDiagonal && includesLastCalled) {
        for (let i = 0; i < 5; i++) {
          cells.push({row: 4 - i, col: i});
        }
      }
    } else if (pattern === 'corners') {
      // Check corners
      const corners = [
        {row: 0, col: 0}, {row: 0, col: 4},
        {row: 4, col: 0}, {row: 4, col: 4}
      ];
      
      let isWinningCorners = true;
      let includesLastCalled = false;
      
      for (const corner of corners) {
        const number = card[corner.col][corner.row];
        const letter = "BINGO"[corner.col];
        if (!isNumberCalled(number, letter)) {
          isWinningCorners = false;
          break;
        }
        // Check if this cell contains the last called number
        if (number === lastNum && letter === lastLetter) {
          includesLastCalled = true;
        }
      }
      
      if (isWinningCorners && includesLastCalled) {
        cells.push(...corners);
      }
    }
    
    return cells;
  };

  // Add cleanup when component unmounts or game ends
  useEffect(() => {
    return () => {
      // Stop the game on server when component unmounts
      if (webSocketService && bet) {
        webSocketService.send('stop-game', { betAmount: bet });
      }
    };
  }, [webSocketService, bet]);

  if (!isClient) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 1, 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '40vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Game Info Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 0.5,
        minHeight: "8vh",
        background: 'rgba(255,255,255,0.8)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        mb: 1,
        flexWrap: 'wrap'
      }}>
        {!gameStarted ? (
          // Show countdown timer before game starts
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {language === 'am' ? 'የቀረ ጊዜ' : 'Time Left'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>
              {countdown}s
            </Typography>
          </Box>
        ) : (
          // Show current number and called numbers after game starts
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {language === 'am' ? 'አሁን የተጠራ' : 'Current'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>
                {currentNumber || "-"}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                {language === 'am' ? 'የተጠሩ ቁጥሮች' : 'Called'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {calledNumbers.length}
              </Typography>
            </Box>
          </>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {language === 'am' ? 'ተጫዋቾች' : 'Players'}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            {numberOfPlayers}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {language === 'am' ? 'ደራሽ' : 'Derash'}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '1.2rem' }}>
            {prizePool.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
          </Typography>
        </Box>
      </Box>

      {/* Main Content - Two Columns Layout */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'row' },
        flex: 1,
        gap: 0.5,
        minHeight: '25vh',
        overflow: 'hidden'
      }}>
        {/* Left Side - Number Grid */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0.5,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'auto',
          minHeight: '25vh',
          minWidth: 0
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

          {/* Number Grid - Fixed to show numbers in correct columns */}
          <Box sx={{ 
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridAutoRows: 'minmax(30px, auto)',
            gap: 0.5,
            overflow: 'auto',
            p: 0.5
          }}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => {
              const ranges = [
                { min: 1, max: 15 },
                { min: 16, max: 30 },
                { min: 31, max: 45 },
                { min: 46, max: 60 },
                { min: 61, max: 75 }
              ];
              
              return (
                <Box key={letter} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Array.from({ length: 15 }, (_, i) => {
                    const num = ranges[colIndex].min + i;
                    const fullNumber = `${letter}-${num}`;
                    const isCalled = calledNumbers.includes(fullNumber);
                    
                    return (
                      <motion.div
                        key={num}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            minHeight: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: isCalled 
                              ? 'linear-gradient(145deg, #4CAF50, #8BC34A)'
                              : 'linear-gradient(145deg, #ffffff, #e0e0e0)',
                            color: isCalled ? 'white' : 'text.primary',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s ease',
                            border: isCalled 
                              ? '1px solid #2E7D32'
                              : '1px solid #e0e0e0',
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
          
          {/* Recent Numbers */}
          {gameStarted && (
            <Box sx={{ 
              p: 1,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              mt: 1,
              minHeight: '5vh'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1 }}>
                {language === 'am' ? 'ያለፉት ቁጥሮች' : 'Recent Numbers'}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap'
              }}>
                {recentNumbers.map((num, index) => (
                  <Box 
                    key={index}
                    sx={{
                      px: 1,
                      py: 1,
                      backgroundColor: 'orange',
                      color: 'white',
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      minWidth: 15,
                      minHeight: 5,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {num}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Side - Controls and Cards */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: '25vh',
        }}>
          {/* Controls */}
          
            {/* Language Selection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
              control={
                <Switch
                  checked={soundOn}
                  onChange={() => setSoundOn(!soundOn)}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                  {soundOn ? (language === 'am' ? 'ድምፅ በርቷል' : 'Sound on') : (language === 'am' ? 'ድምፅ' : 'Sound SSOff')}
                </Typography>
                
              }
              
            />
              <Select
                value={language}
                onChange={(e) => setLanguage && setLanguage(e.target.value)}
                size="small"
                sx={{ minWidth: 40, fontSize: '0.7rem' }}
              >
                <MenuItem value="en">EN</MenuItem>
                <MenuItem value="am">AM</MenuItem>
              </Select>
            </Box>

          {/* User Cards */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 0.5,
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: '25vh'
          }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {language === 'am' ? 'የእርስዎ ካርዶች' : 'Your Cards'}
            </Typography>
            
            {userCards.length === 0 ? (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 0.5, fontSize: '0.8rem' }}>
                {language === 'am' ? 'ምንም ካርዶች አልተመረጡም' : 'No cards selected'}
              </Typography>
            ) : (
              userCards.map(player => {
                const card = getCardById(player.id);
                const isBlocked = blockedPlayers.includes(player.id);
                
                return (
                  <Card 
                    key={player.id} 
                    sx={{ 
                      p: 1, 
                      background: isBlocked ? 'rgba(244,67,54,0.1)' : 'rgba(255,255,255,0.8)',
                      border: isBlocked ? '2px solid #f44336' : '1px solid #e0e0e0',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, fontSize: '1rem' }}>
                      {language === 'am' ? 'ካርድ' : 'Card'} #{player.id}
                      {isBlocked && ` (${language === 'am' ? 'ታግዷል' : 'Blocked'})`}
                    </Typography>
                    
                    {/* BINGO Card */}
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 0.3,
                      mb: 0.5
                    }}>
                      {/* BINGO Header */}
                      {["B", "I", "N", "G", "O"].map((letter, idx) => (
                        <Box key={letter} sx={{
                          p: 0.3,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px 4px 0 0'
                        }}>
                          {letter}
                        </Box>
                      ))}
                      
                      {/* Card numbers (transposed) - Only show user marked numbers */}
                      {transposeCard(card).map((row, rowIdx) => (
                        row.map((num, colIdx) => {
                          const letter = "BINGO"[colIdx];
                          const fullNumber = `${letter}-${num}`;
                          const isUserMarked = userMarkedNumbers[fullNumber];
                          
                          return (
                            <Box
                              key={`${rowIdx}-${colIdx}`}
                              onClick={() => toggleUserMark(fullNumber)}
                              sx={{
                                p: 0.3,
                                border: '1px solid rgba(0,0,0,0.1)',
                                backgroundColor: 
                                  (colIdx === 2 && rowIdx === 2) ? 'rgba(255,235,59,0.3)' :
                                  isUserMarked
                                    ? 'rgba(255,152,0,0.5)' // Orange for user marked
                                    : 'rgba(255,255,255,0.7)',
                                color: 'text.primary',
                                fontWeight: 'normal',
                                fontSize: '0.8rem',
                                minHeight: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: isUserMarked 
                                    ? 'rgba(255,152,0,0.7)' 
                                    : 'rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              {num === 0 ? (language === 'am' ? '*' : '*') : num}
                            </Box>
                          );
                        })
                      ))}
                    </Box>
                    
                    {/* Bingo Button */}
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => handleBingo(player.id)}
                      disabled={isBlocked || !gameStarted}
                      fullWidth
                      size="small"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      BINGO
                    </Button>
                  </Card>
                );
              })
            )}
            
            {/* Clear Button (only shown before game starts) */}
            {!gameStarted && (
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={onBackToPlayerLobby}
                fullWidth
                size="small"
                sx={{ fontSize: '0.8rem', mt: 1 }}
              >
                {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Back to Lobby'}
              </Button>
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
            width: '90%',
            maxWidth: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
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
                setShowWinnerModal(false);
                onGameEnd();
              }}
              sx={{
                position: 'absolute',
                right: 4,
                top: 4,
                color: 'white',
                fontSize: '1rem'
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h5" gutterBottom sx={{ 
                color: 'gold',
                mb: 2,
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(255,215,0,0.7)'
              }}>
                {language === 'am' ? 'እንኳን ደስ ያለህ! 🎉' : '🎉 CONGRATULATIONS! 🎉'}
              </Typography>
            </motion.div>
            
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 2
            }}>
              {winners.map(winner => {
                const isCurrentUser = user && user._id === winner.userId;
                const card = getCardById(winner.id);
                const winningCells = getWinningPatternCells(card, winner.pattern);
                
                return (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      p: 1.5,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: 'white',
                        mb: 1,
                        fontWeight: 'bold'
                      }}>
                        {isCurrentUser 
                          ? (language === 'am' ? 'እርስዎ አሸንፋሉ!' : 'You won!')
                          : `${language === 'am' ? 'ተጫዋች' : 'Player'} ${winner.id}`}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#a1c4fd',
                        mb: 1.5,
                        fontStyle: 'italic'
                      }}>
                        {language === 'am' 
                          ? `በ${getPatternName(winner.pattern)} ቅደም ተከተል አሸንፈዋል!`
                          : `Won with ${winner.pattern} pattern!`}
                      </Typography>
                      
                      {/* Winner Card */}
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 0.3,
                        mb: 1,
                        p: 1,
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: 1
                      }}>
                        {/* BINGO Header */}
                        {["B", "I", "N", "G", "O"].map((letter, idx) => (
                          <Box key={letter} sx={{
                            p: 0.3,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px 4px 0 0'
                          }}>
                            {letter}
                          </Box>
                        ))}
                        
                        {/* Card numbers with winning pattern highlight */}
                        {transposeCard(card).map((row, rowIdx) => (
                          row.map((num, colIdx) => {
                            const letter = "BINGO"[colIdx];
                            const isCalled = isNumberCalled(num, letter);
                            const isWinningCell = winningCells.some(cell => cell.row === rowIdx && cell.col === colIdx);
                            const isLastCalled = currentNumber === `${letter}-${num}`;
                            
                            return (
                              <motion.div
                                key={`${rowIdx}-${colIdx}`}
                                animate={isLastCalled ? { 
                                  scale: [1, 1.2, 1],
                                  boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 10px rgba(255,215,0,0.8)', '0 0 0px rgba(255,215,0,0)']
                                } : {}}
                                transition={{ duration: 0.5, repeat: isLastCalled ? Infinity : 0 }}
                              >
                                <Box
                                  sx={{
                                    p: 0.3,
                                    border: isWinningCell 
                                      ? '2px solid orange' 
                                      : '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 
                                      (colIdx === 2 && rowIdx === 2) ? 'rgba(255,235,59,0.3)' :
                                      isCalled 
                                        ? 'rgba(76,175,80,0.3)' 
                                        : 'rgba(255,255,255,0.7)',
                                    color: 'text.primary',
                                    fontWeight: 'normal',
                                    fontSize: '0.9rem',
                                    minHeight: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '2px',
                                    boxShadow: isWinningCell ? '0 0 8px rgba(255,165,0,0.8)' : 'none'
                                  }}
                                >
                                  {num === 0 ? (language === 'am' ? '*' : '*') : num}
                                </Box>
                              </motion.div>
                            );
                          })
                        ))}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setShowWinnerModal(false);
                  onGameEnd();
                }}
                sx={{ 
                  mt: 1,
                  px: 3,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 2px 8px rgba(255, 105, 135, 0.3)',
                  borderRadius: 2
                }}
              >
                {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
              </Button>
            </motion.div>
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
          
          {loserCardId && (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 0.3,
              mb: 2,
              p: 1,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 1
            }}>
              {/* BINGO Header */}
              {["B", "I", "N", "G", "O"].map((letter, idx) => (
                <Box key={letter} sx={{
                  p: 0.3,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px 4px 0 0'
                }}>
                  {letter}
                </Box>
              ))}
              
              {/* Card numbers with actual called numbers highlighted */}
              {transposeCard(getCardById(loserCardId)).map((row, rowIdx) => (
                row.map((num, colIdx) => {
                  const letter = "BINGO"[colIdx];
                  const isCalled = isNumberCalled(num, letter);
                  
                  return (
                    <Box
                      key={`${rowIdx}-${colIdx}`}
                      sx={{
                        p: 0.3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 
                          (colIdx === 2 && rowIdx === 2) ? 'rgba(255,235,59,0.3)' :
                          isCalled 
                            ? 'rgba(76,175,80,0.7)' 
                            : 'rgba(255,255,255,0.1)',
                        color: isCalled ? 'white' : 'rgba(255,255,255,0.7)',
                        fontWeight: isCalled ? 'bold' : 'normal',
                        fontSize: '0.6rem',
                        minHeight: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '2px',
                      }}
                    >
                      {num === 0 ? (language === 'am' ? '*' : '*') : num}
                    </Box>
                  );
                })
              ))}
            </Box>
          )}
          
          <Typography variant="body2" sx={{ 
            color: '#ffcdd2',
            mb: 2,
            fontStyle: 'italic'
          }}>
            {language === 'am' 
              ? 'ይህ ካርድ ታግዷል. ወደ ሎቢ ይመለሳሉ።'
              : 'This card is blocked. You will return to the lobby.'}
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setShowLoserModal(false);
              onGameEnd();
            }}
            sx={{ 
              mt: 1,
              fontWeight: 'bold'
            }}
          >
            {language === 'am' ? 'እሺ' : 'OK'}
          </Button>
        </Box>
      </Modal>

      {/* Game Over Modal */}
      <Modal open={showGameOverModal} onClose={() => {
        setShowGameOverModal(false);
        onGameEnd();
      }}>
        <>
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
            border: '3px solid gold',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <IconButton
              aria-label="close"
              onClick={() => {
                setShowGameOverModal(false);
                onGameEnd();
              }}
              sx={{
                position: 'absolute',
                right: 4,
                top: 4,
                color: 'white'
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h5" gutterBottom sx={{ 
                color: 'gold',
                mb: 2,
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(255,215,0,0.7)'
              }}>
                {language === 'am' ? 'ጨዋታው አልቋል! 🎉' : '🎉 GAME OVER! 🎉'}
              </Typography>
            </motion.div>
            
            {gameOverWinner && (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mb: 2
              }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ 
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    p: 1.5,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: 'white',
                      mb: 1,
                      fontWeight: 'bold'
                    }}>
                      {language === 'am' 
                        ? `ተጫዋች ${gameOverWinner.winnerCard} አሸንፏል!`
                        : `Player ${gameOverWinner.winnerCard} wins!`}
                    </Typography>
                    {/* <Typography variant="body2" sx={{ 
                      color: '#a1c4fd',
                      mb: 1.5,
                      fontStyle: 'italic'
                    }}>
                      {language === 'am' 
                        ? `የሽልማት መጠን: ${gameOverWinner.prizePool.toFixed(0)} ብር`
                        : `Prize Amount: ${gameOverWinner.prizePool.toFixed(0)} Birr`}
                    </Typography> */}
                    
                    {/* Winner Card */}
                    <Typography variant="body2" sx={{ 
                      color: 'white',
                      mb: 1,
                      fontWeight: 'bold'
                    }}>
                      {language === 'am' ? 'የአሸናፊ ካርድ' : 'Winner Card'}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 0.5,
                      mb: 1,
                      p: 1,
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 1
                    }}>
                      {/* BINGO Header */}
                      {["B", "I", "N", "G", "O"].map((letter, idx) => (
                        <Box key={letter} sx={{
                          p: 0.5,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px 4px 0 0'
                        }}>
                          {letter}
                        </Box>
                      ))}
                      
                      {/* Card numbers */}
                      {transposeCard(getCardById(gameOverWinner.winnerCard)).map((row, rowIdx) => (
                        row.map((num, colIdx) => {
                          const letter = "BINGO"[colIdx];
                          const isCalled = isNumberCalled(num, letter);
                          const isLastCalled = currentNumber === `${letter}-${num}`;
                          
                          return (
                            <motion.div
                              key={`${rowIdx}-${colIdx}`}
                              animate={isLastCalled ? { 
                                scale: [1, 1.2, 1],
                                boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 10px rgba(255,215,0,0.8)', '0 0 0px rgba(255,215,0,0)']
                              } : {}}
                              transition={{ duration: 0.5, repeat: isLastCalled ? Infinity : 0 }}
                            >
                              <Box
                                sx={{
                                  p: 0.3,
                                  border: '1px solid rgba(0,0,0,0.1)',
                                  backgroundColor: 
                                    (colIdx === 2 && rowIdx === 2) ? 'rgba(255,235,59,0.3)' :
                                    isCalled
                                      ? 'rgba(76,175,80,0.3)' 
                                      : 'rgba(255,255,255,0.7)',
                                  color: 'text.primary',
                                  fontWeight: 'normal',
                                  fontSize: '0.6rem',
                                  minHeight: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '2px',
                                }}
                              >
                                {num === 0 ? (language === 'am' ? '*' : '*') : num}
                              </Box>
                            </motion.div>
                          );
                        })
                      ))}
                    </Box>
                  </Box>
                </motion.div>
              </Box>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setShowGameOverModal(false);
                  onGameEnd();
                }}
                sx={{ 
                  mt: 1,
                  px: 3,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 2px 8px rgba(255, 105, 135, 0.3)',
                  borderRadius: 2
                }}
              >
                {language === 'am' ? 'ወደ ሎቢ ተመለስ' : 'Return to Lobby'}
              </Button>
            </motion.div>
          </Box>
        </>
      </Modal>
    </Box>
  );
};

export default GameInterface;