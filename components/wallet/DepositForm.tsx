'use client';

import React, { useState } from 'react';
import { initializeChapaPayment } from '@/lib/chapa';
import { useAuth } from '@/lib/auth';

const DepositForm: React.FC = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < 10) {
      alert('Minimum deposit amount is 10 ETB');
      return;
    }

    setIsProcessing(true);
    
    try {
      await initializeChapaPayment({
        amount,
        currency: 'ETB',
        email: `${user?.phone}@bingo.com`,
        first_name: 'User',
        last_name: user?.phone || '',
        phone_number: user?.phone || '',
        tx_ref: `deposit-${Date.now()}-${user?._id}`,
        callback_url: `${window.location.origin}/api/payment/callback`,
        return_url: `${window.location.origin}/user/wallet?success=true`,
        customization: {
          title: 'Bingo Platform Deposit',
          description: `Deposit of ${amount} ETB`,
        },
      });
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
      
      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount (ETB)</label>
          <input
            type="number"
            min="10"
            step="1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isProcessing || amount < 10}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded"
        >
          {isProcessing ? 'Processing...' : 'Deposit with Chapa'}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Minimum deposit: 10 ETB</p>
        <p>Deposits are processed securely through Chapa.</p>
      </div>
    </div>
  );
};

export default DepositForm;