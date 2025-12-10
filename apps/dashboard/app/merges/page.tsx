'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      const response = await fetch('http://localhost:3002/identity/merge-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch merge logs:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Merge Logs</h1>
          <p className="text-sm text-gray-600">Identity resolution history</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading merge logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-900 font-medium mb-2">No merges yet</p>
            <p className="text-sm text-gray-600">
              Profile merges will appear here when duplicates are detected
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        log.merge_type === 'auto'
                          ? 'bg-green-100 text-green-800'
                          : log.merge_type === 'manual'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.merge_type.toUpperCase()}
                    </span>
                    {log.rolled_back && (
                      <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ROLLED BACK
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Confidence: {(log.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.merged_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Source Profile (merged)</p>
                    <p className="font-medium">{log.source_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{log.source_profile_id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Target Profile (survivor)</p>
                    <p className="font-medium">{log.target_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{log.target_profile_id.slice(0, 8)}</p>
                  </div>
                </div>

                {/* Progress bar showing confidence */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

