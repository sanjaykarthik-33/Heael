'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useEffect } from 'react';

/**
 * SECURITY: Login page with OAuth + JWT flow
 * 
 * Security features:
 * - No password field (OAuth-only)
 * - OAuth state validation (CSRF protection via next-auth)
 * - Secure redirect to callback URL
 * - Error display without exposing internal details
 * - Rate limiting ready (implement on backend)
 */

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const showError = searchParams.get('error') === 'true';

  useEffect(() => {
    if (showError) {
      setError('Authentication failed. Please try again.');
    }
  }, [showError]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      /**
       * SECURITY: signIn() from next-auth/react
       * - Validates OAuth state token (CSRF protection)
       * - Exchanges auth code for tokens securely server-side
       * - Sets HTTP-only session cookie
       * - Redirects to callbackUrl or default route
       */
      const result = await signIn('google', {
        callbackUrl,
        redirect: true,
      });

      // If error occurs and redirect is prevented
      if (result?.error) {
        setError('Failed to sign in. Please check your credentials and try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header Card */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
              ⚡
            </div>
            <span className="text-3xl font-bold neon-glow-purple">Heael</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-foreground/60 text-lg">Sign in to your wellness dashboard</p>
        </div>

        {/* Login Card */}
        <GlassCard className="p-8 animate-slide-in">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/20 border border-destructive/50 rounded-lg flex gap-3 items-start animate-pulse">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition duration-500 group-hover"></div>
            <div className="relative bg-gradient-to-r from-primary to-secondary hover:shadow-2xl hover:shadow-primary/50 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.0003 4.75C13.7703 4.75 15.3891 5.36002 16.6017 6.32329L20.0077 2.95165C17.9tent 1.14818 15.527 0 12.0003 0C7.31801 0 3.26247 2.69649 1.1934 6.50374L5.29299 9.40624C6.50624 7.06566 9.00527 4.75 12.0003 4.75Z" />
                    <path d="M23.4915 13.2652C23.7381 12.4574 23.9004 11.5854 23.9004 10.5C23.9004 10.2464 23.8736 9.99514 23.8428 9.74927H12V14.8287H18.8996C18.7201 15.7839 18.2257 16.5865 17.5408 17.1598L21.5528 20.4504C23.4379 18.676 24.5995 16.0151 23.4915 13.2652Z" />
                    <path d="M5.50423 14.8287C5.99549 15.7839 6.99171 16.5865 8.08882 17.1598L12.1008 20.4504C14.0859 18.676 15.2475 16.0151 14.1395 13.2652C13.8929 12.4574 13.7306 11.5854 13.7306 10.5C13.7306 10.2464 13.7038 9.99514 13.673 9.74927H2V14.8287C2 16.5391 2.73651 18.0751 3.87379 19.1093L7.97337 15.8186C6.6915 14.9353 5.77947 13.9584 5.50423 14.8287Z" />
                    <path d="M5.50423 14.8287L1.4046 18.1094C2.54188 19.1436 3.27839 20.6796 3.27839 22.3899V24H8.08882C6.99171 23.4266 5.99549 22.624 5.50423 21.6688V14.8287Z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </div>
          </button>

          {/* Terms & Privacy */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg text-xs text-foreground/50 text-center">
            <p>By signing in, you agree to our</p>
            <p className="mt-1">
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </GlassCard>

        {/* Info Card */}
        <GlassCard className="mt-6 p-6 border-l-4 border-secondary animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
            <span className="text-xl">🔒</span> Your Data Is Secure
          </h3>
          <ul className="space-y-2 text-sm text-foreground/60">
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>OAuth 2.0 authentication (no passwords stored)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>JWT-based sessions with encryption</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>HTTPS + security headers enabled</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>CSRF protection on all forms</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
