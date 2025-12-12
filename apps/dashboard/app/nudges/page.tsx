'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NudgeHistory {
  profile_id: string;
  nudge_type: string;
  action: {
    type: string;
    channel: string;
    personalization: Record<string, any>;
  };
  executed_at: string;
  result?: string;
  full_name?: string;
  primary_email?: string;
}

interface NudgeDecision {
  should_nudge: boolean;
  nudge_type?: string;
  priority: number;
  reason: string;
  predicted_churn_prob?: number;
  predicted_ltv?: number;
  action?: {
    channel: string;
    template: string;
    personalization: Record<string, any>;
  };
}

interface NudgeStats {
  stats: {
    total_nudges: number;
    unique_customers: number;
    nudge_types: number;
    nudges_today: number;
    nudges_this_week: number;
  };
  by_type: Array<{ nudge_type: string; count: number }>;
  by_channel: Array<{ channel: string; count: number }>;
}

export default function NudgesPage() {
  const [nudges, setNudges] = useState<NudgeHistory[]>([]);
  const [stats, setStats] = useState<NudgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [bulkEvaluating, setBulkEvaluating] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [autoExecute, setAutoExecute] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentNudges();
    fetchStats();
    
    // Auto-refresh every 10 seconds if in auto mode
    if (autoMode) {
      const interval = setInterval(() => {
        fetchRecentNudges();
        fetchStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoMode]);

  async function fetchRecentNudges() {
    try {
      const response = await fetch('http://localhost:3000/v1/nudges/recent?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNudges(data.nudges || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent nudges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('http://localhost:3000/v1/nudges/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function evaluateNudge() {
    if (!profileId) return;
    setEvaluating(true);
    try {
      const response = await fetch('http://localhost:3000/v1/nudges/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (response.ok) {
        const data = await response.json();
        setEvaluationResult(data);
        
        // Auto-execute if should nudge
        if (data.nudge?.should_nudge && data.nudge?.action) {
          await executeNudge(data.nudge.nudge_type, data.nudge.action);
        }
      }
    } catch (error) {
      console.error('Failed to evaluate nudge:', error);
    } finally {
      setEvaluating(false);
    }
  }

  async function executeNudge(nudgeType: string, action: any) {
    try {
      const response = await fetch('http://localhost:3000/v1/nudges/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          nudge_type: nudgeType,
          action: action,
        }),
      });
      if (response.ok) {
        await fetchRecentNudges();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to execute nudge:', error);
    }
  }

  async function evaluateBulkNudges() {
    setBulkEvaluating(true);
    try {
      const response = await fetch('http://localhost:3000/v1/nudges/evaluate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 50,
          auto_execute: autoExecute,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setBulkResults(data);
        await fetchRecentNudges();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to evaluate bulk nudges:', error);
    } finally {
      setBulkEvaluating(false);
    }
  }

  async function refreshNow() {
    setRefreshing(true);
    try {
      await Promise.all([fetchRecentNudges(), fetchStats()]);
    } finally {
      setRefreshing(false);
    }
  }

  const nudgeTypeColors: Record<string, string> = {
    churn_prevention: 'bg-red-100 text-red-800',
    upsell: 'bg-blue-100 text-blue-800',
    cross_sell: 'bg-green-100 text-green-800',
    re_engagement: 'bg-yellow-100 text-yellow-800',
    abandoned_cart: 'bg-purple-100 text-purple-800',
  };

  const channelIcons: Record<string, string> = {
    email: '📧',
    sms: '💬',
    push: '🔔',
    whatsapp: '💬',
  };

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Nudge Automator</h1>
          <p className="text-sm text-gray-400">Autonomous customer engagement engine</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refreshNow}
            disabled={refreshing}
            className="px-4 py-2 border-2 border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div>
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Nudges</p>
              <p className="text-2xl font-bold text-white">{stats.stats.total_nudges}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Customers</p>
              <p className="text-2xl font-bold text-white">{stats.stats.unique_customers}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Today</p>
              <p className="text-2xl font-bold text-green-400">{stats.stats.nudges_today}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-white">{stats.stats.nudges_this_week}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Types</p>
              <p className="text-2xl font-bold text-white">{stats.stats.nudge_types}</p>
            </div>
          </div>
        )}

        {/* Bulk Evaluation */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Bulk Nudge Evaluation</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={evaluateBulkNudges}
                disabled={bulkEvaluating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <span className="text-white">
                  {bulkEvaluating ? 'Evaluating...' : 'Evaluate 50 Customers'}
                </span>
              </button>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white">Auto-execute nudges</span>
              </label>
            </div>
            {bulkResults && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="font-semibold mb-2 text-white">Bulk Evaluation Results</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Evaluated:</span>{' '}
                    <span className="font-medium text-white">{bulkResults.evaluated}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Nudges Recommended:</span>{' '}
                    <span className="font-medium text-green-400">{bulkResults.nudges_recommended}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Auto-executed:</span>{' '}
                    <span className="font-medium text-white">{bulkResults.auto_executed ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {bulkResults.results && bulkResults.results.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <p className="text-sm font-medium mb-2 text-white">Recommended Nudges:</p>
                    <div className="space-y-2">
                      {bulkResults.results.slice(0, 10).map((result: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-700 rounded text-sm">
                          <span className="font-medium">{result.customer_name || result.profile_id}</span>
                          {' - '}
                          <span className={nudgeTypeColors[result.nudge.nudge_type || ''] || 'text-gray-400'}>
                            {result.nudge.nudge_type}
                          </span>
                          {' - '}
                          <span className="text-gray-300">{result.nudge.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Single Customer Evaluation */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Evaluate Nudge for Customer</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="Enter customer profile ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={evaluateNudge}
              disabled={evaluating || !profileId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <span className="text-white">
                {evaluating ? 'Evaluating...' : 'Evaluate'}
              </span>
            </button>
          </div>

          {evaluationResult && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <h3 className="font-semibold mb-2">Nudge Decision</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-white">Should Nudge:</span>{' '}
                  {evaluationResult.nudge?.should_nudge ? (
                    <span className="text-green-400 font-medium">✅ Yes</span>
                  ) : (
                    <span className="text-gray-400">❌ No</span>
                  )}
                </p>
                {evaluationResult.nudge?.should_nudge && (
                  <>
                    <p className="text-white">
                      <span className="font-medium">Type:</span>{' '}
                      <span className={nudgeTypeColors[evaluationResult.nudge.nudge_type || ''] || 'text-gray-300'}>
                        {evaluationResult.nudge.nudge_type}
                      </span>
                    </p>
                    <p className="text-white">
                      <span className="font-medium">Priority:</span>{' '}
                      {(evaluationResult.nudge.priority * 100).toFixed(0)}%
                    </p>
                    <p className="text-white">
                      <span className="font-medium">Reason:</span> {evaluationResult.nudge.reason}
                    </p>
                    {evaluationResult.nudge.predicted_churn_prob !== undefined && (
                      <p>
                        <span className="font-medium">Churn Risk:</span>{' '}
                        {(evaluationResult.nudge.predicted_churn_prob * 100).toFixed(1)}%
                      </p>
                    )}
                    {evaluationResult.nudge.predicted_ltv !== undefined && (
                      <p>
                        <span className="font-medium">Predicted LTV:</span> ₹
                        {evaluationResult.nudge.predicted_ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    )}
                    {evaluationResult.nudge.action && (
                      <div className="mt-2 p-2 bg-gray-700 rounded">
                        <p className="text-sm font-medium">Action:</p>
                        <div className="text-sm mt-1">
                          <p>
                            <span className="font-medium">Channel:</span> {evaluationResult.nudge.action.channel}
                            {' '}
                            {channelIcons[evaluationResult.nudge.action.channel] || '📧'}
                          </p>
                          <p>
                            <span className="font-medium">Template:</span> {evaluationResult.nudge.action.template}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Nudges Feed */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Nudge Executions</h2>
            <button
              onClick={fetchRecentNudges}
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : nudges.length === 0 ? (
            <p className="text-gray-400">No nudges executed yet. Run bulk evaluation to start!</p>
          ) : (
            <div className="space-y-3">
              {nudges.map((nudge, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-750">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${nudgeTypeColors[nudge.nudge_type] || 'bg-gray-700 text-gray-300'}`}>
                          {nudge.nudge_type}
                        </span>
                        <span className="text-sm text-gray-400">
                          {channelIcons[nudge.action.channel] || '📧'} {nudge.action.channel}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {nudge.full_name || nudge.primary_email || nudge.profile_id}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(nudge.executed_at).toLocaleString()}
                      </p>
                    </div>
                    {nudge.result && (
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                        {nudge.result}
                      </span>
                    )}
                  </div>
                  {nudge.action.personalization && Object.keys(nudge.action.personalization).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <span className="font-medium">Personalization:</span>{' '}
                      {Object.entries(nudge.action.personalization)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
