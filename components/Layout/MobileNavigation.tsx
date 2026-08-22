// components/MobileNavigation.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Play, Wallet, History, User } from 'lucide-react';

const navigationItems = [
  {
    name: 'Home',
    href: '/user/dashboard',
    icon: Home
  },
  {
    name: 'Play',
    href: '/user/lobby',
    icon: Play
  },
  {
    name: 'Wallet',
    href: '/user/wallet',
    icon: Wallet
  },
  {
    name: 'History',
    href: '/user/history',
    icon: History
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User
  }
];

interface MobileNavigationProps {
  // REMOVED: backgroundColor prop
}

export default function MobileNavigation() {
  const pathname = usePathname();

  // ALWAYS use localStorage
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

  // Listen for background color changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedColor = localStorage.getItem('bingoBgColor');
      if (savedColor) {
        setBackgroundColor(savedColor);
      }
    };

    const handleColorChange = (e: CustomEvent) => {
      if (e.detail?.color) {
        setBackgroundColor(e.detail.color);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bgColorChange' as any, handleColorChange as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bgColorChange' as any, handleColorChange as any);
    };
  }, []);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t z-50"
      style={{ 
        backgroundColor: getCardBackground(),
        borderColor: getTextColor() + '20'
      }}
    >
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center relative transition-colors duration-200',
                isActive ? 'text-blue-600' : ''
              )}
              style={{ 
                color: isActive ? '#2563eb' : getTextColor(),
                opacity: isActive ? 1 : 0.7
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'scale-110')} />
              <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}