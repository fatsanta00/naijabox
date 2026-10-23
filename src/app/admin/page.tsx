import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Overview</h1>
        <p className="text-sm text-naija-muted mt-1">
          Manage questions, review community submissions, configure experiences, and monitor stats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/questions">
          <Card interactive>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Questions</CardTitle>
              <CardDescription>Manage, edit, reorder & publish questions</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-brand-400 font-medium">Manage Question Pool &rarr;</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/moderation">
          <Card interactive>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Moderation</CardTitle>
              <CardDescription>Approve pending UGC and handle reports</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-amber-400 font-medium">Review Queue &rarr;</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card interactive>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Settings</CardTitle>
              <CardDescription>Categories, experience modes, ad toggles</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-teal-400 font-medium">Configure System &rarr;</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics">
          <Card interactive>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>Which box gets opened the most?</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-purple-400 font-medium">View Reports &rarr;</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
