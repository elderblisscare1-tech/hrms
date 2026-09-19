import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Get the auth token from cookies (we need to set this up later)
  // For now, this is a basic shell to prevent unauthorized access
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/admin-login' || path === '/secure-api-v1-super-admin-auth-gateway-x908b2a' || path === '/signup' || path === '/forgot-password';
  
  // Later we'll decode the JWT cookie to check role
  // const token = request.cookies.get('auth-token')?.value || '';
  
  // Basic mock check until Firebase Admin is connected
  // If we're on a private route and no token (mock logic)
  /*
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  */

  // Role-based routing mock
  /*
  if (token) {
    const role = decode(token).role; 
    if (path.startsWith('/admin') && role === 'employee') {
      return NextResponse.redirect(new URL('/employee/me', request.url));
    }
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
};
