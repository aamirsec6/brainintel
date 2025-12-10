/**
 * Event schema validators using Zod
 * Strict validation for all incoming events
 */
import { z } from 'zod';

/**
 * Identifiers schema
 * At least ONE identifier must be provided
 */
export const identifiersSchema = z
  .object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    device: z.string().optional(),
    cookie: z.string().optional(),
    loyalty_id: z.string().optional(),
    invoice_id: z.string().optional(),
  })
  .refine(
    (data) =>
      data.phone ||
      data.email ||
      data.device ||
      data.cookie ||
      data.loyalty_id ||
      data.invoice_id,
    {
      message: 'At least one identifier must be provided',
    }
  );

/**
 * Incoming event schema
 * This is the contract that all external systems must follow
 */
export const incomingEventSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  event_type: z.string().min(1, 'Event type is required'),
  event_ts: z.string().datetime({ message: 'Invalid ISO 8601 timestamp' }),
  identifiers: identifiersSchema,
  payload: z.record(z.unknown()).default({}),
});

/**
 * Profile creation schema
 */
export const createProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  primary_phone: z.string().optional(),
  primary_email: z.string().email().optional(),
  date_of_birth: z
    .string()
    .date()
    .optional()
    .or(z.date().optional()),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  segment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  device: z.string().optional(),
  loyalty_id: z.string().optional(),
  name: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
});

/**
 * Manual merge request schema
 */
export const manualMergeSchema = z.object({
  source_profile_id: z.string().uuid(),
  target_profile_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  triggered_by: z.string().optional(),
});

/**
 * Rollback merge request schema
 */
export const rollbackMergeSchema = z.object({
  merge_log_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  rolled_back_by: z.string().optional(),
});

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues: Array<{
      path: string[];
      message: string;
    }>;
  };
}

/**
 * Validate incoming event
 */
export function validateIncomingEvent(
  data: unknown
): ValidationResult<z.infer<typeof incomingEventSchema>> {
  const result = incomingEventSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Event validation failed',
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
      })),
    },
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(
  data: unknown
): ValidationResult<z.infer<typeof searchQuerySchema>> {
  const result = searchQuerySchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Search query validation failed',
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
      })),
    },
  };
}

/**
 * Generic validator
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: 'Validation failed',
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
      })),
    },
  };
}

// All schemas are already exported above

