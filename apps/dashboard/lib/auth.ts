/**
 * Authentication utilities
 * Handles Supabase session management and auth state
 */
'use client';

import { supabase, isSupabaseEnabled } from './supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    if (isSupabaseEnabled && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  async function checkAuth() {
    setLoading(true);
    
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
          });
        } else {
          // Check localStorage fallback
          const token = localStorage.getItem('rb_auth_token');
          if (token) {
            // Try to get user from localStorage
            const email = localStorage.getItem('rb_user_email');
            const name = localStorage.getItem('rb_user_name');
            if (email) {
              setUser({
                id: 'demo_user',
                email,
                name: name || undefined,
              });
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      }
    } else {
      // Demo mode - check localStorage
      const token = localStorage.getItem('rb_auth_token');
      if (token) {
        const email = localStorage.getItem('rb_user_email');
        const name = localStorage.getItem('rb_user_name');
        if (email) {
          setUser({
            id: 'demo_user',
            email,
            name: name || undefined,
          });
        }
      }
    }
    
    setLoading(false);
  }

  async function signOut() {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut();
    }
    
    // Clear localStorage
    localStorage.removeItem('rb_auth_token');
    localStorage.removeItem('rb_user_email');
    localStorage.removeItem('rb_user_name');
    
    setUser(null);
    router.push('/login');
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
    checkAuth,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  return { user, loading, isAuthenticated };
}

