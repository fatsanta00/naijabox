'use client';

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');
  const callbackUrl = rawCallback && !rawCallback.includes('/admin/login') ? rawCallback : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          window.location.href = callbackUrl;
        }
      })
      .catch(() => {});
  }, [callbackUrl]);

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
        setLoading(false);
      } else {
        // Hard navigation so the new session cookie is fully picked up
        window.location.href = callbackUrl;
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    // Always dark — admin panel has no light mode
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050e08' }}>
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-xl"
        style={{ background: '#0f2617', borderColor: '#1c4028' }}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Naija<span style={{ color: '#008751' }}>Box</span> Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: '#84a994' }}>
            Enter owner credentials to manage content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 text-xs rounded-lg font-medium"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: '#84a994' }}>
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@naijabox.app"
              style={{
                background: '#0a1c11',
                border: '1px solid #1c4028',
                color: '#f0fbf4',
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px #008751')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
          </div>

          <div>
            <label htmlFor="pass" className="block text-xs font-medium mb-1.5" style={{ color: '#84a994' }}>
              Password
            </label>
            <input
              id="pass"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: '#0a1c11',
                border: '1px solid #1c4028',
                color: '#f0fbf4',
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: '12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px #008751')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background: loading ? '#005c37' : '#008751',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
