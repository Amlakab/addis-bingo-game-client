// components/admin/AdminHeader.jsx
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 p-1 rounded-md hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-2 hidden md:block">
            <p className="text-sm font-medium">{user?.phone}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-md hover:bg-gray-100 text-red-600 hover:text-red-700"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}