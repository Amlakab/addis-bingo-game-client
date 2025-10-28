'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import Footer from '@/components/ui/Footer';
export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 state for toggle

  const { login, loginWithOtp } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      let user;
      if (isOtpLogin) {
        user = await loginWithOtp(phone, otp);
      } else {
        user = await login(phone, password);
      }

      if (user && user.role) {
        toast.success('Login successful! Redirecting...', {
          position: 'top-right',
          autoClose: 2000,
        });

        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'accountant') {
          router.push('/agent');
        }else if (user.role === 'agent') {
          router.push('/sub-agent');
        }  else {
          router.push('/user/dashboard');
        }
      } else {
        setMessage('Login failed: User data is missing');
        toast.error('Login failed: User data is missing');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Login failed';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setMessage('Please enter your phone number');
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        setMessage('OTP sent to your phone');
        toast.success('OTP sent to your phone');
        setIsOtpLogin(true);
      } else {
        const error = await response.json();
        const errorMsg = error.message || 'Failed to send OTP';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = 'Failed to send OTP';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div id="login-form" className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">
              Welcome to Feta Bingo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sign in to your account and join the exciting world of multiplayer
              bingo games
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Login Form Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">
                Sign In
              </h2>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    message.includes('sent') || message.includes('success')
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Password or OTP */}
                {!isOtpLogin ? (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-purple-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      OTP Code *
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
                          3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in to Your Account'
                  )}
                </button>
              </form>

              {/* Register + Forgot Password */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="font-semibold text-purple-600 hover:text-purple-800 transition duration-200"
                  >
                    Create account
                  </Link>
                </p>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Features Section (unchanged) */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">
                  Why Join Feta Bingo?
                </h3>
                <div className="space-y-4">
                  {/* Multiplayer */}
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 
                          20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 
                          20H2v-2a3 3 0 015.356-1.857M7 
                          20v-2c0-.656.126-1.283.356-1.857m0 
                          0a5.002 5.002 0 019.288 0M15 7a3 
                          3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 
                          11-4 0 2 2 0 014 0zM7 10a2 2 0 
                          11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Multiplayer Experience
                      </h4>
                      <p className="text-sm text-gray-600">
                        Play with real players in exciting real-time bingo games
                      </p>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 
                          2s1.343 2 3 2 3 .895 3 2-1.343 
                          2-3 2m0-8c1.11 0 2.08.402 
                          2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 
                          0-2.08-.402-2.599-1M21 12a9 9 0 
                          11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Instant Rewards
                      </h4>
                      <p className="text-sm text-gray-600">
                        Win real prizes and enjoy instant withdrawals
                      </p>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 
                          11.955 0 0112 2.944a11.955 
                          11.955 0 01-8.618 3.04A12.02 
                          12.02 0 003 9c0 5.591 3.824 
                          10.29 9 11.622 5.176-1.332 
                          9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Secure Platform
                      </h4>
                      <p className="text-sm text-gray-600">
                        Your data and transactions are protected with encryption
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">
                  Quick Access
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="#login-form"
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-center py-3 rounded-lg transition duration-200"
                  >
                    <div className="font-semibold">Play Now</div>
                    <div className="text-xs">Join a Game</div>
                  </Link>
                  <Link
                    href="/howtoplay"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-center py-3 rounded-lg transition duration-200"
                  >
                    <div className="font-semibold">Learn</div>
                    <div className="text-xs">How to Play</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link
                href="/termsofservice"
                className="text-purple-600 hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacypolicy"
                className="text-purple-600 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
