'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';

const WithdrawalForm: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (amount > user.wallet) {
      alert('Insufficient funds');
      return;
    }

    if (amount < 50) {
      alert('Minimum withdrawal amount is 50 ETB');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount,
          accountNumber,
          bankName,
        }),
      });

      if (response.ok) {
        alert('Withdrawal request submitted successfully');
        setAmount(0);
        setAccountNumber('');
        setBankName('');
      } else {
        const error = await response.json();
        alert(error.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
      
      <form onSubmit={handleWithdrawal} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount (ETB)</label>
          <input
            type="number"
            min="50"
            max={user?.wallet || 0}
            step="1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
          <p className="text-sm text-gray-600 mt-1">
            Available: {user?.wallet} ETB
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isProcessing || amount < 50 || amount > (user?.wallet || 0)}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 rounded"
        >
          {isProcessing ? 'Processing...' : 'Request Withdrawal'}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Minimum withdrawal: 50 ETB</p>
        <p>Withdrawals are processed within 24-48 hours.</p>
      </div>
    </div>
  );
};

export default WithdrawalForm;