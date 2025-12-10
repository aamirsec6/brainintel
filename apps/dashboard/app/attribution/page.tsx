'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ChannelPerformance {
  channel: string;
  conversions: number;
  revenue: number;
  avg_weight: number;
}

export default function AttributionPage() {
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [selectedModel, setSelectedModel] = useState('linear');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannelPerformance();
  }, [selectedModel]);

  async function fetchChannelPerformance() {
    try {
      const response = await fetch(`http://localhost:3000/attribution/channels?model=${selectedModel}`);
      if (response.ok) {
        const data = await response.json();
        setChannelPerformance(data.performance || []);
      }
    } catch (error) {
      console.error('Failed to fetch attribution data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Attribution Analysis</h1>
          <p className="text-gray-600 mt-2">Multi-touch attribution models for conversion analysis</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attribution Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 bg-white"
          >
            <option value="first_touch">First Touch</option>
            <option value="last_touch">Last Touch</option>
            <option value="linear">Linear</option>
            <option value="time_decay">Time Decay</option>
            <option value="position_based">Position Based (U-Shaped)</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Channel Performance</h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : channelPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attribution data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attributed Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Weight</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {channelPerformance.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.channel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.conversions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.avg_weight * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

