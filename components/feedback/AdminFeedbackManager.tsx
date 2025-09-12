// app/admin/feedback/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import api from '@/app/utils/api';

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

interface ContactGroup {
  contact: string;
  name: string;
  feedbacks: Feedback[];
  pendingCount: number;
}

const AdminFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [editingId, setEditingId] = useState('');
  const [viewingContact, setViewingContact] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    responded: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    let filtered = feedbacks;
    
    // Apply subject filter
    if (selectedSubject) {
      filtered = filtered.filter(fb => fb.subject === selectedSubject);
    }
    
    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(fb => fb.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fb => 
        fb.name.toLowerCase().includes(query) ||
        (fb.email && fb.email.toLowerCase().includes(query)) ||
        (fb.phone && fb.phone.includes(query)) ||
        fb.subject.toLowerCase().includes(query) ||
        fb.message.toLowerCase().includes(query) ||
        (fb.response && fb.response.toLowerCase().includes(query))
      );
    }
    
    setFilteredFeedbacks(filtered);
    
    // Group feedbacks by contact
    const grouped: Record<string, ContactGroup> = {};
    
    filtered.forEach(fb => {
      const contact = fb.phone || fb.email || 'unknown';
      
      if (!grouped[contact]) {
        grouped[contact] = {
          contact,
          name: fb.name,
          feedbacks: [],
          pendingCount: 0
        };
      }
      
      grouped[contact].feedbacks.push(fb);
      if (fb.status === 'pending') {
        grouped[contact].pendingCount++;
      }
    });
    
    // Convert to array and sort by most recent feedback
    const groupedArray = Object.values(grouped).map(group => ({
      ...group,
      feedbacks: group.feedbacks.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
    
    setContactGroups(groupedArray);
    
    // Update stats
    const total = feedbacks.length;
    const pending = feedbacks.filter(fb => fb.status === 'pending').length;
    const responded = feedbacks.filter(fb => fb.status === 'responded').length;
    
    setStats({ total, pending, responded });
  }, [feedbacks, selectedSubject, selectedStatus, searchQuery]);

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get('/feedback');
      setFeedbacks(response.data);
      setError('');
    } catch (error: any) {
      setError('Error fetching feedbacks');
      console.error('Fetch feedbacks error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseSubmit = async (id: string) => {
    try {
      await api.patch(`/feedback/${id}/response`, { 
        response: responseText 
      });
      setResponseText('');
      setEditingId('');
      fetchFeedbacks(); // Refresh the list
      setError('');
    } catch (error: any) {
      setError('Error submitting response');
      console.error('Submit response error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await api.delete(`/feedback/${id}`);
      fetchFeedbacks(); // Refresh the list
      setError('');
    } catch (error: any) {
      setError('Error deleting feedback');
      console.error('Delete feedback error:', error);
    }
  };

  const getContactGroup = (contact: string) => {
    return contactGroups.find(group => group.contact === contact);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6 md:mb-8">Feedback Management</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending Responses</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3 md:mr-4">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Responded</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.responded}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-purple-700">Search & Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Feedback
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, subject, or message..."
                className="block w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
          
          {/* Filters - Hidden on mobile by default */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Subject
                </label>
                <select
                  id="subjectFilter"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 text-sm md:text-base"
                >
                  <option value="">All Subjects</option>
                  <option value="technical-support">Technical Support</option>
                  <option value="account-issues">Account Issues</option>
                  <option value="payment-issues">Payment Issues</option>
                  <option value="game-suggestions">Game Suggestions</option>
                  <option value="partnership">Partnership Opportunities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="statusFilter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 text-sm md:text-base"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feedback Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          {/* Mobile View - Cards */}
          <div className="md:hidden">
            {contactGroups.length === 0 ? (
              <div className="text-center py-8 px-4">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contactGroups.map((group) => (
                  <div key={group.contact} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{group.contact}</p>
                      </div>
                      <button
                        onClick={() => setViewingContact(group.contact)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 relative"
                        title="View all feedback"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {group.pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                            {group.pendingCount}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {group.feedbacks.length} feedback{group.feedbacks.length !== 1 ? 's' : ''}
                      </div>
                      {group.pendingCount > 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {group.pendingCount} pending
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">All responded</span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Last activity: {new Date(group.feedbacks[0].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback Count
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contactGroups.map((group) => (
                  <tr key={group.contact} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{group.contact}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{group.feedbacks.length}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {group.pendingCount > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {group.pendingCount} pending
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">All responded</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(group.feedbacks[0].createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setViewingContact(group.contact)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 relative"
                          title="View all feedback"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {group.pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                              {group.pendingCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {contactGroups.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Contact Feedback Modal */}
        {viewingContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-purple-700">
                  Feedback from {getContactGroup(viewingContact)?.name}
                </h3>
                <button
                  onClick={() => {
                    setViewingContact(null);
                    setEditingId('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                {getContactGroup(viewingContact)?.feedbacks.map((feedback) => (
                  <div key={feedback._id} className="border border-gray-200 rounded-lg p-3 md:p-4 relative">
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(feedback._id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      title="Delete feedback"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Feedback content */}
                    <div className="w-full md:w-3/4 bg-gray-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs md:text-sm font-medium text-purple-700 capitalize">
                          {feedback.subject.replace('-', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
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
                    
                    {/* Response content */}
                    {feedback.response ? (
                      <div className="w-full md:w-3/4 ml-auto p-3 md:p-4 bg-blue-50 rounded-lg border border-gray-200">
                        {editingId === feedback._id ? (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs md:text-sm font-medium text-green-700">Response</span>
                              <span className="text-xs text-gray-500">
                                {feedback.respondedAt && new Date(feedback.respondedAt).toLocaleString()}
                              </span>
                            </div>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2 text-sm"
                              placeholder="Type your response here..."
                            ></textarea>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResponseSubmit(feedback._id)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs md:text-sm rounded hover:bg-purple-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs md:text-sm rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs md:text-sm font-medium text-green-700">Response</span>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">
                                  {feedback.respondedAt && new Date(feedback.respondedAt).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingId(feedback._id);
                                    setResponseText(feedback.response || '');
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                                  title="Edit response"
                                >
                                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{feedback.response}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full md:w-3/4 ml-auto p-3 md:p-4 rounded-lg border border-gray-200">
                        {editingId === feedback._id ? (
                          <div>
                            <span className="text-xs md:text-sm font-medium text-green-700 mb-2 block">Add Response</span>
                            <textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2 text-sm"
                              placeholder="Type your response here..."
                            ></textarea>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResponseSubmit(feedback._id)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs md:text-sm rounded hover:bg-purple-700"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setResponseText('');
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs md:text-sm rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <button
                              onClick={() => setEditingId(feedback._id)}
                              className="px-3 py-1 md:px-4 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs md:text-sm"
                            >
                              Add Response
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg text-sm">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackPage;