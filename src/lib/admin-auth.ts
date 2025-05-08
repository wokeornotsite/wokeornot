import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';

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
