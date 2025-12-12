'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  primary_phone: string;
  primary_email: string;
  full_name?: string;
  total_orders: number;
  total_spent: string;
}

export default function SearchPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  function buildUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
    return base ? `${base}${path}` : path;
  }

  async function fetchSuggestions(queryParams: URLSearchParams) {
    try {
      const resp = await fetch(buildUrl(`/v1/customer/search?${queryParams.toString()}`));
      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data.results || []);
      }
    } catch (err) {
      console.error('Suggestion fetch failed', err);
    }
  }

  function onInputChange(value: string, setter: (v: string) => void, key: 'phone' | 'email') {
    setter(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const params = new URLSearchParams();
    if (key === 'phone') params.append('phone', value.trim());
    if (key === 'email') params.append('email', value.trim());
    const timer = setTimeout(() => fetchSuggestions(params), 300);
    setDebounceTimer(timer);
  }

  async function handleSearch() {
    if (!phone && !email) {
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (email) params.append('email', email);

      const response = await fetch(buildUrl(`/v1/customer/search?${params.toString()}`));
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Search Customers</h1>
        <p className="text-sm text-gray-400">Find customers by phone number, email, or other identifiers</p>
      </div>

      {/* Search Form */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => onInputChange(e.target.value, setPhone, 'phone')}
                placeholder="+919876543210"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                📞
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => onInputChange(e.target.value, setEmail, 'email')}
                placeholder="customer@example.com"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                ✉️
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || (!phone && !email)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Quick Search Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
          <div className="text-2xl mb-2">👤</div>
          <div className="text-sm font-medium text-white mb-1">By Name</div>
          <div className="text-xs text-gray-400">Search by full name</div>
        </button>
        <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm font-medium text-white mb-1">By Location</div>
          <div className="text-xs text-gray-400">Search by city/state</div>
        </button>
        <button className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors text-left">
          <div className="text-2xl mb-2">📞</div>
          <div className="text-sm font-medium text-white mb-1">By Phone</div>
          <div className="text-xs text-gray-400">Search by phone number</div>
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Suggestions</h3>
          <div className="space-y-2">
            {suggestions.slice(0, 5).map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  setPhone(customer.primary_phone || '');
                  setEmail(customer.primary_email || '');
                  setSuggestions([]);
                  handleSearch();
                }}
                className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <p className="font-medium text-white text-sm">
                  {customer.full_name || customer.primary_email?.split('@')[0] || 'Customer'}
                </p>
                <p className="text-xs text-gray-400">{customer.primary_phone}</p>
                <p className="text-xs text-gray-500">{customer.primary_email}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Search Results ({results.length})
          </h2>

          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>No customers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">
                        {customer.full_name || customer.primary_email?.split('@')[0] || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-400">{customer.primary_phone}</p>
                      <p className="text-xs text-gray-500">{customer.primary_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {customer.total_orders} orders
                      </p>
                      <p className="text-sm text-green-400">
                        ₹{parseFloat(customer.total_spent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
