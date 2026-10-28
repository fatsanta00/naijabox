import { auth, signOut } from '@/server/auth';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;
  const isOwner = userRole === 'owner';

  // If not authenticated, render bare children (e.g. for /admin/login)
  // Protected admin pages are strictly guarded by middleware.ts which redirects to /admin/login
  if (!session?.user) {
    return <div className="min-h-screen bg-naija-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-naija-ink text-gray-100 flex flex-col">
      <header className="border-b border-naija-border bg-naija-surface/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/admin" className="font-bold text-lg text-white">
              Naija<span className="text-brand-500">Box</span>{' '}
              <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono">ADMIN</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
              <Link href="/admin/questions" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                Questions
              </Link>
              <Link href="/admin/content-health" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                Content Health
              </Link>
              <Link href="/admin/moderation" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                Moderation
              </Link>
              <Link href="/admin/sponsors" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                Sponsors
              </Link>
              {/* Owner-only nav items */}
              {isOwner && (
                <>
                  <Link href="/admin/settings" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                    Settings
                  </Link>
                  <Link href="/admin/analytics" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                    Analytics
                  </Link>
                  <Link href="/admin/users" className="text-gray-300 hover:text-white px-2 py-1 rounded">
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-naija-muted hidden sm:inline">{session.user.email}</span>
            {userRole && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border hidden sm:inline ${
                isOwner
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                {userRole}
              </span>
            )}
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/admin/login' });
              }}
            >
              <button
                type="submit"
                className="min-h-[44px] px-3 text-xs font-medium rounded-lg bg-naija-card text-gray-300 hover:text-white border border-naija-border inline-flex items-center justify-center"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
