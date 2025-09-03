'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AgentDashboard() {
  const { user } = useAuth();

  if (user?.role !== 'agent') {
    return <div className="text-center py-8 text-red-600">Access denied. Agent only.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Agent Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/agent/dashboard" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-2">Overview</h2>
          <p className="text-gray-600">View agent dashboard and statistics</p>
        </Link>
        
        <Link href="/agent/games" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-2">Game Monitoring</h2>
          <p className="text-gray-600">Monitor active games and results</p>
        </Link>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-2">User Activity</h2>
          <p className="text-gray-600">View user activity and transactions</p>
        </div>
      </div>
    </div>
  );
}