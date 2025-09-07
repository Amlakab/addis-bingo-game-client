// components/FeedbackLookup.tsx
'use client';

import React, { useState } from 'react';

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
        setFeedbacks(data);
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
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100 mb-8">
      <h2 className="text-2xl font-semibold text-purple-700 mb-6">
        View Your Feedback
      </h2>
      
      {!showSearch && !hasSearched ? (
        <div className="text-center">
          <p className="text-gray-700 mb-4">
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
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter your email or phone number"
                required
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
              />
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
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-200"
                    >
                    Clear
                    </button>
                )}
                </div>

            </div>
          </form>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {feedbacks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Your Feedback History
                </h3>
                <span className="text-sm text-gray-500">
                  {feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'} found
                </span>
              </div>
              
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-purple-700 capitalize">
                      {feedback.subject.replace('-', ' ')}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feedback.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {feedback.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{feedback.message}</p>
                  <p className="text-sm text-gray-500">
                    Submitted on: {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                  
                  {feedback.response && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <h4 className="font-semibold text-blue-700 mb-1">Our Response:</h4>
                      <p className="text-blue-800">{feedback.response}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Responded on: {new Date(feedback.respondedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : hasSearched && !isLoading && (
            <div className="text-center py-8">
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