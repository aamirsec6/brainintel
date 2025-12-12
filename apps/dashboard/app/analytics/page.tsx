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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
      const endpoint = `${baseUrl}/v1/analytics` || '/v1/analytics';
      const response = await fetch(baseUrl ? endpoint : '/v1/analytics');
      
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
      <div className="p-6 bg-gray-900 min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 bg-gray-900 min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400">Failed to load analytics</div>
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
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Analytics</h1>
        <p className="text-sm text-gray-400">Customer insights and business metrics</p>
      </div>

      <div>
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
            value={`₹${(Math.round(analytics.totalRevenue / 100) * 100).toLocaleString()}`}
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
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Revenue Trend (Last 30 Days)</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: revenueTrendColor }}></div>
                <span className="text-sm text-gray-300">
                  {analytics.trends.revenueChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.trends.revenueChangePercent).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
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
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Orders Trend (Last 30 Days)</h2>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ordersTrendColor }}></div>
              <span className="text-sm text-gray-300">
                {analytics.trends.ordersChangePercent >= 0 ? '↑' : '↓'} {Math.abs(analytics.trends.ordersChangePercent).toFixed(1)}%
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                formatter={(value: number) => `${value} orders`}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
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
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Top Cities</h2>
            <div className="space-y-3">
              {analytics.topCities.slice(0, 10).map((city, index) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-white">{city.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full w-32">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${(city.count / analytics.totalProfiles) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{city.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Type */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Events by Type</h2>
            <div className="space-y-3">
              {analytics.eventsByType.map((event) => (
                <div key={event.event_type} className="flex items-center justify-between">
                  <span className="font-medium text-white capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-700 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${(event.count / analytics.totalEvents) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-300 w-12 text-right">
                      {event.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Customer Segments</h2>
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
      </div>
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
  const changeColor = positive ? '#10b981' : '#ef4444';
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
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
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`p-6 rounded-lg border-2 bg-gray-750 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="font-semibold text-lg mb-1 text-white">{title}</h3>
      <p className="text-3xl font-bold mb-2 text-white">{count.toLocaleString()}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
