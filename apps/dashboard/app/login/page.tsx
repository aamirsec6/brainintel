'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseEnabled } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get('signup') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    if (isSupabaseEnabled && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/');
        }
      });
    } else {
      const token = localStorage.getItem('rb_auth_token');
      if (token) {
        router.push('/');
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSupabaseEnabled && supabase) {
        // Use Supabase Auth
        if (isSignup) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          });

          if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
          }

          if (data.user) {
            // Store session
            localStorage.setItem('rb_auth_token', data.session?.access_token || '');
            localStorage.setItem('rb_user_email', email);
            if (name) {
              localStorage.setItem('rb_user_name', name);
            }
            router.push('/');
          }
        } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
          }

          if (data.user && data.session) {
            localStorage.setItem('rb_auth_token', data.session.access_token);
            localStorage.setItem('rb_user_email', email);
            router.push('/');
          }
        }
      } else {
        // Fallback to demo mode (no Supabase configured)
        const token = 'demo_token_' + Date.now();
        localStorage.setItem('rb_auth_token', token);
        localStorage.setItem('rb_user_email', email);
        if (name) {
          localStorage.setItem('rb_user_name', name);
        }
        router.push('/');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-10 rounded-xl shadow-2xl border border-gray-700">
        <div>
          <Link href="/marketing" className="flex justify-center">
            <div className="text-4xl font-bold text-white">
              🧠 Retail Brain
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link href="/login?signup=true" className="font-medium text-blue-400 hover:text-blue-300">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            {isSignup && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isSignup}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 ${
                  isSignup ? '' : 'rounded-t-md'
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {!isSignup && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {isSupabaseEnabled 
                ? 'Using Supabase authentication' 
                : 'Demo mode: Any email/password will work'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

