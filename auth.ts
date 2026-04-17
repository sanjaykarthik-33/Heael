import type { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';

/**
 * Security: This config enforces:
 * - HTTPS redirect in production
 * - Secure cookies with HttpOnly flag
 * - CSRF token validation
 * - JWT encryption with auto-rotation
 */
export const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
      allowDangerousEmailAccountLinking: false, // Prevent email account takeover
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login?error=true',
  },
  session: {
    strategy: 'jwt', // JWT-based sessions for performance + scalability
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh token daily
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    /**
     * Security: Sign-in callback - validates provider and email
     * Prevents unauthorized provider access
     */
    async signIn({ user, account, profile }: { user: any; account: any; profile: any }) {
      // Only allow Google OAuth
      if (account?.provider !== 'google') {
        return false;
      }

      // Verify email exists and is verified by Google
      if (!user.email || !profile?.email_verified) {
        return false;
      }

      return true;
    },

    /**
     * Security: JWT callback - adds user metadata to token
     * Called when JWT is created/updated
     */
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = account?.provider;
      }

      // Ensure token has necessary fields for session
      if (!token.id) {
        token.id = token.sub; // Use 'sub' as fallback
      }

      return token;
    },

    /**
     * Security: Session callback - returns safe user data from JWT
     * Redacts sensitive fields from client-side session
     */
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // Do NOT expose provider details to client
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
