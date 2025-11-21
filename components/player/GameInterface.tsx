'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, Box, Typography, Card, CardContent, 
  useTheme, useMediaQuery, Alert, Snackbar, TextField,
  IconButton, CircularProgress, Modal, Switch,
  FormControlLabel, Select, MenuItem
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
  prize?: number;
  totalWinners?: number;
  winningCells?: {row: number, col: number}[];
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
  status: string;
  createdAt: string;
}

interface BetTimerState {
  status: 'ready' | 'active' | 'in-progress';
  timer: number;
  playerCount: number;
  prizePool: number;
  createdAt: Date | null;
}

interface GameInterfaceProps {
  players: PlayerSelection[]; 
  bet: number; 
  onGameEnd: () => void;
  onBackToPlayerLobby: () => void;
  language?: 'en' | 'am';
  earningsPercentage?: number;
  setLanguage?: (lang: 'en' | 'am') => void;
}

const GameInterface = ({ 
  players, 
  bet, 
  onGameEnd,
  onBackToPlayerLobby,
  language = 'am',
  earningsPercentage = 20,
  setLanguage
}: GameInterfaceProps) => {
  // State declarations
  const [calledNumbers, setCalledNumbers] = useState<string[]>([]);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  // CRITICAL FIX: Add server state tracking
  const [serverCalledNumbers, setServerCalledNumbers] = useState<string[]>([]);
  const [serverCurrentNumber, setServerCurrentNumber] = useState<string>("");
  
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
  const [loserCardId, setLoserCardId] = useState<number | null>(null);
  const { user } = useAuth();
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [voiceService, setVoiceService] = useState<any>(null);
  const [webSocketService, setWebSocketService] = useState<any>(null);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Game control state - UPDATED: Only use server timing for countdown
  const [countdown, setCountdown] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date | null>(null);
  const [gameStopped, setGameStopped] = useState(false);
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [announcedWinners, setAnnouncedWinners] = useState<Array<{userId: string; card: number}>>([]);
  const [gracePeriodCountdown, setGracePeriodCountdown] = useState(3);
  const [submittedBingoCards, setSubmittedBingoCards] = useState<number[]>([]);
  
  // Refs
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const numberCalledRef = useRef<string>('');
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to play local Amharic audio files
  const playAmharicNumberAudio = (number: string) => {
    if (!soundOn) return;
    
    try {
      const [letter, num] = number.split('-');
      const audioFileName = `${letter}${num}`;
      const audioPath = `/Audio/${letter}/${audioFileName}.aac`;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      audioRef.current = new Audio(audioPath);
      audioRef.current.play().catch(error => {
        console.warn('Audio play failed, falling back to TTS:', error);
        if (voiceService) {
          const langCode = 'am-ET';
          voiceService.speak(number, langCode, 1);
        }
      });
      
    } catch (error) {
      console.error('Error playing Amharic audio:', error);
      if (voiceService) {
        const langCode = 'am-ET';
        voiceService.speak(number, langCode, 1);
      }
    }
  };

  // Function to play game sound effects in Amharic
  const playAmharicGameAudio = (soundType: 'won' | 'not-won') => {
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Initialize component on client side only
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

  // Add CSS animation styles
  useEffect(() => {
    if (!isClient) return;

    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes blink {
        0% { background-color: rgba(76,175,80,0.3); }
        50% { background-color: rgba(255,215,0,0.8); }
        100% { background-color: rgba(76,175,80,0.3); }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [isClient]);

  // Setup WebSocket connection state
  useEffect(() => {
    if (!webSocketService) return;

    const handleConnect = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);

    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
    };
  }, [webSocketService]);

  // NEW: Handler for server timer states
  const handleTimerStatesUpdate = useCallback((timerStates: {[key: number]: BetTimerState}) => {
    console.log('Received timer states in GameInterface:', timerStates);
    
    if (timerStates[bet]) {
      const timerState = timerStates[bet];
      setCountdown(timerState.timer);
      console.log(`Server timer for bet ${bet}: ${timerState.timer}s, status: ${timerState.status}`);
    }
  }, [bet]);

  // Setup WebSocket listeners for game control events
  useEffect(() => {
    if (!isClient || !webSocketService) return;

    console.log('Setting up game control WebSocket listeners for bet:', bet);

    // FIXED: Update server state immediately when numbers are called
    const handleNumberCalled = (data: { 
      betAmount: number; 
      number: string; 
      calledNumbers: string[] 
    }) => {
      if (data.betAmount !== bet) return;
      
      if (isProcessingRef.current || gameStopped) return;
      
      isProcessingRef.current = true;
      
      if (numberCalledRef.current === data.number) {
        isProcessingRef.current = false;
        return;
      }
      
      numberCalledRef.current = data.number;
      setCurrentNumber(data.number);
      setCalledNumbers(data.calledNumbers);
      
      // CRITICAL FIX: Update server state immediately
      setServerCurrentNumber(data.number);
      setServerCalledNumbers(data.calledNumbers);
      
      setIsCalling(true);
      
      if (soundOn) {
        if (language === 'am') {
          playAmharicNumberAudio(data.number);
        } else {
          if (voiceService) {
            const langCode = 'en-US';
            voiceService.speak(data.number, langCode, 1);
          }
        }
      }
      
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 50);
    };

    const handleGameStopped = (data: { 
      betAmount: number; 
      firstWinner: { userId: string; card: number };
      message: string;
    }) => {
      if (data.betAmount !== bet) return;
      
      console.log('First winner found - grace period started:', data);
      
      setGameStopped(true);
      setGracePeriodActive(true);
      setGracePeriodCountdown(4);
      setIsCalling(false);
      
      setToastMessage(data.message);
      setShowToast(true);
      
      if (gracePeriodTimerRef.current) {
        clearInterval(gracePeriodTimerRef.current);
      }
      
      gracePeriodTimerRef.current = setInterval(() => {
        setGracePeriodCountdown(prev => {
          if (prev <= 1) {
            if (gracePeriodTimerRef.current) {
              clearInterval(gracePeriodTimerRef.current);
            }
            setGracePeriodActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleWinnerAnnounced = (data: {
      betAmount: number;
      winnerId: string;
      winnerCard: number;
      totalWinnersSoFar: number;
      message: string;
    }) => {
      if (data.betAmount !== bet) return;
      
      console.log('Additional winner announced:', data);
      
      setAnnouncedWinners(prev => {
        const isDuplicate = prev.some(w => w.userId === data.winnerId && w.card === data.winnerCard);
        if (!isDuplicate) {
          const newWinners = [...prev, { userId: data.winnerId, card: data.winnerCard }];
          console.log('Updated winners list:', newWinners);
          return newWinners;
        }
        return prev;
      });
      
      const winnerMessage = language === 'am' 
        ? `ተጫዋች ${data.winnerCard} አሸንፏል!` 
        : `Player ${data.winnerCard} wins!`;
      
      setToastMessage(winnerMessage);
      setShowToast(true);
    }

    const handleGameEnded = (data: GameEndData) => {
      if (data.betAmount !== bet) return;
      
      console.log('Final game results received:', data);
      setGameEnded(true);
      setGracePeriodActive(false);
      setGameStopped(true);
      setIsCalling(false);
      
      if (gracePeriodTimerRef.current) {
        clearInterval(gracePeriodTimerRef.current);
      }
      
      setSubmittedBingoCards([]);
      
      const formattedWinners: Winner[] = data.winners.map(winner => {
        const card = getCardById(winner.card);
        const winningPatternInfo = findWinningPatternCompletedByLastNumber(card);
        
        return {
          id: winner.card,
          userId: winner.id,
          pattern: winningPatternInfo.pattern as WinPattern,
          prize: data.split,
          totalWinners: data.totalWinners,
          winningCells: winningPatternInfo.cells
        };
      });
      
      setWinners(formattedWinners);
      setGameEndData(data);

      const userCardNumbers = getUserCards().map(card => card.id);
      const userWon = user && data.winners.some(winner => 
        userCardNumbers.includes(winner.card)
      );
      
      console.log('User win check:', {
        userId: user?._id,
        userCards: userCardNumbers,
        winners: data.winners.map(w => ({ card: w.card, id: w.id })),
        userWon
      });
      
      //const userWon = user && data.winners.some(winner => winner.id === user._id);
      
      if (userWon) {
        if (language === 'am') {
          playAmharicGameAudio('won');
        }
        setTimeout(() => {
          setShowWinnerModal(true);
        }, 1000);
      } else {
        if (language === 'am') {
          playAmharicGameAudio('not-won');
        }
        setShowGameOverModal(true);
      }
    };

    // FIXED: Also update server state in game-state handler
    const handleGameState = (data: { 
      betAmount: number; 
      calledNumbers: string[]; 
      currentNumber: string 
    }) => {
      if (data.betAmount !== bet) return;
      
      setCalledNumbers(data.calledNumbers);
      setCurrentNumber(data.currentNumber);
      
      // CRITICAL FIX: Sync server state
      setServerCurrentNumber(data.currentNumber);
      setServerCalledNumbers(data.calledNumbers);
    };

    // UPDATED: Sessions update handler - KEEP existing player/prize calculation
    const handleSessionsUpdate = (sessions: GameSession[]) => {
      const betSessions = sessions.filter(session => session.betAmount === bet);
      
      console.log('Bet sessions:', betSessions);
      
      // KEEP existing frontend logic for player count and prize pool
      const activePlayers = betSessions.filter(
        (session) => session.status !== "active"
      ).length;

      setNumberOfPlayers(activePlayers); 
      
      const pool = activePlayers * bet * 0.8;
      setPrizePool(pool);
      
      setGameSessions(betSessions);

      if (betSessions.length > 0 && !gameStarted && !gameStopped) {
        const earliestSession = betSessions.reduce((earliest, session) => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate < earliest ? sessionDate : earliest;
        }, new Date(betSessions[0].createdAt));
        
        setSessionCreatedAt(earliestSession);
        
        // Server timing will handle countdown via timer-states-update
        // We don't calculate countdown locally anymore
      }

      // NEW: Check if there are sessions with 'playing' status and restart game if needed
      const hasPlayingSessions = betSessions.some(session => session.status === "playing");
      if (hasPlayingSessions && !gameStarted && !gameStopped) {
        restartGame();
      }
    };

    // NEW: restartGame function
    const restartGame = async () => {
      setIsReady(true);
      
      if (webSocketService) {
        webSocketService.send('update-session-status-by-bet', {
          betAmount: bet,
          status: 'playing'
        });
      }

      const response = await api.get(`game/sessions/bet/${bet}`);
      const sessions = response.data;
      
      const Players = sessions.length;

    if(Players < 3){
      const message = language === 'am' ? 'በጨዋታው ውስጥ ቢያንስ 3 ተጫዋቾች መሆን አለበት!' : 'At least 3 players are required to start the game!';
      setToastMessage(message);
      setShowToast(true);
      setGameStarted(false);
      
      handleBackToLobbyWithRefund();
      return;
    }
    setGameStarted(true);
      
    };

    const handleWebSocketConnected = () => {
      setIsWebSocketConnected(true);
      console.log('WebSocket connected in GameInterface');
    };

    // Set up all listeners
    webSocketService.off('number-called', handleNumberCalled);
    webSocketService.off('game-stopped', handleGameStopped);
    webSocketService.off('winner-announced', handleWinnerAnnounced);
    webSocketService.off('game-ended', handleGameEnded);
    webSocketService.off('game-state', handleGameState);
    webSocketService.off('sessions-updated', handleSessionsUpdate);
    webSocketService.off('connected', handleWebSocketConnected);
    webSocketService.off('timer-states-update', handleTimerStatesUpdate); // NEW

    webSocketService.on('number-called', handleNumberCalled);
    webSocketService.on('game-stopped', handleGameStopped);
    webSocketService.on('winner-announced', handleWinnerAnnounced);
    webSocketService.on('game-ended', handleGameEnded);
    webSocketService.on('game-state', handleGameState);
    webSocketService.on('sessions-updated', handleSessionsUpdate);
    webSocketService.on('connected', handleWebSocketConnected);
    webSocketService.on('timer-states-update', handleTimerStatesUpdate); // NEW

    webSocketService.send('get-sessions', { betAmount: bet });
    webSocketService.send('get-timer-states'); // Request initial timer states

    return () => {
      webSocketService.off('number-called', handleNumberCalled);
      webSocketService.off('game-stopped', handleGameStopped);
      webSocketService.off('winner-announced', handleWinnerAnnounced);
      webSocketService.off('game-ended', handleGameEnded);
      webSocketService.off('game-state', handleGameState);
      webSocketService.off('sessions-updated', handleSessionsUpdate);
      webSocketService.off('connected', handleWebSocketConnected);
      webSocketService.off('timer-states-update', handleTimerStatesUpdate); // NEW
      
      if (gracePeriodTimerRef.current) {
        clearInterval(gracePeriodTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [
    isClient, webSocketService, bet, language, user, gameStopped, 
    soundOn, voiceService, gameStarted, handleTimerStatesUpdate
  ]);

  // Initialize and set up window size tracking
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  // Update recent numbers when calledNumbers changes
  useEffect(() => {
    if (calledNumbers.length > 0) {
      const recent = calledNumbers.slice(-3);
      setRecentNumbers(recent);
    }
  }, [calledNumbers]);

  // Add debugging for state synchronization
  useEffect(() => {
    if (serverCurrentNumber !== currentNumber || serverCalledNumbers.length !== calledNumbers.length) {
      console.warn('State synchronization issue detected:', {
        serverCurrentNumber,
        clientCurrentNumber: currentNumber,
        serverCalledCount: serverCalledNumbers.length,
        clientCalledCount: calledNumbers.length,
        isEqual: serverCurrentNumber === currentNumber && serverCalledNumbers.length === calledNumbers.length
      });
    }
  }, [serverCurrentNumber, currentNumber, serverCalledNumbers.length, calledNumbers.length]);

  // Start game function
  const startGame = async () => {
  if (webSocketService) {
    webSocketService.send('update-session-status-by-bet', {
      betAmount: bet,
      status: 'playing'
    });

    const response = await api.get(`game/sessions/bet/${bet}`);
    const sessions = response.data;
    
    const Players = sessions.length;

    if(Players < 3){
      const message = language === 'am' ? 'በጨዋታው ውስጥ ቢያንስ 3 ተጫዋቾች መሆን አለበት!' : 'At least 3 players are required to start the game!';
      setToastMessage(message);
      setShowToast(true);
      setGameStarted(false);
      
      // Wait 5 seconds after showing message, then refund and go back to lobby
      setTimeout(() => {
        handleBackToLobbyWithRefund();
      }, 5000);
      
      return;
    }

    setGameStarted(true);
    webSocketService.send('start-game', { betAmount: bet });
  }
};

  // UPDATED: Start countdown when server timer is available
  useEffect(() => {
    if (countdown > 0 && !gameStarted && !gameStopped) {
      if(countdown===4 || countdown===3 || countdown===2 || countdown===1 || countdown===0 || countdown===45 || countdown===44){
        setIsReady(true);
      }
      // If countdown is 45, start immediately
      if (countdown === 1 || countdown === 0 || countdown === 45 || countdown === 44 || countdown === 43 || countdown === 42 || countdown === 41) {
        startGame();
        return; // no need to start interval
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      console.log(`Starting countdown with server time: ${countdown}s`);

      // countdownIntervalRef.current = setInterval(() => {
      //   setCountdown(prev => {
      //     if (prev <= 1) {
      //       if (countdownIntervalRef.current) {
      //         clearInterval(countdownIntervalRef.current);
      //       }
      //       startGame();  // <-- Start when countdown reaches 0
      //       return 0;
      //     }
      //     return prev - 1;
      //   });
      // }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown, gameStarted, gameStopped]);

  // FIXED: Use SERVER state for win checking
  const isNumberCalled = (number: number, letter: string) => {
    if (number === 0) return true;
    
    const fullNumber = `${letter}-${number}`;
    return serverCalledNumbers.includes(fullNumber);
  };

  // FIXED: Find which pattern was COMPLETED by the last called number - USING SERVER STATE
  const findWinningPatternCompletedByLastNumber = (card: number[][]): { pattern: WinPattern; cells: {row: number, col: number}[] } => {
    const transposedCard = transposeCard(card);
    
    // CRITICAL FIX: Use SERVER current number, not client state
    const [lastLetter, lastNumStr] = serverCurrentNumber.split('-');
    const lastNum = parseInt(lastNumStr);
    
    // Check rows - find the row that contains the last number and see if it's now complete
    for (let row = 0; row < 5; row++) {
      let containsLastNumber = false;
      let isRowComplete = true;
      
      for (let col = 0; col < 5; col++) {
        const number = transposedCard[row][col];
        const letter = "BINGO"[col];
        const isFreeSpace = (col === 2 && row === 2);
        
        // Check if this cell contains the last called number
        if (letter === lastLetter && number === lastNum) {
          containsLastNumber = true;
        }
        
        // Check if this cell is marked (called or free space)
        if (!isFreeSpace && !isNumberCalled(number, letter)) {
          isRowComplete = false;
        }
      }
      
      // This row wins AND contains the last called number
      if (isRowComplete && containsLastNumber) {
        const rowCells = [];
        for (let col = 0; col < 5; col++) {
          rowCells.push({row, col});
        }
        return { pattern: 'row', cells: rowCells };
      }
    }
    
    // Check columns - find the column that contains the last number and see if it's now complete
    for (let col = 0; col < 5; col++) {
      let containsLastNumber = false;
      let isColComplete = true;
      
      for (let row = 0; row < 5; row++) {
        const number = transposedCard[row][col];
        const letter = "BINGO"[col];
        const isFreeSpace = (col === 2 && row === 2);
        
        // Check if this cell contains the last called number
        if (letter === lastLetter && number === lastNum) {
          containsLastNumber = true;
        }
        
        // Check if this cell is marked (called or free space)
        if (!isFreeSpace && !isNumberCalled(number, letter)) {
          isColComplete = false;
        }
      }
      
      // This column wins AND contains the last called number
      if (isColComplete && containsLastNumber) {
        const colCells = [];
        for (let row = 0; row < 5; row++) {
          colCells.push({row, col});
        }
        return { pattern: 'column', cells: colCells };
      }
    }
    
    // Check main diagonal - see if it contains the last number and is complete
    let containsLastNumberInMainDiagonal = false;
    let isMainDiagonalComplete = true;
    
    for (let i = 0; i < 5; i++) {
      const number = transposedCard[i][i];
      const letter = "BINGO"[i];
      const isFreeSpace = (i === 2);
      
      // Check if this cell contains the last called number
      if (letter === lastLetter && number === lastNum) {
        containsLastNumberInMainDiagonal = true;
      }
      
      // Check if this cell is marked (called or free space)
      if (!isFreeSpace && !isNumberCalled(number, letter)) {
        isMainDiagonalComplete = false;
      }
    }
    
    if (isMainDiagonalComplete && containsLastNumberInMainDiagonal) {
      const mainDiagonalCells = [];
      for (let i = 0; i < 5; i++) {
        mainDiagonalCells.push({row: i, col: i});
      }
      return { pattern: 'diagonal', cells: mainDiagonalCells };
    }
    
    // Check anti-diagonal - see if it contains the last number and is complete
    let containsLastNumberInAntiDiagonal = false;
    let isAntiDiagonalComplete = true;
    
    for (let i = 0; i < 5; i++) {
      const number = transposedCard[i][4 - i];
      const letter = "BINGO"[i];
      const isFreeSpace = (i === 2);
      
      // Check if this cell contains the last called number
      if (letter === lastLetter && number === lastNum) {
        containsLastNumberInAntiDiagonal = true;
      }
      
      // Check if this cell is marked (called or free space)
      if (!isFreeSpace && !isNumberCalled(number, letter)) {
        isAntiDiagonalComplete = false;
      }
    }
    
    if (isAntiDiagonalComplete && containsLastNumberInAntiDiagonal) {
      const antiDiagonalCells = [];
      for (let i = 0; i < 5; i++) {
        antiDiagonalCells.push({row: i, col: 4 - i});
      }
      return { pattern: 'diagonal', cells: antiDiagonalCells };
    }
    
    // Check corners - see if the last number is a corner and all corners are complete
    const corners = [
      {row: 0, col: 0}, 
      {row: 0, col: 4},
      {row: 4, col: 0}, 
      {row: 4, col: 4}
    ];
    
    let containsLastNumberInCorners = false;
    let isCornersComplete = true;
    
    for (const corner of corners) {
      const number = transposedCard[corner.row][corner.col];
      const letter = "BINGO"[corner.col];
      
      // Check if this corner contains the last called number
      if (letter === lastLetter && number === lastNum) {
        containsLastNumberInCorners = true;
      }
      
      // Check if this corner is marked
      if (!isNumberCalled(number, letter)) {
        isCornersComplete = false;
      }
    }
    
    if (isCornersComplete && containsLastNumberInCorners) {
      return { pattern: 'corners', cells: corners };
    }
    
    return { pattern: 'row', cells: [] };
  };

  // FIXED: Check for winner - ONLY win if last called number completes a pattern
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
    
    // Find the winning pattern that was COMPLETED by the last called number
    const winningPatternInfo = findWinningPatternCompletedByLastNumber(card);
    
    if (winningPatternInfo.cells.length > 0) {
      return {
        isWinner: true,
        pattern: winningPatternInfo.pattern,
        message: language === 'am' 
          ? `ተጫዋች ${playerId} በ${getPatternName(winningPatternInfo.pattern)} ቅደም ተከተል አሸንፏል!` 
          : `Player ${playerId} wins with ${winningPatternInfo.pattern} pattern!`,
        playerId,
        userId: player.userId,
        winningCells: winningPatternInfo.cells
      };
    }

    return {
      isWinner: false,
      message: language === 'am' 
        ? `ተጫዋች ${playerId} ገና አላሸነፈም` 
        : `Player ${playerId} has not won yet`,
      playerId
    };
  };

  // FIXED: BINGO handler with synchronization delay
  const handleBingo = async (playerId: number) => {
    if (!gameStarted) {
      const message = language === 'am' ? 'ጨዋታው አላለቀም!' : 'Game has not started!';
      setToastMessage(message);
      setShowToast(true);
      return;
    }

    if (submittedBingoCards.includes(playerId)) {
      const message = language === 'am' ? 'ይህ ካርድ አስቀድሞ ቀርቧል!' : 'This card has already been submitted!';
      setToastMessage(message);
      setShowToast(true);
      return;
    }

    // CRITICAL FIX: Add small delay to ensure WebSocket messages are processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = checkForWinner(playerId);
    
    if (result.isWinner) {
      try {
        console.log(`Player ${playerId} claims BINGO! Sending to server...`);
        console.log('Server state at time of BINGO:', {
          currentNumber: serverCurrentNumber,
          calledNumbersCount: serverCalledNumbers.length,
          lastFewNumbers: serverCalledNumbers.slice(-3)
        });
        
        setSubmittedBingoCards(prev => [...prev, playerId]);
        
        if (webSocketService) {
          webSocketService.send('end-game', {
            betAmount: bet,
            winnerId: result.userId!,
            winnerCard: playerId,
            prizePool: numberOfPlayers * bet * 0.8
          });
          
          console.log(`BINGO submitted for card ${playerId}`);
          
        } else {
          throw new Error('WebSocket not available');
        }
        
      } catch (error) {
        console.error('Error announcing win:', error);
        const errorMessage = language === 'am' 
          ? 'የአሸናፊ ማስታወቂያ አልተሳካም!' 
          : 'Win announcement failed!';
        setToastMessage(errorMessage);
        setShowToast(true);
        setSubmittedBingoCards(prev => prev.filter(id => id !== playerId));
      }
    } else {
      // Log why the win check failed for debugging
      console.log(`BINGO failed for card ${playerId}. Current server state:`, {
        serverCurrentNumber,
        serverCalledNumbersCount: serverCalledNumbers.length,
        clientCurrentNumber: currentNumber,
        clientCalledNumbersCount: calledNumbers.length
      });
      
      try {
        if (webSocketService) {
          webSocketService.send('update-session-status', {
            cardNumber: playerId,
            betAmount: bet,
            status: 'playing'
          });
        }
        
        setBlockedPlayers([...blockedPlayers, playerId]);
        setLoserMessage(result.message);
        setLoserCardId(playerId);
        setShowLoserModal(true);
        
        // Use local Amharic audio for game sounds
        if (soundOn) {
          if (language === 'am') {
            playAmharicGameAudio('not-won');
          } else {
            if (voiceService) {
              const langCode = 'en-US';
              voiceService.speak(
                'No winner found!', 
                langCode, 
                1
              );
            }
          }
        }
      } catch (error) {
        console.error('Error blocking player:', error);
      }
    }
  };

  const handleBackToLobbyWithRefund = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      if (webSocketService) {
        webSocketService.send('refund-wallet', {
          betAmount: bet,
          userId: user._id
        });
        
        webSocketService.once('wallet-updated', (newBalance: number) => {
          console.log('Wallet updated successfully:', newBalance);
          onBackToPlayerLobby();
        });
        
        webSocketService.once('error', (error: { message: string }) => {
          console.error('Refund error:', error.message);
          onBackToPlayerLobby();
        });
      } else {
        console.error('WebSocket service not available');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
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

  const userCards = getUserCards();

  // FIXED: Winner Card Component - shows pattern completed by last called number
  const WinnerCard = ({ winner, isCurrentUser, language }: { 
    winner: Winner; 
    isCurrentUser: boolean;
    language: 'en' | 'am';
  }) => {
    const card = getCardById(winner.id);
    const winningCells = winner.winningCells || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          background: isCurrentUser 
            ? 'rgba(255,215,0,0.15)' 
            : 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          p: 2,
          border: isCurrentUser ? '2px solid gold' : '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ 
              color: isCurrentUser ? 'gold' : 'white',
              fontWeight: 'bold'
            }}>
              {language === 'am' ? 'ካርድ' : 'Card'} #{winner.id}
              {isCurrentUser && ` (${language === 'am' ? 'የእርስዎ' : 'Yours'})`}
            </Typography>
            
            {winner.prize && (
              <Box sx={{ 
                background: 'rgba(76,175,80,0.3)',
                borderRadius: 2,
                px: 2,
                py: 1
              }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {winner.prize.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="body2" sx={{ 
            color: '#a1c4fd',
            mb: 2,
            fontStyle: 'italic'
          }}>
            {language === 'am' 
              ? `በ${getPatternName(winner.pattern)} ቅደም ተከተል አሸንፈዋል!`
              : `Won with ${winner.pattern} pattern!`}
          </Typography>
          
          {/* Winner Card Grid */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0.3,
            mb: 1,
            p: 1,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 1,
            position: 'relative'
          }}>
            {/* BINGO Header */}
            {["B", "I", "N", "G", "O"].map((letter, idx) => (
              <Box key={letter} sx={{
                p: 0.3,
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px 4px 0 0'
              }}>
                {letter}
              </Box>
            ))}
            
            {/* Card numbers - ONLY border the pattern completed by last called number */}
            {transposeCard(card).map((row, rowIdx) => (
              row.map((num, colIdx) => {
                const letter = "BINGO"[colIdx];
                const isCalled = isNumberCalled(num, letter);
                const isWinningCell = winningCells.some(cell => cell.row === rowIdx && cell.col === colIdx);
                const isLastCalled = currentNumber === `${letter}-${num}`;
                const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                
                return (
                  <motion.div
                    key={`${rowIdx}-${colIdx}`}
                    animate={isLastCalled ? { 
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={{ 
                      duration: 0.8, 
                      repeat: isLastCalled ? Infinity : 0,
                      repeatType: "reverse"
                    }}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Box
                      sx={{
                        p: 0.3,
                        border: isWinningCell 
                          ? '3px solid #ff5722' 
                          : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: 
                          isFreeSpace ? 'rgba(255,235,59,0.5)' :
                          isCalled
                            ? isLastCalled 
                              ? 'rgba(255,215,0,0.8)'
                              : 'rgba(76,175,80,0.5)' 
                            : 'rgba(255,255,255,0.7)',
                        color: isWinningCell ? '#ff5722' : 'text.primary',
                        fontWeight: isWinningCell ? 'bold' : 'normal',
                        fontSize: '0.7rem',
                        width: '100%',
                        height: '100%',
                        minHeight: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        boxShadow: isWinningCell ? '0 0 10px rgba(255,87,34,0.6)' : 'none',
                        position: 'relative',
                        animation: isLastCalled ? 'blink 1s infinite' : 'none'
                      }}
                    >
                      {isFreeSpace ? (language === 'am' ? 'ነፃ' : 'FREE') : num}
                      {isWinningCell && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#ff5722',
                            boxShadow: '0 0 4px rgba(255,87,34,0.8)',
                            animation: 'pulse 1s infinite'
                          }}
                        />
                      )}
                    </Box>
                  </motion.div>
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
      
      {/* Grace Period Indicator */}
      {gracePeriodActive && (
        <Box sx={{
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          color: 'black',
          p: 1,
          mb: 1,
          borderRadius: 2,
          fontWeight: 'bold',
          animation: 'pulse 1s infinite'
        }}>
          ⏳ {language === 'am' 
            ? `የወሰን ጊዜ: ${gracePeriodCountdown} ሰከንድ...` 
            : `Grace period: ${gracePeriodCountdown}s...`}
        </Box>
      )}

      {/* Game Stopped Indicator */}
      {gameStopped && !gracePeriodActive && (
        <Box sx={{
          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
          color: 'white',
          p: 1,
          mb: 1,
          borderRadius: 2,
          fontWeight: 'bold'
        }}>
          ✅ {language === 'am' ? 'ጨዋታው አልቋል' : 'Game ended'}
        </Box>
      )}

      {/* Announced Winners Summary */}
      {announcedWinners.length > 0 && (
        <Box sx={{
          background: 'rgba(33,150,243,0.1)',
          p: 1,
          mb: 1,
          borderRadius: 2,
          border: '1px solid #2196F3'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976D2' }}>
            {language === 'am' 
              ? `አሸናፊዎች: ${announcedWinners.map(w => w.card).join(', ')}`
              : `Winners: ${announcedWinners.map(w => w.card).join(', ')}`}
          </Typography>
        </Box>
      )}

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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {language === 'am' ? 'የቀረ ጊዜ' : 'Time Left'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>
              {countdown !== 0 ? `${countdown}s` : 'Ready'}
            </Typography>
          </Box>
        ) : (
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
            {language === 'am' ? 'ደራሽ' : 'Prize Pool'}
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
        minHeight: '24vh',
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

          {/* Number Grid */}
          <Box
  sx={{
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gridAutoRows: "minmax(30px, auto)",
    gap: 0.15, // minimized gap
    overflow: "auto",
    p: 0.15,   // minimized padding
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
          gap: 0.2, // minimized inner gap
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

                  // ⭐ Modern gradient background
                  background: isCalled
                    ? "linear-gradient(135deg, #43A047, #7CB342)"
                    : "linear-gradient(135deg, #fafafa, #e9e9e9)",

                  color: isCalled ? "white" : "text.primary",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  transition: "all 0.15s ease-in-out",

                  // ⭐ Clean border + subtle shadow
                  border: isCalled
                    ? "2px solid #2e7d32"
                    : "2px solid #cfcfcf",

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

          
          {!isReady && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleBackToLobbyWithRefund}
              fullWidth
              size="small"
              sx={{ fontSize: '0.95rem', mt: 1, p: 0.5 }}
            >
              {language === 'am' ? 'ካርዶችን አጥፋ' : 'Clear Cards'}
            </Button>
          )}
          
          {/* Recent Numbers */}
          {gameStarted && (
            <Box sx={{ 
              p: 1,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              mt: 1,
              minHeight: '3vh'
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
                      minHeight: 2,
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
                  {soundOn ? (language === 'am' ? 'ድምፅ በርቷል' : 'Sound on') : (language === 'am' ? 'ድምፅ' : 'Sound Off')}
                </Typography>
              }
            />
            <Select
              value={language}
              onChange={(e) => setLanguage && setLanguage(e.target.value as 'en' | 'am')}
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
            {/* <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {language === 'am' ? 'የእርስዎ ካርዶች' : 'Your Cards'}
            </Typography> */}
            
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
      : "rgba(255,255,255,0.85)",
    border: isBlocked 
      ? "2px solid #f44336" 
      : "1.5px solid #dcdcdc",
    borderRadius: "4px",
    boxShadow: isBlocked
      ? "0 2px 6px rgba(244,67,54,0.25)"
      : "0 2px 5px rgba(0,0,0,0.10)",
    transition: "all 0.2s ease"
  }}
>
  <Typography 
    variant="body2" 
    sx={{ 
      fontWeight: "bold",
      mb: 1,
      fontSize: "1rem",
      color: isBlocked ? "#d32f2f" : "text.primary"
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
              border: "1.2px solid #d0d0d0",
              background:
                rowIdx === 2 && colIdx === 2
                  ? "rgba(255,235,59,0.35)" // Free space
                  : isUserMarked
                  ? "linear-gradient(135deg, rgba(255,82,82,0.8), rgba(255,23,68,0.8))"
                  : "linear-gradient(135deg, #ffffff, #f1f1f1)",
              color: isUserMarked ? "white" : "text.primary",
              fontWeight: isUserMarked ? "bold" : "normal",
              fontSize: "0.85rem",
              minHeight: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: isUserMarked
                ? "0 2px 5px rgba(0,0,0,0.20)"
                : "0 2px 5px rgba(0,0,0,0.10)",

              "&:hover": {
                background: isUserMarked
                  ? "rgba(255,152,0,0.75)"
                  : "rgba(0,0,0,0.08)"
              }
            }}
          >
            {num === 0 ? "*" : num}
          </Box>
        );
      })
    )}
  </Box>

  {/* Bingo Button */}
  <Button
    variant="contained"
    color="success"
    onClick={() => handleBingo(player.id)}
    disabled={
      isBlocked || !gameStarted || submittedBingoCards.includes(player.id)
    }
    fullWidth
    size="small"
    sx={{
      fontSize: "0.8rem",
      borderRadius: "6px",
      opacity:
        isBlocked || !gameStarted || submittedBingoCards.includes(player.id)
          ? 0.6
          : 1,
      boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
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
                mb: 3,
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(255,215,0,0.7)'
              }}>
                {language === 'am' ? 'እንኳን ደስ ያለህ! 🎉' : '🎉 CONGRATULATIONS! 🎉'}
              </Typography>
            </motion.div>

            {/* Prize Information */}
            {gameEndData && (
              <Box sx={{ 
                background: 'rgba(255,215,0,0.2)',
                borderRadius: 2,
                p: 2,
                mb: 3,
                border: '2px solid gold'
              }}>
                <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', mb: 1 }}>
                  {language === 'am' ? 'የጨዋታ ውጤት' : 'Game Results'}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd' }}>
                      {language === 'am' ? 'ጠቅላላ ደራሽ' : 'Total Prize Pool'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {gameEndData.prizePool.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd' }}>
                      {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {gameEndData.totalWinners}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#a1c4fd' }}>
                      {language === 'am' ? 'ለእያንዳንዱ' : 'Each Gets'}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
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
                fontWeight: 'bold'
              }}>
                {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
              </Typography>
              
              {user && (
                <>
                  {/* Current User's Wins */}
                  {winners.filter(winner => winner.userId === user._id).length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ 
                        color: 'gold',
                        mb: 2,
                        fontWeight: 'bold'
                      }}>
                        {language === 'am' ? 'የእርስዎ አሸናፊ ካርዶች' : 'Your Winning Cards'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {winners
                          .filter(winner => winner.userId === user._id)
                          .map((winner, index) => (
                            <WinnerCard 
                              key={index}
                              winner={winner}
                              isCurrentUser={true}
                              language={language}
                            />
                          ))}
                      </Box>
                    </Box>
                  )}

                  {/* Other Winners */}
                  {winners.filter(winner => winner.userId !== user._id).length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ 
                        color: '#a1c4fd',
                        mb: 2,
                        fontWeight: 'bold'
                      }}>
                        {language === 'am' ? 'ሌሎች አሸናፊዎች' : 'Other Winners'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {winners
                          .filter(winner => winner.userId !== user._id)
                          .map((winner, index) => (
                            <WinnerCard 
                              key={index}
                              winner={winner}
                              isCurrentUser={false}
                              language={language}
                            />
                          ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
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
              
              {/* Card numbers */}
              {transposeCard(getCardById(loserCardId)).map((row, rowIdx) => (
                row.map((num, colIdx) => {
                  const letter = "BINGO"[colIdx];
                  const isCalled = isNumberCalled(num, letter);
                  const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                  
                  return (
                    <Box
                      key={`${rowIdx}-${colIdx}`}
                      sx={{
                        p: 0.3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 
                          isFreeSpace ? 'rgba(255,235,59,0.3)' :
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
                      {isFreeSpace ? (language === 'am' ? 'ነፃ' : 'FREE') : num}
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
            
            {/* Prize Information */}
            {gameEndData && (
              <Box sx={{ 
                background: 'rgba(255,215,0,0.2)',
                borderRadius: 2,
                p: 1.5,
                mb: 2,
                border: '1px solid gold'
              }}>
                <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold' }}>
                  {language === 'am' ? 'ጠቅላላ ደራሽ' : 'Total Prize Pool'}
                </Typography>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {gameEndData.prizePool.toFixed(0)} {language === 'am' ? 'ብር' : 'Birr'}
                </Typography>
                {gameEndData.totalWinners > 1 && (
                  <Typography variant="body2" sx={{ color: '#a1c4fd', mt: 1 }}>
                    {language === 'am' 
                      ? `ከ${gameEndData.totalWinners} አሸናፊዎች ጋር ተካፍሏል`
                      : `Split among ${gameEndData.totalWinners} winners`}
                  </Typography>
                )}
              </Box>
            )}
            
            {winners.length > 0 && (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mb: 2
              }}>
                <Typography variant="h6" sx={{ 
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
                </Typography>
                
                {winners.map(winner => {
                  const card = getCardById(winner.id);
                  const winningCells = winner.winningCells || [];
                  
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
                          {language === 'am' 
                            ? `ተጫዋች ${winner.id}`
                            : `Player ${winner.id}`}
                        </Typography>
                        
                        {winner.prize && (
                          <Typography variant="body2" sx={{ 
                            color: '#a1c4fd',
                            mb: 1,
                            fontStyle: 'italic'
                          }}>
                            {language === 'am' 
                              ? `የሸለመ: ${winner.prize.toFixed(0)} ብር`
                              : `Prize: ${winner.prize.toFixed(0)} Birr`}
                          </Typography>
                        )}
                        
                        {/* Winner Card with proper pattern borders */}
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
                          
                          {/* Card numbers with pattern borders */}
                          {transposeCard(card).map((row, rowIdx) => (
                            row.map((num, colIdx) => {
                              const letter = "BINGO"[colIdx];
                              const isCalled = isNumberCalled(num, letter);
                              const isWinningCell = winningCells.some(cell => cell.row === rowIdx && cell.col === colIdx);
                              const isLastCalled = currentNumber === `${letter}-${num}`;
                              const isFreeSpace = (colIdx === 2 && rowIdx === 2);
                              
                              return (
                                <Box
                                  key={`${rowIdx}-${colIdx}`}
                                  sx={{
                                    p: 0.3,
                                    border: isWinningCell 
                                      ? '3px solid #ff5722' 
                                      : '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 
                                      isFreeSpace ? 'rgba(255,235,59,0.5)' :
                                      isCalled
                                        ? isLastCalled 
                                          ? 'rgba(255,215,0,0.8)'
                                          : 'rgba(76,175,80,0.5)' 
                                        : 'rgba(255,255,255,0.7)',
                                    color: isWinningCell ? '#ff5722' : 'text.primary',
                                    fontWeight: isWinningCell ? 'bold' : 'normal',
                                    fontSize: '0.6rem',
                                    width: '100%',
                                    height: '100%',
                                    minHeight: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    boxShadow: isWinningCell ? '0 0 8px rgba(255,87,34,0.8)' : 'none',
                                    position: 'relative',
                                    animation: isLastCalled ? 'blink 1s infinite' : 'none'
                                  }}
                                >
                                  {isFreeSpace ? (language === 'am' ? 'ነፃ' : 'FREE') : num}
                                  {isWinningCell && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: '#ff5722',
                                        boxShadow: '0 0 3px rgba(255,87,34,0.8)',
                                        animation: 'pulse 1s infinite'
                                      }}
                                    />
                                  )}
                                </Box>
                              );
                            })
                          ))}
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })}
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