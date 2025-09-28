'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
            <div className="prose prose-purple max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Feta Bingo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our gaming platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Full name and contact details</li>
                  <li>Date of birth and age verification</li>
                  <li>Payment information and transaction history</li>
                  <li>Government-issued identification for verification</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">Technical Information:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>IP address and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Usage data and game analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>To provide and maintain our gaming services</li>
                  <li>To process transactions and prevent fraud</li>
                  <li>To verify your identity and age</li>
                  <li>To communicate with you about updates and promotions</li>
                  <li>To improve our platform and user experience</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Service providers and business partners</li>
                  <li>Payment processors and financial institutions</li>
                  <li>Legal authorities when required by law</li>
                  <li>Other users in public gaming rooms (username only)</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">5. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>SSL encryption for all data transmissions</li>
                  <li>Secure server infrastructure</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Access controls and authentication measures</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">6. Your Rights</h2>
                <p className="text-gray-700 mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">7. Cookies and Tracking</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar technologies to enhance your experience, analyze usage, and 
                  deliver personalized content. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">8. Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We retain your personal information for as long as necessary to fulfill the purposes 
                  outlined in this policy, unless a longer retention period is required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our platform is not intended for individuals under 18 years of age. We do not knowingly 
                  collect personal information from children. If we become aware of such collection, 
                  we will take steps to delete the information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-purple-700 mb-4">11. Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy, please contact us at:{' '}
                  <a href="mailto:privacy@fetabingo.com" className="text-purple-600 hover:underline">
                    privacy@fetabingo.com
                  </a>
                </p>
              </section>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700 text-sm">
                  For data protection requests or concerns, you may also contact our Data Protection Officer at{' '}
                  <a href="mailto:dpo@fetabingo.com" className="text-blue-600 hover:underline">
                    dpo@fetabingo.com
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