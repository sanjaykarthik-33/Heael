'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="w-5 h-5" />
      <span className="font-medium">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
    </button>
  );
}
