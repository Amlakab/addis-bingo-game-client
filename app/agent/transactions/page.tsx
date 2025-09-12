'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Send,
  DollarSign,
  CreditCard,
  Wallet,
  ExternalLink,
  X as XIcon
} from 'lucide-react';
import api from '@/app/utils/api';
import Swal from 'sweetalert2';

type TransactionType = {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name?: string;
  };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  transactionId?: string;
  senderPhone?: string;
  receiverPhone?: string;
  reason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  receiverName?: string;
  method?: string;
};

type PaginationType = {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
};

type StatsType = {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalGamePurchases: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  netBalance: number;
  recentTransactions: TransactionType[];
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [pagination, setPagination] = useState<PaginationType>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [reason, setReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    reference: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    
    Toast.fire({
      icon: type,
      title: message
    });
  };

  const showConfirmation = (title: string, text: string, confirmButtonText: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText
    });
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.reference) params.append('reference', filters.reference);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      
      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/transactions/stats/overview');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      showToast('Failed to fetch statistics', 'error');
    }
  };

  const handleViewTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
    setAction(null);
    setReason('');
    setTransactionId('');
  };

  const handleAction = (actionType: 'approve' | 'reject' | 'complete') => {
    setAction(actionType);
  };

  const submitAction = async () => {
    if (!selectedTransaction) return;

    try {
      if (selectedTransaction.type === 'deposit') {
        if (action === 'approve') {
          const result = await showConfirmation(
            'Approve Deposit',
            'Are you sure you want to approve this deposit?',
            'Yes, approve it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/deposit/${selectedTransaction._id}`, {
              status: 'completed'
            });
            showToast('Deposit approved successfully', 'success');
          }
        } else if (action === 'reject') {
          if (!reason.trim()) {
            showToast('Please provide a reason for rejection', 'warning');
            return;
          }
          
          const result = await showConfirmation(
            'Reject Deposit',
            'Are you sure you want to reject this deposit?',
            'Yes, reject it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/deposit/${selectedTransaction._id}`, {
              status: 'failed',
              reason
            });
            showToast('Deposit rejected successfully', 'success');
          }
        }
      } else if (selectedTransaction.type === 'withdrawal') {
        if (action === 'complete') {
          if (!transactionId.trim()) {
            showToast('Please provide a transaction ID', 'warning');
            return;
          }
          
          const result = await showConfirmation(
            'Complete Withdrawal',
            'Are you sure you want to mark this withdrawal as completed?',
            'Yes, complete it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/withdrawal/${selectedTransaction._id}`, {
              status: 'completed',
              transactionId
            });
            showToast('Withdrawal marked as completed', 'success');
          }
        }
      }

      setShowModal(false);
      fetchTransactions();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      showToast(error.response?.data?.message || 'Failed to update transaction', 'error');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: string }) => {
    const getTypeColor = () => {
      switch (type) {
        case 'deposit': return 'bg-blue-100 text-blue-800';
        case 'withdrawal': return 'bg-purple-100 text-purple-800';
        case 'winning': return 'bg-green-100 text-green-800';
        case 'game_purchase': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getTransactionLink = (transaction: TransactionType) => {
    if (!transaction.transactionId) return null;
    
    if (transaction.transactionId.startsWith('http')) {
      return transaction.transactionId;
    }
    
    if (transaction.reference === 'cbe') {
      return `https://apps.cbe.com.et:100/?id=${transaction.transactionId}`;
    } else if (transaction.reference === 'telebirr') {
      return `https://telebirr.ethiotelecom.et/txn/${transaction.transactionId}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Transaction Management</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-lg font-semibold">{stats.totalTransactions}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Deposits</p>
              <p className="text-lg font-semibold">{stats.totalDeposits}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Withdrawals</p>
              <p className="text-lg font-semibold">{stats.totalWithdrawals}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <ExternalLink className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Deposits</p>
              <p className="text-lg font-semibold">{stats.pendingDeposits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
        <input
          type="text"
          placeholder="Search by phone, reference..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="game_purchase">Game Purchase</option>
          <option value="winning">Winning</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                User
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Amount
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Reference
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-4">Loading...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">No transactions found</td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <tr key={tx._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{idx + 1 + (pagination.current - 1) * 10}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{tx.userId.phone}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><TypeBadge type={tx.type} /></td>
                  <td className="px-3 py-2 whitespace-nowrap">{tx.amount.toLocaleString()} ETB</td>
                  <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={tx.status} /></td>
                  <td className="px-3 py-2 whitespace-nowrap">{tx.reference}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleViewTransaction(tx)}
                      className="p-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>

            <div className="space-y-2">
              <p><strong>Type:</strong> {selectedTransaction.type}</p>
              <p><strong>Amount:</strong> {selectedTransaction.amount.toLocaleString()} ETB</p>
              <p><strong>Status:</strong> <StatusBadge status={selectedTransaction.status} /></p>
              <p><strong>Reference:</strong> {selectedTransaction.reference}</p>
              <p><strong>Date:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
              {selectedTransaction.transactionId && (
                <p>
                  <strong>Transaction ID:</strong> {selectedTransaction.transactionId}{' '}
                  {getTransactionLink(selectedTransaction) && (
                    <a href={getTransactionLink(selectedTransaction) || '#'} target="_blank" className="text-blue-600 hover:underline ml-2">View</a>
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            {selectedTransaction.type === 'deposit' && selectedTransaction.status === 'pending' && (
              <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => handleAction('approve')}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}

            {action === 'reject' && (
              <input
                type="text"
                placeholder="Reason for rejection"
                className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}

            {selectedTransaction.type === 'withdrawal' && selectedTransaction.status === 'pending' && (
              <input
                type="text"
                placeholder="Transaction ID"
                className="mt-2 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            )}

            {(action || selectedTransaction.type === 'withdrawal') && (
              <button
                onClick={submitAction}
                className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
