'use client';

import { useAuth } from '../lib/auth';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-gray-900 text-white border-b border-gray-700 h-16 flex items-center justify-between px-6">
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers, events, actions..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            ⌘K
          </div>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-4 ml-4">
          <div className="text-sm text-gray-400">
            {user.name || user.email}
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
