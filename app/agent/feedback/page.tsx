// app/admin/feedback/page.tsx
'use client';

import React from 'react';
import AdminFeedbackManager from '@/components/feedback/AdminFeedbackManager';
import Navbar from '@/components/ui/Navbar';

export default function AdminFeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <AdminFeedbackManager />
      </div>
    </div>
  );
}