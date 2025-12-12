'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('rb_auth_token');
    const isAuthPage = pathname === '/login' || pathname === '/marketing';
    
    if (token && !isAuthPage) {
      setIsAuthenticated(true);
    } else if (!token && !isAuthPage) {
      // Redirect to marketing page if not authenticated
      window.location.href = '/marketing';
      return;
    }
    
    setIsLoading(false);
  }, [pathname]);

  // Show marketing/login pages without sidebar
  if (pathname === '/marketing' || pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show dashboard with sidebar for authenticated users
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Default: show children (will redirect)
  return <>{children}</>;
}

