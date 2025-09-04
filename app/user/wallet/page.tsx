'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, History, Wallet, CreditCard, DollarSign } from 'lucide-react';
import api from '@/app/utils/api';

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
  const router = useRouter();

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
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'telebirr' | 'cbe'>('card');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount) return;

      setLoading(true);
      try {
        const res = await api.post('/wallet/deposit', { amount: parseFloat(amount), currency: 'ETB', method: paymentMethod });
        const { checkout_url } = res.data.data;

        if (checkout_url) {
          alert(`Redirecting to Chapa test page:\n${checkout_url}`);
          window.location.href = checkout_url;
        } else {
          alert('Failed to initialize deposit');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Deposit failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <ArrowDown className="mr-2 h-5 w-5 text-blue-600" />
          Deposit Funds
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter amount" min="1" required />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-4">
              <button type="button" className={`p-4 border rounded-lg text-center ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onClick={() => setPaymentMethod('card')}>
                <CreditCard className="h-6 w-6 mx-auto mb-2" />
                <span>Card</span>
              </button>
              <button type="button" className={`p-4 border rounded-lg text-center ${paymentMethod === 'telebirr' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onClick={() => setPaymentMethod('telebirr')}>
                <Wallet className="h-6 w-6 mx-auto mb-2" />
                <span>Telebirr</span>
              </button>
              <button type="button" className={`p-4 border rounded-lg text-center ${paymentMethod === 'cbe' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onClick={() => setPaymentMethod('cbe')}>
                <Wallet className="h-6 w-6 mx-auto mb-2" />
                <span>CBE Birr</span>
              </button>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            {loading ? 'Processing...' : `Deposit ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
          </motion.button>
        </form>

        <button className="w-full mt-4 text-gray-600 py-2 rounded-lg font-medium" onClick={() => setActiveTab('overview')}>Back to Overview</button>
      </motion.div>
    );
  };

  const WithdrawalForm = () => {
    const [amount, setAmount] = useState('');
    const [withdrawalMethod, setWithdrawalMethod] = useState<'bank' | 'mobile'>('bank');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !accountNumber) return;

      setLoading(true);
      try {
        await api.post('/wallet/withdraw', {
          amount: parseFloat(amount),
          accountNumber,
          method: withdrawalMethod
        });
        alert('Withdrawal request submitted!');
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Withdrawal failed');
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Enter amount" min="1" max={user!.wallet} required />
            </div>
            <p className="text-sm text-gray-500 mt-1">Available: {formatCurrency(user!.wallet)}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number / Mobile</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="Enter account number" required />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className={`p-4 border rounded-lg text-center ${withdrawalMethod === 'bank' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`} onClick={() => setWithdrawalMethod('bank')}>
                <Wallet className="h-6 w-6 mx-auto mb-2" />
                <span>Bank Transfer</span>
              </button>
              <button type="button" className={`p-4 border rounded-lg text-center ${withdrawalMethod === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`} onClick={() => setWithdrawalMethod('mobile')}>
                <CreditCard className="h-6 w-6 mx-auto mb-2" />
                <span>Mobile Money</span>
              </button>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium">
            {loading ? 'Submitting...' : `Withdraw ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
          </motion.button>
        </form>

        <button className="w-full mt-4 text-gray-600 py-2 rounded-lg font-medium" onClick={() => setActiveTab('overview')}>Back to Overview</button>
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
            <motion.div key={transaction._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${transaction.type === 'deposit' || transaction.type === 'winning' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'deposit' || transaction.type === 'winning' ? <ArrowDown className="h-5 w-5 text-green-600" /> : <ArrowUp className="h-5 w-5 text-red-600" />}
                </div>
                <div className="ml-3">
                  <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{transaction.description}</p>
                  <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className={`text-right ${transaction.type === 'deposit' || transaction.type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                <p className="font-semibold">{transaction.type === 'deposit' || transaction.type === 'winning' ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                <p className={`text-xs capitalize ${transaction.status === 'completed' ? 'text-green-500' : transaction.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {transaction.status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Wallet" showWallet={true}/>
      <div className="p-4 px-0 space-y-6 pb-24 pt-16">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <WalletOverview key="overview" />}
          {activeTab === 'deposit' && <DepositForm key="deposit" />}
          {activeTab === 'withdraw' && <WithdrawalForm key="withdraw" />}
        </AnimatePresence>
        <TransactionHistory />
      </div>
      <MobileNavigation />
    </div>
  );
}