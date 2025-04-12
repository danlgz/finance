import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Check if the request is for a protected route (starts with /dashboard)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/budgets') ||
                          request.nextUrl.pathname.startsWith('/households');

  // Check if the request is for an auth route (login/register)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register');

  // If the user is on a protected route but not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is on an auth route but already authenticated, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Match only the routes we want to protect or redirect
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/budgets/:path*',
    '/households/:path*',
    '/login',
    '/register',
  ],
}; 