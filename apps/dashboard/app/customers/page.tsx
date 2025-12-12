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

function getInitials(name: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getColorFromId(id: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];
  const index = parseInt(id.slice(0, 2), 16) % colors.length;
  return colors[index];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/v1/customer/search?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const profiles = data.results || [];
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
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.primary_email?.toLowerCase().includes(query) ||
      customer.primary_phone?.includes(query)
    );
  });

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Customers</h1>
        <p className="text-sm text-gray-400">Manage and view all customer profiles</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400">Loading customers...</div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-2">No customers found</div>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Import customer data to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    CUSTOMER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    CONTACT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ORDERS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    TOTAL SPENT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    LAST SEEN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 flex-shrink-0 ${getColorFromId(customer.id)} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                          {getInitials(customer.full_name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {customer.full_name || customer.primary_email?.split('@')[0] || 'Customer'}
                          </div>
                          <div className="text-xs text-gray-400">{customer.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {customer.primary_phone || customer.primary_email || '-'}
                      </div>
                      {customer.primary_phone && customer.primary_email && (
                        <div className="text-xs text-gray-500">{customer.primary_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ₹{parseFloat(customer.total_spent).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(customer.last_seen_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        View 360 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
