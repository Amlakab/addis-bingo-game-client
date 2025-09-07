
  // components/FeedbackForm.tsx
'use client';

import React, { useState } from 'react';

const FeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
 const BASE_URL= process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001/api';  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate that at least one contact method is provided
    if (!formData.phone && !formData.email) {
      setSubmitMessage('Error: Please provide either a phone number or email address');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage('Thank you for your feedback! We will get back to you soon.');
        setFormData({
          phone: '',
          email: '',
          name: '',
          subject: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setSubmitMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      setSubmitMessage('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-semibold text-purple-700 mb-6">
        Send us a Message
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Email or Phone *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.email || formData.phone}
            onChange={(e) => {
              const value = e.target.value;
              // Check if it looks like an email or phone number
              if (value.includes('@')) {
                setFormData({...formData, email: value, phone: ''});
              } else {
                setFormData({...formData, phone: value, email: ''});
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            placeholder="your.email@example.com or 0912345678"
          />
          <p className="text-xs text-gray-500 mt-1">Enter either your email address or phone number</p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
          >
            <option value="">Select a subject</option>
            <option value="technical-support">Technical Support</option>
            <option value="account-issues">Account Issues</option>
            <option value="payment-issues">Payment Issues</option>
            <option value="game-suggestions">Game Suggestions</option>
            <option value="partnership">Partnership Opportunities</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            placeholder="Please describe your inquiry in detail..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending Message...' : 'Send Message'}
        </button>
        
        {submitMessage && (
          <div className={`p-3 rounded-md ${submitMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {submitMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;