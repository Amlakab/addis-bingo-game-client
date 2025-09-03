'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';

export default function AgentDashboardPage() {
  const { user } = useAuth();

  if (user?.role !== 'agent') {
    return <div className="text-center py-8 text-red-600">Access denied. Agent only.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Agent Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Total Users</h2>
          <p className="text-3xl">456</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Active Games</h2>
          <p className="text-3xl">8</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">Total Commission</h2>
          <p className="text-3xl">$1,234</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <p className="text-gray-600">Recent user activity and transactions will be displayed here.</p>
      </div>
    </div>
  );
}