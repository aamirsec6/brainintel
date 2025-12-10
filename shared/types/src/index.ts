/**
 * Shared TypeScript types and interfaces
 * Single source of truth for all type definitions across services
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum IdentifierType {
  PHONE = 'phone',
  EMAIL = 'email',
  DEVICE = 'device',
  COOKIE = 'cookie',
  LOYALTY_ID = 'loyalty_id',
  INVOICE_ID = 'invoice_id',
}

export enum EventStatus {
  ACCEPTED = 'accepted',
  QUARANTINED = 'quarantined',
  PROCESSED = 'processed',
}

export enum MergeStatus {
  AUTO = 'auto',
  MANUAL = 'manual',
  PENDING_REVIEW = 'pending_review',
  ROLLED_BACK = 'rolled_back',
}

// ============================================================================
// CUSTOMER PROFILE
// ============================================================================

export interface CustomerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  gender: string | null;
  date_of_birth: Date | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  ltv: number;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  first_seen_at: Date;
  last_seen_at: Date;
  last_purchase_at: Date | null;
  segment: string | null;
  tags: string[];
  embedding: number[] | null;
  is_merged: boolean;
  merged_into: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileIdentifier {
  id: string;
  profile_id: string;
  type: IdentifierType;
  value: string;
  value_hash: string;
  source: string | null;
  confidence: number;
  first_seen_at: Date;
  last_seen_at: Date;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface IncomingEvent {
  source: string;
  event_type: string;
  event_ts: string; // ISO 8601
  identifiers: {
    phone?: string;
    email?: string;
    device?: string;
    cookie?: string;
    loyalty_id?: string;
    invoice_id?: string;
  };
  payload: Record<string, unknown>;
}

export interface CustomerRawEvent {
  id: string;
  source: string;
  event_type: string;
  event_ts: Date;
  received_at: Date;
  identifiers: Record<string, unknown>;
  payload: Record<string, unknown>;
  status: EventStatus;
  error_message: string | null;
  processed_at: Date | null;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface Event {
  id: string;
  profile_id: string;
  raw_event_id: string | null;
  source: string;
  event_type: string;
  event_ts: Date;
  payload: Record<string, unknown>;
  sku: string | null;
  product_name: string | null;
  category: string | null;
  price: number | null;
  quantity: number | null;
  revenue: number | null;
  session_id: string | null;
  channel: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: Date;
}

// ============================================================================
// IDENTITY MERGE
// ============================================================================

export interface IdentityMergeLog {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  source_snapshot: Record<string, unknown>;
  target_snapshot: Record<string, unknown>;
  merge_type: MergeStatus;
  confidence_score: number;
  scoring_details: ScoringDetails;
  matched_identifiers: Record<string, unknown> | null;
  reason: string;
  triggered_by: string | null;
  rolled_back: boolean;
  rolled_back_at: Date | null;
  rolled_back_by: string | null;
  rollback_reason: string | null;
  merged_at: Date;
  created_at: Date;
}

export interface ScoringDetails {
  phone_match?: number;
  email_match?: number;
  name_similarity?: number;
  device_match?: number;
  purchase_overlap?: number;
  total_score: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface EventAcceptedResponse {
  status: 'accepted';
  event_id: string;
}

export interface Customer360 {
  profile: CustomerProfile;
  identifiers: ProfileIdentifier[];
  timeline: Event[];
  recommendations?: Recommendation[];
  stats: {
    total_events: number;
    event_types: Record<string, number>;
    recent_categories: string[];
  };
  ml_predictions?: {
    predicted_ltv?: number;
    churn_probability?: number;
    intent_score?: number;
    last_predicted_at?: Date;
  };
}

export interface Recommendation {
  type: string;
  items: RecommendationItem[];
  reason: string;
}

export interface RecommendationItem {
  sku: string;
  name: string;
  category: string;
  price: number;
  score: number;
}

// ============================================================================
// REQUEST CONTEXT
// ============================================================================

export interface RequestContext {
  request_id: string;
  correlation_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

