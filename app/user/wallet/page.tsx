'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowDown, 
  ArrowUp, 
  History, 
  Wallet, 
  CreditCard, 
  DollarSign, 
  Eye, 
  Copy, 
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import api from '@/app/utils/api';
import Footer from '@/components/ui/Footer';

type UserType = {
  _id: string;
  phone: string;
  role: 'user' | 'agent' | 'admin';
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type TransactionType = {
  _id: string;
  userId: string | null;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  transactionId?: string;
  senderPhone?: string;
  senderName?: string;
  receiverPhone?: string;
  receiverName?: string;
  method?: 'telebirr' | 'cbe';
  reason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

type PaginationType = {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
};

type AccountantType = {
  _id: string;
  fullName: string;
  phoneNumber: string;
  accountNumber: string;
  bankName: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export default function WalletPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [accountants, setAccountants] = useState<AccountantType[]>([]);
  const [isLoadingAccountants, setIsLoadingAccountants] = useState(true);
  const router = useRouter();

  // Payment configuration - will be populated from backend
  const [paymentConfig, setPaymentConfig] = useState({
    telebirr: {
      phone: '',
      name: '',
      description: 'Pay using your Telebirr account to this phone number',
      reference: 'telebirr'
    },
    cbe: {
      account: '',
      name: '',
      description: 'Pay using your CBE account to this account number',
      reference: 'cbe'
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const res = await api.get(`/user/${parsedUser._id}`);
        setUser(res.data.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchAccountants = async () => {
      try {
        setIsLoadingAccountants(true);
        // Fetch only active (not blocked) accountants, sorted by latest
        const res = await api.get('/accountants?blocked=false');
        const activeAccountants = res.data.data;
        setAccountants(activeAccountants);
        
        // Update payment configuration with the latest active accountant
        if (activeAccountants.length > 0) {
          const latestAccountant = activeAccountants[0]; // Get the latest accountant
          setPaymentConfig({
            telebirr: {
              phone: latestAccountant.phoneNumber,
              name: latestAccountant.fullName,
              description: 'Pay using your Telebirr account to this phone number',
              reference: 'telebirr'
            },
            cbe: {
              account: latestAccountant.accountNumber,
              name: latestAccountant.fullName,
              description: 'Pay using your CBE account to this account number',
              reference: 'cbe'
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch accountants:', error);
        showMessage('Failed to load payment information', 'error');
      } finally {
        setIsLoadingAccountants(false);
      }
    };

    fetchAccountants();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoadingTransactions(true);
        const res = await api.get(`/transactions/user/${user._id}?limit=20&page=1`);
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    if (user?._id) {
      fetchTransactions();
    }
  }, [user?._id]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleViewTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard!', 'success');
  };

  if (!user && !isLoading) return <p className="text-center mt-10 text-gray-500">User not found</p>;
  if (isLoading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  const WalletOverview = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Wallet Balance</h2>
        <Wallet className="h-6 w-6 text-blue-600" />
      </div>

      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-green-600">{formatCurrency(user!.wallet)}</p>
        <p className="text-gray-500 mt-2">Available Balance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-600 mb-1">Daily Earnings</p>
          <p className="font-semibold">{formatCurrency(user!.dailyEarnings)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-green-600 mb-1">Total Earnings</p>
          <p className="font-semibold">{formatCurrency(user!.totalEarnings)}</p>
        </div>
      </div>

      <div className="flex space-x-4">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center" onClick={() => setActiveTab('deposit')}>
          <ArrowDown className="mr-2 h-5 w-5" /> Deposit
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center" onClick={() => setActiveTab('withdraw')}>
          <ArrowUp className="mr-2 h-5 w-5" /> Withdraw
        </motion.button>
      </div>
    </motion.div>
  );

  const DepositForm = () => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe'>('telebirr');
    const [userAccount, setUserAccount] = useState('');
    const [userName, setUserName] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [step, setStep] = useState<'payment' | 'verification'>('payment');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !userAccount || !userName) return;
      
      // Move to verification step
      setStep('verification');
    };

    const handleVerificationSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !userAccount || !transactionId || !userName) return;

      setLoading(true);
      try {
        // Create deposit transaction with all required fields
        const payload = {
          userId: user!._id,
          amount: parseFloat(amount),
          type: 'deposit',
          reference: `WTH-${Date.now()}-${user!._id}-${transactionId}`,
          description: `Deposit via ${paymentMethod.toUpperCase()}`,
          transactionId: transactionId,
          senderPhone: userAccount,
          senderName: userName,
          receiverPhone: paymentMethod === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account,
          receiverName: paymentMethod === 'telebirr' ? paymentConfig.telebirr.name : paymentConfig.cbe.name,
          method: paymentMethod,
          metadata: {
            method: paymentMethod
          }
        };

        const res = await api.post('/transactions', payload);
        
        if (res.data.success) {
          showMessage('Deposit request submitted successfully! It will be processed after verification.', 'success');
          setActiveTab('overview');
          // Refresh transactions
          const transactionsRes = await api.get(`/transactions/user/${user!._id}?limit=20&page=1`);
          setTransactions(transactionsRes.data.data);
          // Reset form
          setAmount('');
          setUserAccount('');
          setUserName('');
          setTransactionId('');
          setStep('payment');
        } else {
          showMessage('Failed to submit deposit request', 'error');
        }
      } catch (err: any) {
        console.error(err);
        showMessage(err.response?.data?.message || 'Deposit failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    const copyPaymentInfo = () => {
      const info = paymentMethod === 'telebirr' 
        ? paymentConfig.telebirr.phone 
        : paymentConfig.cbe.account;
      navigator.clipboard.writeText(info);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <ArrowDown className="mr-2 h-5 w-5 text-blue-600" />
          Deposit Funds
        </h2>

        {isLoadingAccountants ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        ) : accountants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No payment methods available at the moment</p>
          </div>
        ) : step === 'payment' ? (
          <form onSubmit={handlePaymentSubmit}>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  className={`p-4 border rounded-lg text-center ${paymentMethod === 'telebirr' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} 
                  onClick={() => setPaymentMethod('telebirr')}
                >
                  <Wallet className="h-6 w-6 mx-auto mb-2" />
                  <span>Telebirr</span>
                </button>
                <button 
                  type="button" 
                  className={`p-4 border rounded-lg text-center ${paymentMethod === 'cbe' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} 
                  onClick={() => setPaymentMethod('cbe')}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <span>CBE Birr</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Full Name
              </label>
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter your full name" 
                required 
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your {paymentMethod === 'telebirr' ? 'Phone Number' : 'Account Number'}
              </label>
              <input 
                type="text" 
                value={userAccount} 
                onChange={(e) => setUserAccount(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder={paymentMethod === 'telebirr' ? 'Enter your phone number' : 'Enter your account number'} 
                required 
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter amount" 
                  min="1" 
                  required 
                />
              </div>
            </div>
            

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {paymentMethod === 'telebirr' ? 'Payment Phone Number' : 'Payment Account Number'}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">
                  {paymentMethod === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account}
                </p>
                <button 
                  type="button" 
                  onClick={copyPaymentInfo}
                  className="flex items-center text-blue-600"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {paymentMethod === 'telebirr' ? paymentConfig.telebirr.description : paymentConfig.cbe.description}
              </p>
              <p className="text-sm font-medium text-gray-700 mt-2">
                Account Name: {paymentMethod === 'telebirr' ? paymentConfig.telebirr.name : paymentConfig.cbe.name}
              </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              Continue to Verification
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerificationSubmit}>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700">
                Please make the payment to the provided account and enter the transaction ID below. And only enter the link of transaction id like ''https://apps.cbe.com.et:100/?id=FT252523Y5KXXXXXXXXX''
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
              <input 
                type="text" 
                value={transactionId} 
                onChange={(e) => setTransactionId(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter transaction ID from your payment" 
                required 
              />
            </div>

            <div className="flex space-x-4">
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                type="button" 
                onClick={() => setStep('payment')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium"
              >
                Back
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </motion.button>
            </div>
          </form>
        )}

        <button className="w-full mt-4 text-gray-600 py-2 rounded-lg font-medium" onClick={() => {
          setStep('payment');
          setActiveTab('overview');
        }}>
          Back to Overview
        </button>
      </motion.div>
    );
  };

  const WithdrawalForm = () => {
    const [amount, setAmount] = useState('');
    const [withdrawalMethod, setWithdrawalMethod] = useState<'telebirr' | 'cbe'>('telebirr');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !accountNumber || !accountName) return;

      // Validate minimum withdrawal amount
      if (parseFloat(amount) < 100) {
        showMessage('Minimum withdrawal amount is 100 ETB', 'error');
        return;
      }

      // Validate sufficient balance
      if (parseFloat(amount) > user!.wallet) {
        showMessage('Insufficient balance', 'error');
        return;
      }

      setLoading(true);
      try {
        // Create withdrawal transaction with all required fields
        const payload = {
          userId: user!._id,
          amount: parseFloat(amount),
          type: 'withdrawal',
          reference: `WTH-${Date.now()}-${user!._id}`,
          description: `Withdrawal via ${withdrawalMethod.toUpperCase()}`,
          senderPhone: withdrawalMethod === 'telebirr' ? paymentConfig.telebirr.phone : paymentConfig.cbe.account,
          senderName: withdrawalMethod === 'telebirr' ? paymentConfig.telebirr.name : paymentConfig.cbe.name,
          receiverPhone: accountNumber,
          receiverName: accountName,
          method: withdrawalMethod,
          metadata: {
            method: withdrawalMethod
          }
        };

        const res = await api.post('/transactions', payload);
        
        if (res.data.success) {
          showMessage('Withdrawal request submitted successfully! It will be processed shortly.', 'success');
          setActiveTab('overview');
          // Refresh user data and transactions
          const userRes = await api.get(`/user/${user!._id}`);
          setUser(userRes.data.data);
          
          const transactionsRes = await api.get(`/transactions/user/${user!._id}?limit=20&page=1`);
          setTransactions(transactionsRes.data.data);
          // Reset form
          setAmount('');
          setAccountNumber('');
          setAccountName('');
        } else {
          showMessage('Failed to submit withdrawal request', 'error');
        }
      } catch (err: any) {
        console.error(err);
        showMessage(err.response?.data?.message || 'Withdrawal failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <ArrowUp className="mr-2 h-5 w-5 text-green-600" />
          Withdraw Funds
        </h2>

        {isLoadingAccountants ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        ) : accountants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No withdrawal methods available at the moment</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  className={`p-4 border rounded-lg text-center ${withdrawalMethod === 'telebirr' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`} 
                  onClick={() => setWithdrawalMethod('telebirr')}
                >
                  <Wallet className="h-6 w-6 mx-auto mb-2" />
                  <span>Telebirr</span>
                </button>
                <button 
                  type="button" 
                  className={`p-4 border rounded-lg text-center ${withdrawalMethod === 'cbe' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`} 
                  onClick={() => setWithdrawalMethod('cbe')}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <span>CBE Birr</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input 
                type="text" 
                value={accountName} 
                onChange={(e) => setAccountName(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                placeholder="Enter account holder name" 
                required 
              />
            </div>

             <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your {withdrawalMethod === 'telebirr' ? 'Phone Number' : 'Account Number'}
              </label>
              <input 
                type="text" 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                placeholder={withdrawalMethod === 'telebirr' ? 'Enter your phone number' : 'Enter your account number'} 
                required 
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                  placeholder="Enter amount" 
                  min="100" 
                  max={user!.wallet} 
                  required 
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Available: {formatCurrency(user!.wallet)} (Minimum: 100 ETB)</p>
            </div>
            

            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              {loading ? 'Processing...' : `Withdraw ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
            </motion.button>
          </form>
        )}

        <button className="w-full mt-4 text-gray-600 py-2 rounded-lg font-medium" onClick={() => setActiveTab('overview')}>
          Back to Overview
        </button>
      </motion.div>
    );
  };

  const TransactionHistory = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <History className="mr-2 h-5 w-5 text-blue-600" />
          Transaction History
        </h2>
      </div>

      {isLoadingTransactions ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <motion.div 
              key={transaction._id} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${transaction.type === 'deposit' || transaction.type === 'winning' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'deposit' || transaction.type === 'winning' ? 
                    <ArrowDown className="h-5 w-5 text-green-600" /> : 
                    <ArrowUp className="h-5 w-5 text-red-600" />
                  }
                </div>
                <div className="ml-3">
                  <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{transaction.description}</p>
                  <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`text-right mr-3 ${transaction.type === 'deposit' || transaction.type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-semibold">{transaction.type === 'deposit' || transaction.type === 'winning' ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                 <p
                  className={`text-xs capitalize ${
                    transaction.status === 'completed'
                      ? 'text-green-500'
                      : transaction.status === 'pending'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                >
                  {transaction.status}
                </p>

                </div>
                <button 
                  onClick={() => handleViewTransaction(transaction)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const TransactionModal = () => {
    if (!selectedTransaction) return null;

    const getTransactionLink = () => {
      if (!selectedTransaction.transactionId) return null;
      
      // If transactionId is already a full URL, use it directly
      if (selectedTransaction.transactionId.startsWith('http')) {
        return selectedTransaction.transactionId;
      }
      
      // Otherwise, construct the URL based on the method
      if (selectedTransaction.method === 'cbe') {
        return `https://apps.cbe.com.et:100/?id=${selectedTransaction.transactionId}`;
      } else if (selectedTransaction.method === 'telebirr') {
        return `https://telebirr.ethiotelecom.et/txn/${selectedTransaction.transactionId}`;
      }
      return null;
    };

    const transactionLink = getTransactionLink();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Info Card */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Transaction Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium capitalize">{selectedTransaction.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`capitalize font-medium ${selectedTransaction.status === 'completed' ? 'text-green-500' : selectedTransaction.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {selectedTransaction.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className={`font-semibold ${selectedTransaction.type === 'deposit' || selectedTransaction.type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedTransaction.type === 'deposit' || selectedTransaction.type === 'winning' ? '+' : '-'}
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Method</p>
                    <p className="font-medium capitalize">{selectedTransaction.method}</p>
                  </div>
                </div>
              </div>

              {/* Dates Card */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Timeline</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm">{new Date(selectedTransaction.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Parties Card */}
              {(selectedTransaction.senderPhone || selectedTransaction.receiverPhone || selectedTransaction.senderName || selectedTransaction.receiverName) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Parties Involved</h4>
                  <div className="space-y-2">
                    {selectedTransaction.senderPhone && (
                      <div>
                        <p className="text-xs text-gray-500">
                          {selectedTransaction.type === 'deposit' ? 'From (Your Account)' : 'From (Platform Account)'}
                        </p>
                        <p className="text-sm">{selectedTransaction.senderPhone}</p>
                        {selectedTransaction.senderName && (
                          <p className="text-sm font-medium">{selectedTransaction.senderName}</p>
                        )}
                      </div>
                    )}
                    {selectedTransaction.receiverPhone && (
                      <div>
                        <p className="text-xs text-gray-500">
                          {selectedTransaction.type === 'deposit' ? 'To (Platform Account)' : 'To (Your Account)'}
                        </p>
                        <p className="text-sm">{selectedTransaction.receiverPhone}</p>
                        {selectedTransaction.receiverName && (
                          <p className="text-sm font-medium">{selectedTransaction.receiverName}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info Card */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                  {selectedTransaction.transactionId && (
                    <div>
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-sm break-all">{selectedTransaction.transactionId}</p>
                    </div>
                  )}
                  {selectedTransaction.reason && (
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm text-red-500">{selectedTransaction.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Link */}
              {transactionLink && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-500 mb-2">Transaction Verification</h4>
                  <a 
                    href={transactionLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View transaction on {selectedTransaction.method?.toUpperCase()}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Wallet" showWallet={true}/>
      
      {/* Message Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="p-4 px-0 space-y-6 pb-24 pt-16">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <WalletOverview key="overview" />}
          {activeTab === 'deposit' && <DepositForm key="deposit" />}
          {activeTab === 'withdraw' && <WithdrawalForm key="withdraw" />}
        </AnimatePresence>
        <TransactionHistory />
      </div>
      <Footer />
      <MobileNavigation />
      {showTransactionModal && <TransactionModal />}
    </div>
  );
}