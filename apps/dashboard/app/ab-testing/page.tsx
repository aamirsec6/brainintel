'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: string[];
  traffic_split: Record<string, number>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface VariantResult {
  variant: string;
  assigned_count: number;
  converted_count: number;
  conversion_rate: number;
  total_conversions: number;
  total_value: number;
  avg_value: number;
  uplift: number;
}

interface ExperimentResults {
  experiment_id: string;
  results: {
    experiment: Experiment;
    results: VariantResult[];
    summary: {
      total_assigned: number;
      total_converted: number;
      overall_conversion_rate: number;
    };
  };
  fetched_at: string;
}

export default function ABTestingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    variants: ['A', 'B'],
    traffic_split: { A: 50, B: 50 },
  });

  useEffect(() => {
    fetchExperiments();
  }, []);

  async function fetchExperiments() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/ab-testing/experiments`);
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createExperiment() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/ab-testing/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExperiment),
      });
      if (response.ok) {
        await fetchExperiments();
        setShowCreateForm(false);
        setNewExperiment({ name: '', description: '', variants: ['A', 'B'], traffic_split: { A: 50, B: 50 } });
      }
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-900 min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">A/B Testing</h1>
          <p className="text-sm text-gray-400">Run experiments and measure impact</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Experiment
        </button>
      </div>

      <div>
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Create New Experiment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Experiment Name</label>
                <input
                  type="text"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="e.g., Email Subject Line Test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  rows={3}
                  placeholder="What are you testing?"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={createExperiment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {experiments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No experiments yet</h3>
            <p className="text-gray-400 mb-4">Create your first A/B test to start optimizing</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Experiment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {experiments.map((experiment) => (
              <ExperimentCard key={experiment.id} experiment={experiment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [recording, setRecording] = useState(false);
  const [profileId, setProfileId] = useState('');
  const [conversionType, setConversionType] = useState('purchase');
  const [conversionValue, setConversionValue] = useState<string>('');
  const [assignedVariant, setAssignedVariant] = useState<string | null>(null);

  async function fetchResults() {
    setLoadingResults(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/ab-testing/experiments/${experiment.id}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoadingResults(false);
    }
  }

  async function assignVariant() {
    if (!profileId) return;
    setAssigning(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/ab-testing/experiments/${experiment.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedVariant(data.variant || data.assignment || null);
      }
    } catch (error) {
      console.error('Failed to assign variant:', error);
    } finally {
      setAssigning(false);
    }
  }

  async function recordConversion() {
    if (!profileId) return;
    setRecording(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/ab-testing/experiments/${experiment.id}/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          conversion_type: conversionType,
          value: conversionValue ? Number(conversionValue) : undefined,
        }),
      });
      if (response.ok) {
        await fetchResults();
      }
    } catch (error) {
      console.error('Failed to record conversion:', error);
    } finally {
      setRecording(false);
    }
  }

  const statusColors = {
    draft: 'bg-gray-700 text-gray-300',
    running: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{experiment.name}</h3>
          {experiment.description && (
            <p className="text-sm text-gray-400 mt-1">{experiment.description}</p>
          )}
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[experiment.status]}`}>
          {experiment.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400">Variants</p>
          <p className="font-medium text-white">{experiment.variants.join(', ')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Traffic Split</p>
          <p className="font-medium text-white">
            {Object.entries(experiment.traffic_split)
              .map(([v, p]) => `${v}: ${p}%`)
              .join(', ')}
          </p>
        </div>
      </div>

      {/* Variant assignment and conversion logging */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-semibold mb-3 text-white">Test Harness</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-400">Profile ID</label>
            <input
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="customer profile id"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Conversion Type</label>
            <input
              value={conversionType}
              onChange={(e) => setConversionType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="purchase / click / signup"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Conversion Value (₹ optional)</label>
            <input
              value={conversionValue}
              onChange={(e) => setConversionValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              placeholder="e.g., 1200"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={assignVariant}
            disabled={assigning || !profileId}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {assigning ? 'Assigning...' : 'Assign Variant'}
          </button>
          <button
            onClick={recordConversion}
            disabled={recording || !profileId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {recording ? 'Logging...' : 'Log Conversion'}
          </button>
          <button
            onClick={fetchResults}
            disabled={loadingResults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loadingResults ? 'Loading...' : 'Refresh Results'}
          </button>
        </div>
        {assignedVariant && (
          <p className="text-sm text-gray-400 mt-2">Assigned variant: <span className="font-medium text-white">{assignedVariant}</span></p>
        )}
      </div>

      {results && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold mb-2 text-white">Results</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-400">Total Assigned</p>
              <p className="font-medium text-white">{results.results.summary.total_assigned}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Converted</p>
              <p className="font-medium text-white">{results.results.summary.total_converted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Overall Conversion Rate</p>
              <p className="font-medium text-white">{results.results.summary.overall_conversion_rate.toFixed(2)}%</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Variant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Assigned</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Converted</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Conv Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Uplift vs Control</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Avg Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {results.results.results.map((variant) => {
                  const isWinner = variant.uplift === Math.max(...results.results.results.map((v) => v.uplift));
                  const upliftColor = variant.uplift >= 0 ? 'text-green-400' : 'text-red-400';
                  return (
                    <tr key={variant.variant} className={isWinner ? 'bg-green-500/10' : ''}>
                      <td className="px-4 py-2 text-sm font-medium text-white">{variant.variant}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{variant.assigned_count}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{variant.converted_count}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{variant.conversion_rate.toFixed(2)}%</td>
                      <td className={`px-4 py-2 text-sm font-medium ${upliftColor}`}>
                        {variant.variant === results.results.results[0].variant ? '—' : `${variant.uplift.toFixed(2)}%`}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">₹{variant.avg_value.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

