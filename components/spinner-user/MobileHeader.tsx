// components/MobileHeader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';

interface MobileHeaderProps {
  title: string;
  showWallet?: boolean;
  onMenuClick?: () => void;
}

export default function MobileHeader({
  title,
  showWallet = true,
  onMenuClick,
}: MobileHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 Fetch wallet balance from DB using userId in localStorage
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        // ✅ axios baseURL already has /api, so we only need `/user/:id`
        const response = await api.get(`/user/${parsedUser._id}`);

        if (response.status === 200) {
          // Your backend returns { data: user } or just { user }
          const userData = response.data.data || response.data;
          setWallet(userData.wallet || 0);
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/spinner-auth/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50">
      {/* Left side */}
      <div className="flex items-center">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-2 p-1 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        {showWallet && !loading && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {formatCurrency(wallet)}
          </div>
        )}

        <button className="p-1 rounded-md hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <button
          onClick={handleLogout}
          className="p-1 rounded-md hover:bg-gray-100 text-red-600 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
