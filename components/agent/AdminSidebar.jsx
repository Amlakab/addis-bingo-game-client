// components/admin/AdminSidebar.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Gamepad2, BarChart3, Wallet, 
  X, Settings, LogOut ,History
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Home', href: '/agent', icon: Home },
  //{ name: 'Users', href: '/agent/users', icon: Users },
  //{ name: 'Games', href: '/agent/games', icon: Gamepad2 },
  //{ name: 'Game History', href: '/agent/game-history', icon: History },
  { name: 'Transactions', href: '/agent/transactions', icon: History },
  { name: 'Analytics', href: '/agent/analytics', icon: BarChart3 },
  { name: 'Feedback', href: '/agent/feedback', icon: Wallet },
  { name: 'Wallet', href: '/agent/wallet', icon: Wallet },
  { name: 'Settings', href: '/agent/settings', icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Agent</h2>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center px-4 py-2 text-sm text-gray-600">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Admin Transactions</p>
              <p className="text-xs">Agent</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}