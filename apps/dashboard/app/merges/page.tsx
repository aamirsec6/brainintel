'use client';

import { useEffect, useState } from 'react';

interface MergeLog {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  source_name: string;
  target_name: string;
  merge_type: string;
  confidence_score: number;
  merged_at: string;
  rolled_back: boolean;
}

export default function MergeLogsPage() {
  const [logs, setLogs] = useState<MergeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMergeLogs();
  }, []);

  async function fetchMergeLogs() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/identity/merge-logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch merge logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Merge Logs</h1>
        <p className="text-sm text-gray-400">Identity resolution history</p>
      </div>

      {loading ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400">Loading merge logs...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-white font-medium mb-2">No merges yet</p>
          <p className="text-sm text-gray-400">
            Profile merges will appear here when duplicates are detected
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const sourceName = log.source_name || 'Unknown';
            const targetName = log.target_name || 'Unknown';
            const displayName = `${sourceName} & ${targetName}`;
            const isCompleted = !log.rolled_back;
            
            return (
              <div
                key={log.id}
                className="bg-gray-800 rounded-lg p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {isCompleted ? '✓' : '⏱'}
                    </div>
                    <div>
                      <div className="text-lg font-medium text-white">{displayName}</div>
                      <div className="text-sm text-gray-400">
                        Merge ID: {log.id.slice(0, 8)} • {new Date(log.merged_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white mb-1">
                      Confidence {Math.round(log.confidence_score * 100)}%
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {isCompleted ? 'completed' : 'pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400 mb-1">Source Profile (merged)</p>
                    <p className="font-medium text-white">{sourceName}</p>
                    <p className="text-xs text-gray-500">{log.source_profile_id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Target Profile (survivor)</p>
                    <p className="font-medium text-white">{targetName}</p>
                    <p className="text-xs text-gray-500">{log.target_profile_id.slice(0, 8)}</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        log.confidence_score >= 0.8
                          ? 'bg-green-500'
                          : log.confidence_score >= 0.45
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${log.confidence_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
