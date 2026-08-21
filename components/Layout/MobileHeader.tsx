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

  // NEW: Background color state
  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('bingoBgColor');
      return savedColor || 'white';
    }
    return 'white';
  });

  // Color helper functions
  const getTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  const getCardBackground = () => {
    switch(backgroundColor) {
      case 'black': return 'rgba(50, 50, 50, 0.95)';
      case 'green': return 'rgba(30, 70, 30, 0.95)';
      case 'blue': return 'rgba(30, 50, 80, 0.95)';
      case 'yellow': return 'rgba(240, 230, 140, 0.95)';
      default: return 'rgba(255, 255, 255, 0.95)';
    }
  };

  // Listen for background color changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedColor = localStorage.getItem('bingoBgColor');
      if (savedColor) {
        setBackgroundColor(savedColor);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event from color picker
    const handleColorChange = (e: CustomEvent) => {
      if (e.detail?.color) {
        setBackgroundColor(e.detail.color);
      }
    };
    window.addEventListener('bgColorChange' as any, handleColorChange as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bgColorChange' as any, handleColorChange as any);
    };
  }, []);

  // 🔹 Fetch wallet balance from DB using userId in localStorage
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const response = await api.get(`/user/${parsedUser._id}`);

        if (response.status === 200) {
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
    router.push('/');
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 border-b px-4 py-3 flex items-center justify-between z-50"
      style={{ 
        backgroundColor: getCardBackground(),
        borderColor: getTextColor() + '20',
        color: getTextColor()
      }}
    >
      {/* Left side */}
      <div className="flex items-center">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-2 p-1 rounded-md hover:opacity-70"
            style={{ color: getTextColor() }}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold" style={{ color: getTextColor() }}>{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        {showWallet && !loading && (
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e'
            }}
          >
            {formatCurrency(wallet)}
          </div>
        )}

        <button 
          className="p-1 rounded-md hover:opacity-70"
          style={{ color: getTextColor() }}
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}