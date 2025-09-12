'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg fixed w-full z-10 m-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          
          {/* Logo + Name */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/amlakie.jpg"
              alt="Feta Bingo Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-2xl font-bold">Feta Bingo</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="px-3">Welcome, {user.phone}</span>
                {user.role === 'admin' && (
                  <Link href="/admin" className="hover:underline px-3">
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'agent' && (
                  <Link href="/agent" className="hover:underline px-3">
                    Agent Dashboard
                  </Link>
                )}
                <Link href="/user/dashboard" className="hover:underline px-3">
                  Dashboard
                </Link>
                <Link href="/howtoplay" className="hover:underline px-3">
                  How to Play
                </Link>
                <Link href="/about" className="hover:underline px-3">
                  About Us
                </Link>
                <Link href="/contact-us" className="hover:underline px-3">
                  Contact Us
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/howtoplay" className="hover:underline px-3">
                  How to Play
                </Link>
                <Link href="/about" className="hover:underline px-3">
                  About Us
                </Link>
                <Link href="/contact-us" className="hover:underline px-3">
                  Contact Us
                </Link>
                <Link href="/auth/login" className="hover:underline px-3">
                  Login
                </Link>
                <Link href="/auth/register" className="hover:underline px-3">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b border-blue-500">
                    Welcome, {user.phone}
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === 'agent' && (
                    <Link href="/agent" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                      Agent Dashboard
                    </Link>
                  )}
                  <Link href="/user/dashboard" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/howtoplay" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    How to Play
                  </Link>
                  <Link href="/about" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    About Us
                  </Link>
                  <Link href="/contact-us" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    Contact Us
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/howtoplay" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    How to Play
                  </Link>
                  <Link href="/about" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    About Us
                  </Link>
                  <Link href="/contact-us" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    Contact Us
                  </Link>
                  <Link href="/auth/login" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/auth/register" className="hover:underline px-3 py-2" onClick={() => setIsMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
