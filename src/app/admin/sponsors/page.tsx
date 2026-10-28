import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import SponsorsPageClient from './SponsorsPageClient';

export const metadata = { title: 'Sponsors & Campaigns — NaijaBox Admin' };

export default async function SponsorsAdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/admin/login');
  }

  return <SponsorsPageClient />;
}
