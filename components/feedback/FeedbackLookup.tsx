// components/FeedbackLookup.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Feedback {
  _id: string;
  phone?: string;
  email?: string;
  name: string;
  subject: string;
  message: string;
  response?: string;
  status: 'pending' | 'responded';
  createdAt: string;
  respondedAt?: string;
}

const FeedbackLookup: React.FC = () => {
  const [contact, setContact] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [editingId, setEditingId] = useState('');
  const router = useRouter();
  
  const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';  

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${BASE_URL}/feedback/search?${contact.includes('@') ? `email=${contact}` : `phone=${contact}`}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort feedbacks by date (oldest first, newest last)
        const sortedData = data.sort((a: Feedback, b: Feedback) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setFeedbacks(sortedData);
        setHasSearched(true);
      } else if (response.status === 401) {
        setError('Please log in to view your feedback');
      } else {
        setError('Error fetching feedback');
      }
    } catch (error) {
      setError('Error fetching feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setContact('');
    setFeedbacks([]);
    setError('');
    setHasSearched(false);
    setShowSearch(false);
    setEditingId('');
    setResponseText('');
  };

  const handleAddFeedback = () => {
    router.push('/feedback');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-purple-700">
          View Your Feedback
        </h2>
        <button
          onClick={handleAddFeedback}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Feedback
        </button>
      </div>
      
      {!showSearch && !hasSearched ? (
        <div className="text-center py-8">
          <p className="text-gray-700 mb-6">
            If you have previous feedback, click view feedback button to view the feedback you have submitted.
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-200"
          >
            View Feedback
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleLookup} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow">
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your email or phone number
                </label>
                <input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email or phone number"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !contact.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>

                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          {feedbacks.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Your Feedback History
                </h3>
                <span className="text-sm text-gray-500">
                  {feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'} found
                </span>
              </div>
              
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border border-gray-200 rounded-lg p-4 relative">
                  {/* Feedback content - takes 3/4 width and aligned to right */}
                  <div className="w-3/4 ml-auto bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-purple-700 capitalize">
                        {feedback.subject.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{feedback.message}</p>
                    <div className="text-xs text-gray-500">
                      Status: 
                      <span className={`ml-1 px-2 py-1 rounded-full ${
                        feedback.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {feedback.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Response content - takes 3/4 width and aligned to left */}
                  {feedback.response ? (
                    <div className="w-3/4 mr-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-green-700">Response</span>
                        <span className="text-xs text-gray-500">
                          {feedback.respondedAt && new Date(feedback.respondedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{feedback.response}</p>
                    </div>
                  ) : (
                    <div className="w-3/4 mr-auto p-4 rounded-lg border border-gray-200 bg-gray-100">
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500 italic">
                          No response yet. Our team will get back to you soon.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : hasSearched && !isLoading && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-700 mb-4">No feedback found for this contact information.</p>
              <button
                onClick={handleClear}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200"
              >
                Try Another Search
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackLookup;