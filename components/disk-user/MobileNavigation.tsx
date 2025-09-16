// components/MobileNavigation.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Play, Wallet, History, User } from 'lucide-react';

const navigationItems = [
  {
    name: 'Home',
    href: '/disk-user/dashboard',
    icon: Home
  },
  {
    name: 'Wallet',
    href: '/disk-user/wallet',
    icon: Wallet
  },

  {
    name: 'Profile',
    href: '/disk-user/profile',
    icon: User
  }
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
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
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
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