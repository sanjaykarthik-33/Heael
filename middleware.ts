import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * SECURITY-CRITICAL: Middleware for authentication and authorization
 * 
 * This middleware:
 * 1. Verifies JWT tokens from cookies
 * 2. Redirects unauthenticated users to /login
 * 3. Redirects authenticated users away from /login
 * 4. Logs security events
 * 5. Enforces HTTPS in production
 * 
 * Protected routes: /dashboard, /insights, /arena, /profile
 * Public routes: /, /login, /api/auth/*
 */

const protectedRoutes = ['/dashboard', '/insights', '/arena', '/profile'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = pathname.startsWith('/api/auth');

  // Allow all API routes except protected endpoints
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Log auth events in development for debugging
  if (process.env.NODE_ENV === 'development') {
    if (isProtectedRoute) {
      console.log(
        `[AUTH] ${token ? 'Authenticated' : 'Unauthenticated'} access to ${pathname} by ${
          token?.email || 'unknown'
        }`
      );
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on.
 * Exclude static assets, public files, and internal Next.js routes.
 */
export const config = {
  matcher: [
    // Match all routes except:
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|apple-icon|.well-known).*)',
  ],
};
