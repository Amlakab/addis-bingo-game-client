'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import Footer from '@/components/ui/Footer';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    telegramId: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [isValidTelegram, setIsValidTelegram] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  // Telegram validation function
  const validateTelegramId = (telegramId: string): { isValid: boolean; error: string } => {
    const cleanId = telegramId.replace('@', '').trim();
    
    // Check if empty
    if (!cleanId) {
      return { isValid: false, error: 'Telegram ID is required' };
    }
    
    // Check length
    if (cleanId.length < 5) {
      return { isValid: false, error: 'Telegram ID must be at least 5 characters long' };
    }
    
    if (cleanId.length > 32) {
      return { isValid: false, error: 'Telegram ID cannot exceed 32 characters' };
    }
    
    // Check format - must start with a letter, can contain letters, numbers, underscores
    const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!telegramRegex.test(cleanId)) {
      return { 
        isValid: false, 
        error: 'Telegram ID must start with a letter and can only contain letters, numbers, and underscores' 
      };
    }
    
    return { isValid: true, error: '' };
  };

  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, telegramId: value }));
    
    // Validate in real-time
    if (value) {
      const validation = validateTelegramId(value);
      setTelegramError(validation.error);
      setIsValidTelegram(validation.isValid);
    } else {
      setTelegramError('');
      setIsValidTelegram(false);
    }
  };

  useEffect(() => {
    // Check localStorage for agent_id and tg_id
    const storedAgentId = localStorage.getItem('agent_id');
    const storedTgId = localStorage.getItem('tg_id');

    if (storedAgentId) {
      setAgentId(storedAgentId);
    }

    if (storedTgId) {
      setFormData(prev => ({ ...prev, telegramId: storedTgId }));
      // Validate the stored Telegram ID
      const validation = validateTelegramId(storedTgId);
      setIsValidTelegram(validation.isValid);
      if (!validation.isValid) {
        setTelegramError(validation.error);
      }
    } else {
      setShowTelegramInput(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'telegramId') {
      handleTelegramChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage('You must agree to the terms and conditions');
      toast.error('You must agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    // Telegram ID validation
    const finalTelegramId = formData.telegramId || localStorage.getItem('tg_id');
    if (!finalTelegramId) {
      setMessage('Telegram ID is required');
      toast.error('Telegram ID is required');
      setIsLoading(false);
      return;
    }

    // Final Telegram validation before submission
    const telegramValidation = validateTelegramId(finalTelegramId);
    if (!telegramValidation.isValid) {
      setMessage(telegramValidation.error);
      toast.error(telegramValidation.error);
      setIsLoading(false);
      return;
    }

    try {
      // Clean Telegram ID by removing @ symbol
      const cleanTelegramId = finalTelegramId.replace('@', '').trim();
      
      const user = await register(
        formData.phone,
        formData.password,
        cleanTelegramId,
        agentId || undefined
      );
      
      if (user && user.role) {
        toast.success('Registration successful! Redirecting...', { autoClose: 2000 });
        
        // Clear localStorage after successful registration
        localStorage.removeItem('agent_id');
        localStorage.removeItem('tg_id');
        
        if (user.role === 'admin') router.push('/admin');
        else if (user.role === 'agent') router.push('/agent');
        else router.push('/user/dashboard');
      } else {
        setMessage('Registration failed: User data is missing');
        toast.error('Registration failed: User data is missing');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Registration failed';
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
        <div id="register-form" className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">Join Feta Bingo</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create your account and start playing exciting multiplayer bingo games today
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Registration Form Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-purple-700 mb-6 text-center">Create Account</h2>
              
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {message}
                </div>
              )}

              {/* Display agent information if available */}
              {/* {agentId && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Agent ID:</strong> {agentId}
                  </p>
                </div>
              )} */}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Telegram ID Field - Conditionally rendered */}
                {showTelegramInput && (
                  <div>
                    <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="telegramId"
                        name="telegramId"
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12 ${
                          telegramError ? 'border-red-300' : 
                          isValidTelegram ? 'border-green-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your Telegram username (without @)"
                        value={formData.telegramId}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        {formData.telegramId && (
                          <>
                            {isValidTelegram ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {telegramError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <XCircle className="h-3 w-3 mr-1" />
                        {telegramError}
                      </p>
                    )}
                    {isValidTelegram && (
                      <p className="text-green-500 text-xs mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid Telegram ID format
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Your Telegram username (5-32 characters, starts with a letter, can contain letters, numbers, and underscores)
                    </p>
                  </div>
                ) 
                // : (
                //   <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                //     <p className="text-sm text-green-700 flex items-center">
                //       <CheckCircle className="h-4 w-4 mr-2" />
                //       <strong>Telegram ID:</strong> {formData.telegramId}
                //     </p>
                //     <p className="text-xs text-green-600 mt-1">
                //       Telegram ID has been pre-filled from your referral link
                //     </p>
                //   </div>
                // )
                }

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-purple-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-12"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-purple-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      required
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      I agree to the{' '}
                      <Link href="/termsofservice" className="text-purple-600 hover:underline">Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacypolicy" className="text-purple-600 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (showTelegramInput && !isValidTelegram)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold text-purple-600 hover:text-purple-800 transition duration-200">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Why Join Feta Bingo?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <span className="text-green-600">🎯</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Easy to Play</h4>
                      <p className="text-sm text-gray-600">Simple rules, exciting gameplay for everyone</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <span className="text-blue-600">💰</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Win Real Money</h4>
                      <p className="text-sm text-gray-600">Deposit, play, and withdraw your winnings easily</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <span className="text-yellow-600">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Fast Payouts</h4>
                      <p className="text-sm text-gray-600">Quick withdrawals through secure payment methods</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Already have an account?</h3>
                <p className="text-purple-600 mb-4">Sign in to access your dashboard and start playing!</p>
                <Link
                  href="/auth/login"
                  className="w-full bg-white text-purple-600 border border-purple-300 hover:bg-purple-50 font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 text-center block"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}