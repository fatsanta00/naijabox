import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import UsersPageClient from './UsersPageClient';

export const metadata = { title: 'Moderators — NaijaBox Admin' };

export default async function UsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  // Only owners can access this page — middleware enforces auth, page enforces role
  if (role !== 'owner') {
    redirect('/admin');
  }

  return <UsersPageClient />;
}
