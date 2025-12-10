'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  id: string;
  primary_phone: string | null;
  primary_email: string | null;
  total_orders: number;
  total_spent: string;
  avg_order_value?: string | number;
  ltv?: string | number;
  first_seen_at: string;
  last_seen_at: string;
  last_purchase_at?: string | null;
}

interface TimelineEvent {
  id: string;
  source: string;
  event_type: string;
  event_ts: string;
  payload: any;
  received_at: string;
}

interface MLPredictions {
  predicted_ltv?: number;
  churn_probability?: number;
  intent_score?: number;
  last_predicted_at?: string;
}

interface Customer360 {
  profile: Profile;
  identifiers: any[];
  timeline: TimelineEvent[];
  stats: {
    total_events: number;
    event_types: Record<string, number>;
    recent_categories: string[];
  };
  ml_predictions?: MLPredictions;
}

export default function Customer360Page() {
  const params = useParams();
  const [customer360, setCustomer360] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProfile(params.id as string);
    }
  }, [params.id]);

  async function fetchProfile(id: string) {
    try {
      const response = await fetch(`http://localhost:3003/profiles/${id}`);
      if (response.ok) {
        const data: Customer360 = await response.json();
        setCustomer360(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer360 || !customer360.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600">Customer not found</p>
          <Link href="/customers" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const profile = customer360.profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/customers" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Customers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Customer 360</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.primary_email?.split('@')[0] || 'Customer'}
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium">{profile.primary_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{profile.primary_email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Orders</p>
                  <p className="font-medium">{profile.total_orders}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Spent</p>
                  <p className="font-medium text-green-600">
                    ₹{parseFloat(profile.total_spent).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ML Predictions */}
        {customer360.ml_predictions && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">ML Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customer360.ml_predictions.predicted_ltv !== undefined && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Predicted LTV</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{customer360.ml_predictions.predicted_ltv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Next 12 months</p>
                </div>
              )}
              {customer360.ml_predictions.churn_probability !== undefined && (
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm text-gray-600">Churn Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(customer360.ml_predictions.churn_probability * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {customer360.ml_predictions.churn_probability > 0.5 ? 'High Risk' : 
                     customer360.ml_predictions.churn_probability > 0.3 ? 'Medium Risk' : 'Low Risk'}
                  </p>
                </div>
              )}
              {customer360.ml_predictions.intent_score !== undefined && (
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Intent Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(customer360.ml_predictions.intent_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Latest interaction</p>
                </div>
              )}
            </div>
            {!customer360.ml_predictions.predicted_ltv && 
             !customer360.ml_predictions.churn_probability && 
             !customer360.ml_predictions.intent_score && (
              <p className="text-sm text-gray-500 text-center py-4">
                ML predictions not available yet
              </p>
            )}
          </div>
        )}

        {/* Current LTV (from profile) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Customer Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current LTV</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat(profile.total_spent || '0').toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Lifetime value</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{parseFloat((profile as any).avg_order_value || '0').toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Per order</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Since</p>
              <p className="text-xl font-bold text-gray-900">
                {new Date(profile.first_seen_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">First seen</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Activity</p>
              <p className="text-xl font-bold text-gray-900">
                {new Date(profile.last_seen_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">Last seen</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            Activity Timeline
            {customer360.stats.total_events > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({customer360.stats.total_events} events)
              </span>
            )}
          </h3>
          {customer360.timeline && customer360.timeline.length > 0 ? (
            <div className="space-y-4">
              {customer360.timeline.map((event) => (
                <TimelineEvent
                  key={event.id}
                  event={formatEventType(event.event_type)}
                  description={formatEventDescription(event)}
                  time={event.event_ts}
                  icon={getEventIcon(event.event_type)}
                  source={event.source}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No activity recorded yet</p>
              <p className="text-sm mt-1">Events will appear here as the customer interacts with your brand</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TimelineEvent({
  event,
  description,
  time,
  icon,
  source,
}: {
  event: string;
  description: string;
  time: string;
  icon: string;
  source?: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{event}</p>
          {source && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {source}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(time).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function formatEventType(eventType: string): string {
  const typeMap: Record<string, string> = {
    'purchase': 'Purchase',
    'order_placed': 'Order Placed',
    'order_completed': 'Order Completed',
    'cart_added': 'Added to Cart',
    'cart_abandoned': 'Cart Abandoned',
    'page_view': 'Page View',
    'product_view': 'Product Viewed',
    'search': 'Search',
    'signup': 'Account Created',
    'login': 'Login',
    'email_opened': 'Email Opened',
    'email_clicked': 'Email Clicked',
    'profile_created': 'Profile Created',
    'profile_updated': 'Profile Updated',
  };
  return typeMap[eventType.toLowerCase()] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatEventDescription(event: TimelineEvent): string {
  const payload = event.payload || {};
  
  // Try to extract meaningful description from payload
  if (payload.product_name || payload.product_title) {
    const product = payload.product_name || payload.product_title;
    const price = payload.price || payload.amount;
    return price ? `${product} - ₹${parseFloat(price).toLocaleString()}` : product;
  }
  
  if (payload.query) {
    return `Searched for "${payload.query}"`;
  }
  
  if (payload.page_url || payload.path) {
    return `Visited ${payload.page_url || payload.path}`;
  }
  
  if (payload.order_id) {
    return `Order #${payload.order_id}`;
  }
  
  if (payload.message) {
    return payload.message;
  }
  
  // Fallback to event type
  return formatEventType(event.event_type);
}

function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    'purchase': '🛍️',
    'order_placed': '📦',
    'order_completed': '✅',
    'cart_added': '🛒',
    'cart_abandoned': '🚫',
    'page_view': '👁️',
    'product_view': '👀',
    'search': '🔍',
    'signup': '✨',
    'login': '🔐',
    'email_opened': '📧',
    'email_clicked': '📬',
    'profile_created': '✨',
    'profile_updated': '📝',
  };
  return iconMap[eventType.toLowerCase()] || '📌';
}

