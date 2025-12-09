export interface User {
  _id: string;
  phone: string;
  role: 'user' | 'disk-user' | 'spinner-user' | 'agent' | 'accountant' | 'admin';
  wallet: number;
  remainingWallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  tg_id: string;
  agent_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Accountant {
  _id: string;
  fullName: string;
  phoneNumber: string;
  accountNumber: string;
  bankName: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
} 

export interface Game {
  _id: string;
  name: string;
  cardCount: number;
  cardPrice: number;
  status: 'waiting' | 'active' | 'completed';
  calledNumbers: number[];
  currentNumberIndex: number;
  winner?: string;
  winningPattern?: string;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  numberSequence: number[];
}

export interface BingoCard {
  _id: string;
  gameId: string;
  userId: string;
  numbers: number[][];
  markedNumbers: number[];
  isBlocked: boolean;
  isWinner: boolean;
  purchaseTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Winning {
  _id: string;
  userId: string;
  gameId: string;
  cardId: string;
  amount: number;
  pattern: string;
  createdAt: Date;
}

// types/index.ts
// types/index.ts
export interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<User>;
  loginWithOtp: (phone: string, otp: string) => Promise<User>;
  register: (phone: string, password: string, tg_id: string, agent_id?: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

export interface GameSettings {
  language: 'am' | 'en' | 'om';
  speed: 1 | 1.5 | 2;
  soundEnabled: boolean;
}