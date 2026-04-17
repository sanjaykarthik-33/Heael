import NextAuth from 'next-auth';
import { authConfig } from '@/auth';

/**
 * Dynamic segment file for NextAuth API route handler.
 * Handles all authentication: signIn, signOut, callback, providers, csrf, etc.
 */
const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
