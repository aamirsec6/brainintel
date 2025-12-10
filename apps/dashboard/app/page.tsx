'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalProfiles: number;
  totalEvents: number;
  totalMerges: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Fetch real stats from database
      const response = await fetch('http://localhost:3003/profiles/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // No fallback - show empty state
        setStats({
          totalProfiles: 0,
          totalEvents: 0,
          totalMerges: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // No fallback - show empty state
      setStats({
        totalProfiles: 0,
        totalEvents: 0,
        totalMerges: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🧠 Retail Brain
          </h1>
          <p className="text-sm text-gray-600">Customer Intelligence Platform</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Customer Profiles"
            value={stats?.totalProfiles || 0}
            subtitle="Unified identities"
            icon="👤"
            loading={loading}
          />
          <StatCard
            title="Events Processed"
            value={stats?.totalEvents || 0}
            subtitle="All channels"
            icon="📊"
            loading={loading}
          />
          <StatCard
            title="Merges Completed"
            value={stats?.totalMerges || 0}
            subtitle="Duplicates resolved"
            icon="🔗"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard
              title="View Customers"
              href="/customers"
              icon="👥"
              description="Browse all customer profiles"
            />
            <ActionCard
              title="Search"
              href="/search"
              icon="🔍"
              description="Find customers by phone/email"
            />
            <ActionCard
              title="Merge Logs"
              href="/merges"
              icon="📝"
              description="View identity resolution history"
            />
            <ActionCard
              title="AI Assistant"
              href="/ai"
              icon="🤖"
              description="Ask questions about your data"
            />
            <ActionCard
              title="Analytics"
              href="/analytics"
              icon="📊"
              description="Insights and trends"
            />
            <ActionCard
              title="Import CSV"
              href="/import"
              icon="📥"
              description="Upload customer data"
            />
            <ActionCard
              title="A/B Testing"
              href="/ab-testing"
              icon="🧪"
              description="Run experiments and measure impact"
            />
            <ActionCard
              title="Nudge Automator"
              href="/nudges"
              icon="🤖"
              description="Autonomous customer engagement"
            />
            <ActionCard
              title="Intent Detection"
              href="/intent"
              icon="🎯"
              description="Detect customer intent from messages"
            />
            <ActionCard
              title="ML Models"
              href="/ml-models"
              icon="🧠"
              description="View model performance and metrics"
            />
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <ServiceStatus name="API Gateway" status="online" port="3000" />
            <ServiceStatus name="Event Collector" status="online" port="3001" />
            <ServiceStatus name="Identity Engine" status="online" port="3002" />
            <ServiceStatus name="Profile Service" status="online" port="3003" />
            <ServiceStatus name="Recommender" status="online" port="3004" />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
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
  icon: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

function ServiceStatus({
  name,
  status,
  port,
}: {
  name: string;
  status: string;
  port: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <span className="text-sm text-gray-600">:{port}</span>
    </div>
  );
}
