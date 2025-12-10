'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  sku: string;
  channel: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  async function fetchInventory() {
    try {
      const response = await fetch('http://localhost:3000/inventory/channel/web');
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLowStock() {
    try {
      const response = await fetch('http://localhost:3000/inventory/low-stock');
      if (response.ok) {
        const data = await response.json();
        setLowStock(data.inventory || []);
      }
    } catch (error) {
      console.error('Failed to fetch low stock:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Real-time inventory tracking across channels</p>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Low Stock Alert</h2>
            <p className="text-yellow-700">{lowStock.length} items below reorder point</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Inventory Overview</h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No inventory data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.channel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reserved_quantity}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        item.available_quantity <= item.reorder_point ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.available_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorder_point}</td>
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

