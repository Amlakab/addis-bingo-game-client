'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, 
  Check, 
  Share2, 
  Users, 
  TrendingUp,
  MessageCircle,
  Phone,
  Facebook,
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
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

type ReferralStats = {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
};

export default function ReferralPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0
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
        
        // In a real app, you would fetch actual referral stats from your API
        // For now, we'll use mock data
        setReferralStats({
          totalReferrals: 24,
          activeReferrals: 18,
          totalEarnings: 1250,
          pendingEarnings: 350
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Generate referral links
  const referralLinks = {
    bingoApp: `https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
    telegramGroup: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
    telegramChannel: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}&text=Join%20the%20exciting%20Bingo%20game!`,
    telegramMessage: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}&text=Check%20out%20this%20amazing%20Bingo%20game!`,
    telegramDirect: `https://t.me/msg?text=Join%20Bingo%20using%20my%20referral%20link:%20https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
    whatsapp: `https://wa.me/?text=Join%20the%20exciting%20Bingo%20game!%20Use%20my%20referral%20link:%20https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
    directLink: `https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`
  };

  const copyToClipboard = async (link: string, linkName: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(linkName);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareLinks = [
    {
      name: 'Bingo App Referral',
      description: 'Main referral link for Bingo Telegram bot',
      link: referralLinks.bingoApp,
      icon: <MessageCircle className="h-6 w-6 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Telegram Group Share',
      description: 'Share in Telegram groups',
      link: referralLinks.telegramGroup,
      icon: <Users className="h-6 w-6 text-blue-400" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Telegram Channel Post',
      description: 'Post in Telegram channels',
      link: referralLinks.telegramChannel,
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Telegram Direct Message',
      description: 'Send as direct message',
      link: referralLinks.telegramDirect,
      icon: <MessageCircle className="h-6 w-6 text-blue-700" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'WhatsApp Share',
      description: 'Share on WhatsApp',
      link: referralLinks.whatsapp,
      icon: <Phone className="h-6 w-6 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      name: 'Facebook Share',
      description: 'Share on Facebook',
      link: referralLinks.facebook,
      icon: <Facebook className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Direct Link',
      description: 'Simple referral link',
      link: referralLinks.directLink,
      icon: <LinkIcon className="h-6 w-6 text-gray-600" />,
      color: 'bg-gray-50 border-gray-200'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Referral Program</h1>
          <p className="text-gray-600 text-lg">
            Share your referral links and earn rewards when friends join!
          </p>
        </motion.div>

        {/* Referral Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
            <p className="text-gray-600">Total Referrals</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralStats.activeReferrals}</p>
            <p className="text-gray-600">Active Users</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Share2 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">${referralStats.totalEarnings}</p>
            <p className="text-gray-600">Total Earnings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Check className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">${referralStats.pendingEarnings}</p>
            <p className="text-gray-600">Pending Earnings</p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-blue-600" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Link</h3>
              <p className="text-gray-600 text-sm">
                Copy and share your unique referral links with friends
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Friends Join</h3>
              <p className="text-gray-600 text-sm">
                Your friends sign up using your referral link
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-gray-600 text-sm">
                Get commission from your friends' activities
              </p>
            </div>
          </div>
        </motion.div>

        {/* Referral Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <LinkIcon className="mr-2 h-5 w-5 text-blue-600" />
            Your Referral Links
          </h2>
          
          <div className="space-y-4">
            {shareLinks.map((shareLink, index) => (
              <motion.div
                key={shareLink.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-lg border-2 ${shareLink.color} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {shareLink.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {shareLink.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {shareLink.description}
                      </p>
                      <div className="mt-1">
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {shareLink.link}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => copyToClipboard(shareLink.link, shareLink.name)}
                      className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {copiedLink === shareLink.name ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-700 font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Share Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Quick Share Tips</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Share different links for different platforms for better tracking</li>
              <li>• Use Telegram groups and channels for maximum reach</li>
              <li>• Personal messages on WhatsApp have higher conversion rates</li>
              <li>• Facebook sharing works great for community groups</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Referral Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-md mt-6"
        >
          <h2 className="text-xl font-bold mb-4">Referral Program Terms</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• You earn 10% commission on your referrals' first deposit</p>
            <p>• Additional 5% commission on their game winnings for 30 days</p>
            <p>• Referrals must be active users who complete at least one game</p>
            <p>• Commission is paid automatically to your wallet</p>
            <p>• Any fraudulent activity will result in termination from the program</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}