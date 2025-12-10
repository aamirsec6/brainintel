'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Connector {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  last_synced_at: string | null;
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectors();
  }, []);

  async function fetchConnectors() {
    try {
      const response = await fetch('http://localhost:3000/connectors');
      if (response.ok) {
        const data = await response.json();
        setConnectors(data.connectors || []);
      }
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
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
          <h1 className="text-4xl font-bold text-gray-900">Data Connectors</h1>
          <p className="text-gray-600 mt-2">Manage integrations with external systems</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Active Connectors</h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : connectors.length === 0 ? (
            <div className="text-center py-8">
              <p className="mb-4 text-gray-500">No connectors configured</p>
              <p className="text-sm text-gray-400 mb-6">Connect your Shopify, WooCommerce, or other platforms to sync data automatically</p>
              <Link
                href="/connectors/shopify"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                + Connect Shopify Store
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Synced</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connectors.map((connector) => (
                    <tr key={connector.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{connector.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{connector.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          connector.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {connector.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {connector.last_synced_at 
                          ? new Date(connector.last_synced_at).toLocaleString()
                          : 'Never'
                        }
                      </td>
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

