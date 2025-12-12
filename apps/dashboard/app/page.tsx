'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '../lib/auth';
import ActivityChart from '../components/ActivityChart';
import RecentActivity from '../components/RecentActivity';

interface Stats {
  totalProfiles: number;
  totalEvents: number;
  totalMerges: number;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    fetchStats();
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [authLoading]);

  async function fetchStats() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/v1/customer/stats`;
      console.log('Fetching stats from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent caching
      });
      
      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data received:', data);
        setStats({
          totalProfiles: data.totalProfiles || data.total_profiles || 0,
          totalEvents: data.totalEvents || data.total_events || 0,
          totalMerges: data.totalMerges || data.total_merges || 0,
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch stats:', response.status, response.statusText, errorText);
        // Don't reset to 0 on error, keep previous values
        if (!stats) {
          setStats({
            totalProfiles: 0,
            totalEvents: 0,
            totalMerges: 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Don't reset to 0 on error, keep previous values
      if (!stats) {
        setStats({
          totalProfiles: 0,
          totalEvents: 0,
          totalMerges: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
        Here's what's happening with your customer data today.
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Customer Profiles"
          value={stats?.totalProfiles || 0}
          change={0}
          subtitle="Unified identities"
          icon="👥"
          loading={loading}
        />
        <StatCard
          title="Events Processed"
          value={stats?.totalEvents || 0}
          change={0}
          subtitle="All channels"
          icon="📊"
          loading={loading}
        />
        <StatCard
          title="Merges Completed"
          value={stats?.totalMerges || 0}
          change={0}
          subtitle="Duplicates resolved"
          icon="🔗"
          loading={loading}
        />
      </div>

      {/* Activity Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ActivityChart />
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <div className="glossy-card rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="View Customers"
            href="/customers"
            description="Browse all customer profiles"
            icon="👥"
          />
          <ActionCard
            title="Search"
            href="/search"
            description="Find customers by phone/email"
            icon="🔍"
          />
          <ActionCard
            title="Merge Logs"
            href="/merges"
            description="View identity resolution history"
            icon="🔗"
          />
          <ActionCard
            title="AI Assistant"
            href="/ai"
            description="Ask questions about your data"
            icon="🤖"
          />
          <ActionCard
            title="Analytics"
            href="/analytics"
            description="Insights and trends"
            icon="📈"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: number;
  change: number;
  subtitle: string;
  icon: string;
  loading: boolean;
}) {
  const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString();
  
  return (
    <div className="glossy-card glossy-card-hover glossy-shine rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm text-gray-300 mb-1 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {loading ? '...' : formattedValue}
          </p>
          <div className="flex items-center gap-2">
            {change > 0 && (
              <span className="text-sm text-green-400 font-medium bg-green-500/20 px-2 py-0.5 rounded-full">+{change}%</span>
            )}
            <span className="text-xs text-gray-400">{subtitle}</span>
          </div>
        </div>
        <div className="text-4xl opacity-90 filter drop-shadow-lg">{icon}</div>
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-xl"></div>
    </div>
  );
}

function ActionCard({
  title,
  href,
  icon,
  description,
}: {
  title: string;
  href: string;
  icon?: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block p-5 glossy-card glossy-card-hover glossy-shine rounded-xl relative overflow-hidden group"
    >
      {icon && (
        <div className="text-3xl mb-3 filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">{title}</h3>
      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 pointer-events-none rounded-xl transition-all duration-300"></div>
    </Link>
  );
}
