'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            Bingo Platform
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span>Welcome, {user.phone}</span>
                {user.role === 'admin' && (
                  <Link href="/admin" className="hover:underline">
                    Admin Dashboard
                  </Link>
                )}
                {user.role === 'agent' && (
                  <Link href="/agent" className="hover:underline">
                    Agent Dashboard
                  </Link>
                )}
                <Link href="/user/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <Link href="/game/lobby" className="hover:underline">
                  Games
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
                <Link href="/auth/login" className="hover:underline">
                  Login
                </Link>
                <Link href="/auth/register" className="hover:underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;