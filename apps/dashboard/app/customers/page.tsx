'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  primary_phone: string | null;
  primary_email: string | null;
  full_name: string | null;
  total_orders: number;
  total_spent: string;
  last_seen_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      // Fetch from API Gateway or Profile Service
      const response = await fetch('http://localhost:3003/profiles/search?limit=100');
      if (response.ok) {
        const data = await response.json();
        // API returns { results: [...], count: number }
        const profiles = data.results || [];
        // Transform to match our interface
        const customers = profiles.map((profile: any) => ({
          id: profile.id,
          primary_phone: profile.primary_phone,
          primary_email: profile.primary_email,
          full_name: profile.full_name,
          total_orders: profile.total_orders || 0,
          total_spent: profile.total_spent?.toString() || '0',
          last_seen_at: profile.last_seen_at || profile.created_at,
        }));
        setCustomers(customers);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      // Don't show test data - show empty state instead
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Customers</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">No customers found. Make sure Profile Service is running.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.full_name || customer.primary_email?.split('@')[0] || 'Customer'}
                          </div>
                          <div className="text-xs text-gray-500">{customer.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.primary_phone}</div>
                      <div className="text-xs text-gray-500">{customer.primary_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{customer.total_orders}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{parseFloat(customer.total_spent).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.last_seen_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View 360 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

