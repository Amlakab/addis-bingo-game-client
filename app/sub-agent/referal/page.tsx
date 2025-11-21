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
  Link as LinkIcon,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import api from '@/app/utils/api';
import MobileHeader from '@/components/sub-agent/MobileHeader';
import MobileNavigation from '@/components/sub-agent/MobileNavigation';
import { encryptionService } from '@/lib/encryptionUtils';

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
};

type ReferredUser = {
  _id: string;
  phone: string;
  isActive: boolean;
  wallet: number;
  createdAt: string;
};

export default function ReferralPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  });
  const [encryptedId, setEncryptedId] = useState<string>(''); // ADD THIS LINE

  useEffect(() => {
    const fetchUserAndReferrals = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        // Fetch user data
        const userRes = await api.get(`/user/${parsedUser._id}`);
        setUser(userRes.data.data);

        // ENCRYPT THE USER ID - ADD THESE 2 LINES
        const encrypted = await encryptionService.encryptId(userRes.data.data._id);
        setEncryptedId(encrypted);

        // Fetch referred users using agent_id (user ID)
        const referralsRes = await api.get(`/user/agent/${parsedUser._id}`);
        const referredUsersData = referralsRes.data.data || [];
        setReferredUsers(referredUsersData);

        // Calculate referral stats
        const totalReferrals = referredUsersData.length;
        const activeReferrals = referredUsersData.filter((u: ReferredUser) => u.isActive).length;
        
        // Calculate total earnings from referrals
        // const totalEarnings = referredUsersData.reduce((sum: number, u: ReferredUser) => {
        //   return sum + (u.wallet * 0.1);
        // }, 0);

        const totalEarnings = userRes.data.data.wallet;

        setReferralStats({
          totalReferrals,
          activeReferrals,
          totalEarnings
        });

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndReferrals();
  }, []);

  // Generate referral links
  const referralLinks = {
    bingoApp: `https://t.me/bingofetabot?start=${encryptedId}`,
    telegramGroup: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${encryptedId}`,
    telegramChannel: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${encryptedId}&text=Join%20the%20exciting%20Bingo%20game!`,
    telegramMessage: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${encryptedId}&text=Check%20out%20this%20amazing%20Bingo%20game!`,
    telegramDirect: `https://t.me/msg?text=Join%20Bingo%20using%20my%20referral%20link:%20https://t.me/bingofetabot?start=${encryptedId}`,
    whatsapp: `https://wa.me/?text=Join%20the%20exciting%20Bingo%20game!%20Use%20my%20referral%20link:%20https://t.me/bingofetabot?start=${encryptedId}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=https://t.me/bingofetabot?start=${encryptedId}`,
    directLink: `https://t.me/bingofetabot?start=${encryptedId}`
  };
  // const referralLinks = {
  //   bingoApp: `https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
  //   telegramGroup: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
  //   telegramChannel: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}&text=Join%20the%20exciting%20Bingo%20game!`,
  //   telegramMessage: `https://t.me/share/url?url=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}&text=Check%20out%20this%20amazing%20Bingo%20game!`,
  //   telegramDirect: `https://t.me/msg?text=Join%20Bingo%20using%20my%20referral%20link:%20https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
  //   whatsapp: `https://wa.me/?text=Join%20the%20exciting%20Bingo%20game!%20Use%20my%20referral%20link:%20https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
  //   facebook: `https://www.facebook.com/sharer/sharer.php?u=https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`,
  //   directLink: `https://t.me/bingofetabot?start=${user?._id || 'USER_ID'}`
  // };

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
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Telegram Group Share',
      description: 'Share in Telegram groups',
      link: referralLinks.telegramGroup,
      icon: <Users className="h-5 w-5 text-blue-400" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Telegram Direct Message',
      description: 'Send as direct message',
      link: referralLinks.telegramDirect,
      icon: <MessageCircle className="h-5 w-5 text-blue-700" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'WhatsApp Share',
      description: 'Share on WhatsApp',
      link: referralLinks.whatsapp,
      icon: <Phone className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      name: 'Facebook Share',
      description: 'Share on Facebook',
      link: referralLinks.facebook,
      icon: <Facebook className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'Direct Link',
      description: 'Simple referral link',
      link: referralLinks.directLink,
      icon: <LinkIcon className="h-5 w-5 text-gray-600" />,
      color: 'bg-gray-50 border-gray-200'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Referral" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Referral" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="text-center text-red-600">User not found</div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <MobileHeader title="Referral Program" />

      <main className="px-4 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full mb-6 pt-4"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Program</h1>
          <p className="text-gray-600 text-sm">
            Share your referral links and earn rewards when friends join!
          </p>
        </motion.div>

        {/* Referral Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 w-full mb-6"
        >
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
            <p className="text-xs text-gray-600">Total Referrals</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{referralStats.activeReferrals}</p>
            <p className="text-xs text-gray-600">Active Users</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Share2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{formatCurrency(referralStats.totalEarnings)}</p>
            <p className="text-xs text-gray-600">Total Earnings</p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow-sm mb-6 w-full"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-blue-600" />
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Share Your Link</h3>
                <p className="text-gray-600 text-xs">
                  Copy and share your unique referral links with friends
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Friends Join</h3>
                <p className="text-gray-600 text-xs">
                  Your friends sign up using your referral link
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-purple-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Earn Rewards</h3>
                <p className="text-gray-600 text-xs">
                  Get commission from your friends' activities
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referral Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow-sm w-full"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <LinkIcon className="mr-2 h-5 w-5 text-blue-600" />
            Your Referral Links
          </h2>
          
          <div className="space-y-3">
            {shareLinks.map((shareLink, index) => (
              <motion.div
                key={shareLink.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-3 rounded-lg border-2 ${shareLink.color} transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {shareLink.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {shareLink.name}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {shareLink.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <button
                      onClick={() => copyToClipboard(shareLink.link, shareLink.name)}
                      className="flex items-center space-x-1 bg-white px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-xs"
                    >
                      {copiedLink === shareLink.name ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-gray-600" />
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
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <h3 className="font-semibold text-yellow-800 mb-2 text-sm">💡 Quick Share Tips</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Share different links for different platforms</li>
              <li>• Use Telegram groups for maximum reach</li>
              <li>• Personal messages have higher conversion</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Referral Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-4 rounded-lg shadow-sm mt-4 w-full"
        >
          <h2 className="text-lg font-semibold mb-3">Referral Program Terms</h2>
          <div className="text-xs text-gray-600 space-y-2">
            <div className="flex items-start space-x-2">
              <ArrowRight className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span>You earn 10% commission on referrals' first deposit</span>
            </div>
            <div className="flex items-start space-x-2">
              <ArrowRight className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Additional 5% commission on their game winnings</span>
            </div>
            <div className="flex items-start space-x-2">
              <ArrowRight className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Referrals must be active users</span>
            </div>
            <div className="flex items-start space-x-2">
              <ArrowRight className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Commission paid automatically to wallet</span>
            </div>
          </div>
        </motion.div>
      </main>

      <MobileNavigation />
    </div>
  );
}