// app/admin/layout.tsx
'use client';

import React, { useState, ReactNode } from 'react';
import AdminHeader from '@/components/agent/AdminHeader';
import AdminSidebar from '@/components/agent/AdminSidebar';
import Footer from '@/components/ui/Footer';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onMenuClick={toggleSidebar} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className="flex-1 p-6 lg:ml-0">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {children}
          </div>
        </main>
        
      </div>
      <Footer />
    </div>
  );
}
