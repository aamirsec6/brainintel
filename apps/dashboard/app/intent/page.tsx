'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface IntentResult {
  intent: string;
  confidence: number;
  channel?: string;
  metadata?: Record<string, any>;
  explanation?: string;
}

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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
      const endpoint = `${baseUrl}/v1/intent/stats`;
      const response = await fetch(baseUrl ? endpoint : '/v1/intent/stats');
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
      const endpoint = `${baseUrl}/v1/intent/detect`;
      const response = await fetch(baseUrl ? endpoint : '/v1/intent/detect', {
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
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Intent Detection</h1>
        <p className="text-sm text-gray-400">Monitor intent throughput, drift, and live detections.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intent Detection */}
          <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 text-white">Detect Intent</h2>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter customer message (WhatsApp, email, chat)..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
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
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Realtime Metrics</h2>
            {statsLoading ? (
              <p className="text-sm text-gray-400">Loading metrics...</p>
            ) : statsError ? (
              <p className="text-sm text-red-600">{statsError}</p>
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
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Top Intents</h2>
            <div className="space-y-3">
              {stats?.intentDistribution.map((intentItem) => (
                <IntentBar
                  key={intentItem.intent}
                  label={intentItem.intent}
                  count={intentItem.count}
                  max={stats.intentDistribution[0]?.count || 1}
                />
              )) || <p className="text-sm text-gray-400">No intent data yet.</p>}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Channels</h2>
            <div className="space-y-3">
              {stats?.channelDistribution.map((channelItem) => (
                <ChannelSummary
                  key={channelItem.channel}
                  channel={channelItem.channel}
                  count={channelItem.count}
                  total={stats?.totalRequests || 1}
                />
              )) || <p className="text-sm text-gray-400">Listening for traffic...</p>}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Recent Activity</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(stats?.recentActivity.length && stats.recentActivity) ? (
                stats.recentActivity.map((entry, index) => (
                  <RecentActivityCard key={`${entry.intent}-${index}`} entry={entry} colors={intentColors} />
                ))
              ) : (
                <p className="text-sm text-gray-400">No recent detections yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <h3 className="font-semibold mb-2 text-white">WhatsApp Messages</h3>
              <p className="text-sm text-gray-300">
                Automatically detect purchase intent, complaints, or support requests from customer conversations.
              </p>
            </div>
            <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <h3 className="font-semibold mb-2 text-white">Email Support</h3>
              <p className="text-sm text-gray-300">
                Route emails to the right team based on detected intent and urgency.
              </p>
            </div>
            <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <h3 className="font-semibold mb-2 text-white">Live Chat</h3>
              <p className="text-sm text-gray-300">
                Respond instantly with intent-aware automations and next-best actions.
              </p>
            </div>
          </div>
        </div>
      </div>
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
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-750">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
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
      <div className="flex justify-between text-sm text-gray-300 mb-1">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full">
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

