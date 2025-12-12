'use client';

import { useEffect, useState } from 'react';

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  time: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'profile':
      return '👤';
    case 'merge':
      return '🔗';
    case 'campaign':
      return '📧';
    case 'purchase':
      return '💰';
    case 'intent':
      return '💬';
    default:
      return '📌';
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/v1/customer/activity?limit=5`;
      console.log('Fetching activities from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent caching
      });
      
      console.log('Activities response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Activities data received:', data);
        const formattedActivities = (data.activities || []).map((activity: any) => ({
          type: activity.type,
          title: activity.title,
          description: activity.description,
          time: formatTimeAgo(activity.time || activity.activity_time),
        }));
        setActivities(formattedActivities);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch activities:', response.status, response.statusText, errorText);
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glossy-card rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Recent Activity</h3>
          <p className="text-sm text-gray-400">Latest events and updates</p>
        </div>
        <button 
          onClick={fetchActivities}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium px-3 py-1 rounded-lg hover:bg-blue-500/10 transition-all"
        >
          View all
        </button>
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-xl"></div>

      {loading ? (
        <div className="space-y-4 relative z-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-700/50 last:border-0">
              <div className="w-8 h-8 bg-gray-700/50 rounded-lg animate-pulse backdrop-blur-sm"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2 animate-pulse backdrop-blur-sm"></div>
                <div className="h-3 bg-gray-700/50 rounded w-1/2 animate-pulse backdrop-blur-sm"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 relative z-10">
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-700/50 last:border-0 hover:bg-white/5 rounded-lg p-2 -m-2 transition-all group">
              <div className="text-2xl flex-shrink-0 filter drop-shadow-lg group-hover:scale-110 transition-transform">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{activity.title}</p>
                <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
