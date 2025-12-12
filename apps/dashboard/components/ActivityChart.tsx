'use client';

import { useEffect, useState } from 'react';

interface ChartDataPoint {
  date: string;
  events: number;
  customers: number;
}

export default function ActivityChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchChartData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchChartData() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/v1/customer/activity/chart?days=7`;
      console.log('Fetching chart data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent caching
      });
      
      console.log('Chart response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        const chartData = result.data || [];
        console.log('Chart data loaded:', chartData.length, 'data points', chartData);
        setData(chartData);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch chart data:', response.status, response.statusText, errorText);
        setData([]);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading && data.length === 0) {
    return (
      <div className="glossy-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Activity Overview</h3>
            <p className="text-sm text-gray-400">Events & customer activity this week</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const days = data.map(d => d.date);
  const eventsData = data.map(d => d.events);
  const customersData = data.map(d => d.customers);
  const maxValue = Math.max(
    ...eventsData,
    ...customersData,
    1 // Ensure at least 1 to avoid division by zero
  );

  return (
    <div className="glossy-card rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Activity Overview</h3>
          <p className="text-sm text-gray-400">Events & customer activity this week</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full shadow-lg shadow-teal-400/50"></div>
            <span className="text-sm text-gray-300">Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-300 rounded-full shadow-lg shadow-teal-300/50"></div>
            <span className="text-sm text-gray-300">Customers</span>
          </div>
        </div>
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-xl"></div>

      {/* Chart Area */}
      <div className="relative h-64 mt-6 z-10">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 pr-2">
          {[4, 3, 2, 1, 0].map((multiplier) => {
            const value = Math.ceil((maxValue * multiplier) / 4);
            return <span key={multiplier} className="font-medium">{value}</span>;
          })}
        </div>
        <div className="ml-8 h-full">
          {data.length > 0 ? (
            <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Events area (teal) */}
              <path
                d={`M 0 ${200 - (eventsData[0] / maxValue) * 200} ${days
                  .map(
                    (_, i) =>
                      `L ${(i * 600) / (days.length - 1)} ${200 - (eventsData[i] / maxValue) * 200}`
                  )
                  .join(' ')} L 600 200 L 0 200 Z`}
                fill="url(#eventsGradient)"
                opacity="0.4"
              />
              <path
                d={`M 0 ${200 - (eventsData[0] / maxValue) * 200} ${days
                  .map(
                    (_, i) =>
                      `L ${(i * 600) / (days.length - 1)} ${200 - (eventsData[i] / maxValue) * 200}`
                  )
                  .join(' ')}`}
                stroke="#5eead4"
                strokeWidth="3"
                fill="none"
                filter="url(#glow)"
              />

              {/* Customers area (lighter teal) */}
              <path
                d={`M 0 ${200 - (customersData[0] / maxValue) * 200} ${days
                  .map(
                    (_, i) =>
                      `L ${(i * 600) / (days.length - 1)} ${200 - (customersData[i] / maxValue) * 200}`
                  )
                  .join(' ')} L 600 200 L 0 200 Z`}
                fill="url(#customersGradient)"
                opacity="0.4"
              />
              <path
                d={`M 0 ${200 - (customersData[0] / maxValue) * 200} ${days
                  .map(
                    (_, i) =>
                      `L ${(i * 600) / (days.length - 1)} ${200 - (customersData[i] / maxValue) * 200}`
                  )
                  .join(' ')}`}
                stroke="#99f6e4"
                strokeWidth="3"
                fill="none"
                filter="url(#glow2)"
              />

              {/* Gradients and Filters */}
              <defs>
                <linearGradient id="eventsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#5eead4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="customersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#99f6e4" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#99f6e4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#99f6e4" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
        {/* X-axis labels */}
        <div className="ml-8 mt-2 flex justify-between z-10 relative">
          {days.map((day) => (
            <span key={day} className="text-xs text-gray-400 font-medium">
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
