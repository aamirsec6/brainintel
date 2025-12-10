'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ShopifyConnectorPage() {
  const [shopUrl, setShopUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  async function handleConnect() {
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Create connector via API
      const response = await fetch('http://localhost:3000/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_api_key',
        },
        body: JSON.stringify({
          name: 'Shopify Store',
          type: 'shopify',
          config: {
            store_url: shopUrl,
            api_key: apiKey,
            api_secret: apiSecret,
          },
          enabled: true,
          sync_frequency: '0 */6 * * *', // Every 6 hours
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({ type: 'success', message: 'Shopify connected successfully! Starting initial sync...' });
        
        // Trigger initial sync
        setTimeout(async () => {
          try {
            const syncResponse = await fetch(`http://localhost:3000/connectors/${data.connector.id}/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_api_key',
              },
            });
            
            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              setStatus({ 
                type: 'success', 
                message: `Sync started! ${syncData.sync?.records_synced || 0} records synced.` 
              });
            }
          } catch (error) {
            console.error('Sync error:', error);
          }
        }, 1000);
      } else {
        const error = await response.json();
        setStatus({ type: 'error', message: error.error?.message || 'Connection failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to connect. Check your credentials and try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/connectors" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Connectors
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Connect Shopify Store</h1>
          <p className="text-gray-600 mt-2">Sync your Shopify orders and customers automatically</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store URL
              </label>
              <input
                type="text"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Your Shopify store domain (without https://)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="shpat_xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Create in Shopify Admin → Apps → Develop apps → Create app → Admin API access token
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Secret (Optional)
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Optional - for webhook validation"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {status.message && (
              <div className={`p-4 rounded-md ${
                status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {status.message}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading || !shopUrl || !apiKey}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect & Sync'}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">How to Get API Credentials:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Go to Shopify Admin → Apps → Develop apps</li>
              <li>Click "Create an app"</li>
              <li>Name it "Retail Brain"</li>
              <li>Go to "Admin API access scopes"</li>
              <li>Enable: <code className="bg-gray-100 px-1 rounded">read_orders</code>, <code className="bg-gray-100 px-1 rounded">read_customers</code></li>
              <li>Click "Install app" and copy the Admin API access token</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

