'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Journey {
  journey_id: string;
  started_at: string;
  ended_at: string;
  touchpoints: number;
  converted: boolean;
  conversion_value: number | null;
}

interface JourneyAnalytics {
  total_journeys: number;
  converted_journeys: number;
  conversion_rate: string;
  avg_touchpoints: string;
  avg_time_to_conversion_minutes: string;
}

export default function JourneysPage() {
  const [analytics, setAnalytics] = useState<JourneyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('http://localhost:3000/journey/analytics/summary');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch journey analytics:', error);
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
          <h1 className="text-4xl font-bold text-gray-900">Customer Journeys</h1>
          <p className="text-gray-600 mt-2">Track customer touchpoints across channels</p>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Journeys</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics.total_journeys}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Converted</h3>
              <p className="text-3xl font-bold text-green-600">{analytics.converted_journeys}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold text-blue-600">{analytics.conversion_rate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Touchpoints</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics.avg_touchpoints}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No journey data available</div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Journey Analytics</h2>
          <p className="text-gray-600">
            Customer journey tracking helps you understand how customers interact with your brand across different channels
            and touchpoints before making a purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

