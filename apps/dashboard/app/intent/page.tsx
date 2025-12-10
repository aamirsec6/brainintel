'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function IntentPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<IntentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ text: string; result: IntentResult; timestamp: string }>>([]);
  const [stats, setStats] = useState<IntentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/v1/intent/stats');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload: IntentStats = await response.json();
      setStats(payload);
      setStatsError(null);
    } catch (error) {
      setStatsError('Unable to load intent metrics right now.');
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  }

  async function detectIntent() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/v1/intent/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setHistory([
          { text, result: data, timestamp: new Date().toISOString() },
          ...history.slice(0, 9),
        ]);
      }
    } catch (error) {
      console.error('Failed to detect intent:', error);
    } finally {
      setLoading(false);
    }
  }

  const intentColors: Record<string, string> = {
    purchase: 'bg-green-100 text-green-800',
    inquiry: 'bg-blue-100 text-blue-800',
    complaint: 'bg-red-100 text-red-800',
    support: 'bg-yellow-100 text-yellow-800',
    feedback: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">🎯 Intent Detection</h1>
          <p className="text-sm text-gray-600">Monitor intent throughput, drift, and live detections.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intent Detection */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Detect Intent</h2>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter customer message (WhatsApp, email, chat)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                rows={5}
              />
              <button
                onClick={detectIntent}
                disabled={loading || !text.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Detecting...' : 'Detect Intent'}
              </button>

              {result && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Detected Intent</h3>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        intentColors[result.intent] || intentColors.other
                      }`}
                    >
                      {result.intent}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  {result.explanation && (
                    <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Realtime Metrics</h2>
            {statsLoading ? (
              <p className="text-sm text-gray-500">Loading metrics...</p>
            ) : statsError ? (
              <p className="text-sm text-red-500">{statsError}</p>
            ) : (
              <div className="space-y-3">
                <MetricCard label="Total requests" value={stats?.totalRequests.toLocaleString() || '0'} />
                <MetricCard label="Cache hit rate" value={`${((stats?.cacheHitRate || 0) * 100).toFixed(1)}%`} />
                <MetricCard label="Fallback rate" value={`${((stats?.fallbackRate || 0) * 100).toFixed(1)}%`} />
                <div
                  className={`p-3 rounded-lg border ${
                    stats?.driftAlert ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    Drift status: {stats?.driftAlert ? 'Detected' : 'Stable'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{stats?.driftReason}</p>
                  {stats?.lastDriftAt && (
                    <p className="text-xs text-gray-500 mt-1">Last alert: {new Date(stats.lastDriftAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Top Intents</h2>
            <div className="space-y-3">
              {stats?.intentDistribution.map((intentItem) => (
                <IntentBar
                  key={intentItem.intent}
                  label={intentItem.intent}
                  count={intentItem.count}
                  max={stats.intentDistribution[0]?.count || 1}
                />
              )) || (
                <p className="text-sm text-gray-500">No intent data yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Channels</h2>
            <div className="space-y-3">
              {stats?.channelDistribution.map((channelItem) => (
                <ChannelSummary
                  key={channelItem.channel}
                  channel={channelItem.channel}
                  count={channelItem.count}
                  total={stats?.totalRequests || 1}
                />
              )) || (
                <p className="text-sm text-gray-500">Listening for traffic...</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(stats?.recentActivity.length && stats.recentActivity) ? (
                stats.recentActivity.map((entry, index) => (
                  <RecentActivityCard key={`${entry.intent}-${index}`} entry={entry} colors={intentColors} />
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent detections yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">WhatsApp Messages</h3>
              <p className="text-sm text-gray-600">
                Automatically detect purchase intent, complaints, or support requests from customer conversations.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-gray-600">
                Route emails to the right team based on detected intent and urgency.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600">
                Respond instantly with intent-aware automations and next-best actions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface IntentStats {
  totalRequests: number;
  cacheHits: number;
  cacheHitRate: number;
  fallbackRate: number;
  driftAlert: boolean;
  driftReason: string;
  lastDriftAt?: string;
  intentDistribution: Array<{ intent: string; count: number }>;
  channelDistribution: Array<{ channel: string; count: number }>;
  recentActivity: Array<{
    intent: string;
    confidence: number;
    channel: string;
    status: string;
    cached: boolean;
    metadata: Record<string, any>;
    timestamp: string;
  }>;
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="p-3 rounded-lg border border-gray-200">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

interface IntentBarProps {
  label: string;
  count: number;
  max: number;
}

function IntentBar({ label, count, max }: IntentBarProps) {
  const widthPercent = Math.min(100, (count / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-700 mb-1">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full">
        <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}

interface ChannelSummaryProps {
  channel: string;
  count: number;
  total: number;
}

function ChannelSummary({ channel, count, total }: ChannelSummaryProps) {
  const percent = ((count / total) * 100).toFixed(1);
  return (
    <div className="border border-dashed border-gray-200 rounded-lg p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold capitalize">{channel}</p>
        <p className="text-xs text-gray-500">{percent}% of requests</p>
      </div>
      <div className="text-sm font-medium text-gray-900">{count}</div>
    </div>
  );
}

interface RecentActivityCardProps {
  entry: IntentStats['recentActivity'][0];
  colors: Record<string, string>;
}

function RecentActivityCard({ entry, colors }: RecentActivityCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
        <span className="capitalize">{entry.channel}</span>
      </div>
      <p className="text-sm text-gray-900 truncate">{entry.metadata?.preview || 'No text'}</p>
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-0.5 rounded-full ${colors[entry.intent] || colors.other}`}>
          {entry.intent}
        </span>
        <span>{(entry.confidence * 100).toFixed(0)}%</span>
      </div>
      <p className="text-xs text-gray-500">Status: {entry.status}</p>
    </div>
  );
}

