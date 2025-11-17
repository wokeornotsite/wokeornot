import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

/**
 * Require admin role for server components/pages
 * Redirects to login or home if unauthorized
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login?error=You+must+be+logged+in');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/?error=You+do+not+have+permission+to+access+this+page');
  }
  
  return session;
}

/**
 * Require admin role for API routes
 * Returns error response if unauthorized
 */
export async function requireAdminAPI(): Promise<{ session: any } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    };
  }
  
  if (session.user.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    };
  }
  
  return { session };
}
