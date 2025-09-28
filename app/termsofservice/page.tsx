'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
            <div className="prose prose-purple max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing or using Feta Bingo ("the Platform"), you agree to be bound by these Terms of Service 
                  and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                  prohibited from using or accessing this site.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">2. User Accounts</h2>
                <p className="text-gray-700 mb-4">
                  To use our services, you must create an account providing accurate and complete information. 
                  You are responsible for maintaining the confidentiality of your account credentials and for 
                  all activities that occur under your account.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>You must be at least 18 years old to create an account</li>
                  <li>One account per individual is permitted</li>
                  <li>You may not use another person's account without authorization</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">3. Game Rules and Fair Play</h2>
                <p className="text-gray-700 mb-4">
                  All games on Feta Bingo are governed by specific rules that ensure fair play for all participants. 
                  By using our platform, you agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Abide by all game rules and regulations</li>
                  <li>Not use any automated systems or software to gain unfair advantage</li>
                  <li>Not engage in collusion or any form of cheating</li>
                  <li>Accept game outcomes as determined by our random number generation system</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">4. Financial Transactions</h2>
                <p className="text-gray-700 mb-4">
                  All financial transactions on the Platform are subject to the following terms:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Deposits are final and non-refundable, except as required by law</li>
                  <li>Withdrawals are subject to verification and processing times</li>
                  <li>We reserve the right to request identification for transaction verification</li>
                  <li>All transactions are processed in USD (or equivalent local currency)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">5. Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content on the Platform, including but not limited to text, graphics, logos, and software, 
                  is the property of Feta Bingo or its licensors and is protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">6. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  Feta Bingo shall not be liable for any indirect, incidental, special, consequential, or punitive 
                  damages resulting from your use of or inability to use the Platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">7. Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these terms at any time. Continued use of the Platform after 
                  changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">8. Governing Law</h2>
                <p className="text-gray-700">
                  These terms are governed by and construed in accordance with the laws of the jurisdiction 
                  where Feta Bingo is registered, without regard to its conflict of law provisions.
                </p>
              </section>

              <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                <p className="text-purple-700 text-sm">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@fetabingo.com" className="text-purple-600 hover:underline">
                    legal@fetabingo.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}