'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Footer from '@/components/ui/Footer';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithOtp } = useAuth();
  
  const phone = searchParams.get('phone');

  useEffect(() => {
    if (!phone) {
      router.push('/auth/login');
    }
  }, [phone, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await loginWithOtp(phone, otp);
      router.push('/user/dashboard');
    } catch (error: any) {
      setMessage(error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      
      if (response.ok) {
        setMessage('OTP sent to your phone');
        setCountdown(60);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to send OTP');
      }
    } catch (error) {
      setMessage('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify OTP
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the OTP sent to {phone}
        </p>
      </div>
      
      {message && (
        <div className={`p-3 rounded ${message.includes('sent') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
            OTP Code
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={countdown > 0 || isLoading}
            className="text-blue-600 hover:text-blue-500 text-sm disabled:text-gray-400"
          >
            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}