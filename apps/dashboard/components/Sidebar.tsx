'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Customers', href: '/customers' },
  { name: 'Search', href: '/search' },
  { name: 'Merge Logs', href: '/merges' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'AI Assistant', href: '/ai' },
  { name: 'Import Data', href: '/import' },
  { name: 'A/B Testing', href: '/ab-testing' },
  { name: 'Automations', href: '/automations' },
  { name: 'Intent Detection', href: '/intent' },
  { name: 'ML Models', href: '/ml-models' },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings' },
  { name: 'Help', href: '/help' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="font-bold text-lg">Retail Brain</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 font-medium'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-700 py-4">
        {bottomNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

