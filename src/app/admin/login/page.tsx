'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-naija-ink flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-naija-border/80">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">
            Naija<span className="text-brand-500">Box</span> Admin
          </CardTitle>
          <CardDescription>Enter owner credentials to manage content</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 text-xs rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium"
              >
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1.5">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@naijabox.app"
                className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-surface border border-naija-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="pass" className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 min-h-[44px] px-3 rounded-xl bg-naija-surface border border-naija-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign in to Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
