import { Metadata } from 'next';
import { AccountPageClient } from './AccountPageClient';

export const metadata: Metadata = {
  title: 'My Account & Saved Scores | NaijaBox',
  description: 'Manage your optional player account, view saved game scores, streaks, and favourite NaijaBox experiences.',
};

export default function AccountPage() {
  return (
    <div className="py-8 px-4">
      <AccountPageClient />
    </div>
  );
}
