'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Analytics {
  totalProfiles: number;
  totalEvents: number;
  totalRevenue: number;
  avgRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueByDay: Array<{ date: string; orders: number; revenue: number }>;
  topCities: Array<{ city: string; count: number; revenue: number }>;
  eventsByType: Array<{ event_type: string; count: number }>;
  segments: Array<{ segment: string; count: number }>;
  trends: {
    revenueChangePercent: number;
    ordersChangePercent: number;
    recentRevenue: number;
    previousRevenue: number;
    recentOrders: number;
    previousOrders: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('http://localhost:3000/v1/analytics');
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  // Format revenue by day for chart (reverse to show oldest to newest)
  const revenueChartData = [...analytics.revenueByDay].reverse().map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: day.revenue,
    orders: day.orders,
  }));

  // Calculate trend colors
  const revenueTrendColor = analytics.trends.revenueChangePercent >= 0 
    ? '#00ff88' // Neon green
    : '#ff0066'; // Neon red
  
  const ordersTrendColor = analytics.trends.ordersChangePercent >= 0 
    ? '#00ff88' // Neon green
    : '#ff0066'; // Neon red

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">📊 Analytics</h1>
          <p className="text-sm text-gray-600">Customer insights and business metrics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Customers"
            value={analytics.totalProfiles.toLocaleString()}
            change={`${analytics.trends.revenueChangePercent >= 0 ? '+' : ''}${analytics.trends.revenueChangePercent.toFixed(1)}%`}
            positive={analytics.trends.revenueChangePercent >= 0}
            icon="👥"
          />
          <MetricCard
            title="Total Orders"
            value={analytics.totalOrders.toLocaleString()}
            change={`${analytics.trends.ordersChangePercent >= 0 ? '+' : ''}${analytics.trends.ordersChangePercent.toFixed(1)}%`}
            positive={analytics.trends.ordersChangePercent >= 0}
            icon="📦"
          />
          <MetricCard
            title="Total Revenue"
            value={`₹${(analytics.totalRevenue / 100000).toFixed(1)}L`}
            change={`${analytics.trends.revenueChangePercent >= 0 ? '+' : ''}${analytics.trends.revenueChangePercent.toFixed(1)}%`}
            positive={analytics.trends.revenueChangePercent >= 0}
            icon="💰"
          />
          <MetricCard
            title="Avg Order Value"
            value={`₹${analytics.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change="+5%"
            positive={true}
            icon="🛍️"
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📈 Revenue Trend (Last 30 Days)</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: revenueTrendColor }}></div>
                <span className="text-sm text-gray-600">
                  {analytics.trends.revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.trends.revenueChangePercent).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={revenueTrendColor}
                strokeWidth={3}
                dot={{ fill: revenueTrendColor, r: 4 }}
                name="Revenue (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📦 Orders Trend (Last 30 Days)</h2>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ordersTrendColor }}></div>
              <span className="text-sm text-gray-600">
                {analytics.trends.ordersChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.trends.ordersChangePercent).toFixed(1)}%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value: number) => `${value} orders`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar 
                dataKey="orders" 
                fill={ordersTrendColor}
                name="Orders"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">🗺️ Top Cities</h2>
            <div className="space-y-3">
              {analytics.topCities.slice(0, 10).map((city, index) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{city.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full w-32">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${(city.count / analytics.totalProfiles) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{city.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Type */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">📈 Events by Type</h2>
            <div className="space-y-3">
              {analytics.eventsByType.map((event) => (
                <div key={event.event_type} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${(event.count / analytics.totalEvents) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                      {event.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">💎 Customer Segments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics.segments.map((segment) => (
              <SegmentCard
                key={segment.segment}
                title={segment.segment}
                count={segment.count}
                description={
                  segment.segment === 'High Value' ? 'LTV > ₹100,000' :
                  segment.segment === 'Medium Value' ? 'LTV ₹20,000 - ₹100,000' :
                  'New Customers'
                }
                color={
                  segment.segment === 'High Value' ? 'green' :
                  segment.segment === 'Medium Value' ? 'blue' :
                  'purple'
                }
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  positive,
  icon,
}: {
  title: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: string;
}) {
  const changeColor = positive ? '#00ff88' : '#ff0066'; // Neon green or red
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-600">{title}</p>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-sm font-medium" style={{ color: changeColor }}>
        {change} from last period
      </p>
    </div>
  );
}

function SegmentCard({
  title,
  count,
  description,
  color,
}: {
  title: string;
  count: number;
  description: string;
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-2">{count.toLocaleString()}</p>
      <p className="text-sm opacity-75">{description}</p>
    </div>
  );
}
