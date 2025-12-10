'use client';

import { useState, useEffect } from 'react';

interface ModelMetrics {
  model_name: string;
  period_days: number;
  total_predictions: number;
  metrics: {
    mse?: number;
    mae?: number;
    rmse?: number;
    r2?: number;
    auc?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
}

interface DriftAlert {
  id: string;
  type: string;
  model_name: string;
  severity: string;
  message: string;
  created_at: string;
}

export default function MLModelsPage() {
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [alerts, setAlerts] = useState<DriftAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchAlerts();
    
    // Set up auto-refresh every 20 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchMetrics();
      fetchAlerts();
      setTimeout(() => setRefreshing(false), 1000);
    }, 20000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const models = ['identity_resolution_model', 'intent-detection', 'recommendation-model', 'churn-prediction', 'ltv-prediction'];
      const metricsData = await Promise.all(
        models.map(async (model) => {
          try {
            const res = await fetch(`http://localhost:3000/v1/ml-models/metrics/${model}?days=7`);
            if (res.ok) {
              const data = await res.json();
              return {
                model_name: model,
                total_predictions: data.total_predictions || 0,
                metrics: data.metrics || {},
              };
            } else {
              // Return a default structure if request fails
              return {
                model_name: model,
                total_predictions: 0,
                metrics: {},
              };
            }
          } catch (e) {
            // Return a default structure even if fetch fails
            return {
              model_name: model,
              total_predictions: 0,
              metrics: {},
            };
          }
        })
      );
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setError('Failed to load model metrics. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setError(null);
      const res = await fetch('http://localhost:3000/v1/ml-models/alerts?limit=20');
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ML Models Dashboard</h1>
        {refreshing && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            Refreshing...
          </div>
        )}
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Model Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Model Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((model) => (
            <div key={model.model_name} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{model.model_name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Predictions:</span>
                  <span className="font-medium">{model.total_predictions || 0}</span>
                </div>
                {model.metrics?.rmse && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">RMSE:</span>
                    <span className="font-medium">{model.metrics.rmse.toFixed(2)}</span>
                  </div>
                )}
                {model.metrics?.mae && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MAE:</span>
                    <span className="font-medium">{model.metrics.mae.toFixed(2)}</span>
                  </div>
                )}
                {model.metrics?.r2 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">R²:</span>
                    <span className="font-medium">{model.metrics.r2.toFixed(3)}</span>
                  </div>
                )}
                {model.metrics?.auc && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AUC:</span>
                    <span className="font-medium">{model.metrics.auc.toFixed(3)}</span>
                  </div>
                )}
                {model.metrics?.f1_score && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">F1-Score:</span>
                    <span className="font-medium">{model.metrics.f1_score.toFixed(3)}</span>
                  </div>
                )}
                {(!model.metrics || Object.keys(model.metrics).length === 0) && (
                  <div className="text-sm text-gray-500 italic">
                    No metrics available yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Alerts</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No alerts
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{alert.model_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{alert.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

