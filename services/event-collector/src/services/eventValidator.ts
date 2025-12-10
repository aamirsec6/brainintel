/**
 * Event Validator
 * Business logic validation beyond schema validation
 */
import { IncomingEvent } from '@retail-brain/types';

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate event business rules
 */
export function validateEvent(event: IncomingEvent): ValidationResult {
  // Rule 1: Event timestamp shouldn't be too far in the future
  const eventTime = new Date(event.event_ts);
  const now = new Date();
  const futureThreshold = 5 * 60 * 1000; // 5 minutes

  if (eventTime.getTime() > now.getTime() + futureThreshold) {
    return {
      valid: false,
      reason: 'Event timestamp is too far in the future',
    };
  }

  // Rule 2: Event timestamp shouldn't be too old (more than 1 year)
  const pastThreshold = 365 * 24 * 60 * 60 * 1000; // 1 year

  if (now.getTime() - eventTime.getTime() > pastThreshold) {
    return {
      valid: false,
      reason: 'Event timestamp is too old (more than 1 year)',
    };
  }

  // Rule 3: Source should not be empty
  if (!event.source || event.source.trim().length === 0) {
    return {
      valid: false,
      reason: 'Event source cannot be empty',
    };
  }

  // Rule 4: Event type should not be empty
  if (!event.event_type || event.event_type.trim().length === 0) {
    return {
      valid: false,
      reason: 'Event type cannot be empty',
    };
  }

  // Rule 5: At least one identifier must be present (already validated by Zod)

  // Rule 6: Email should be valid format if provided
  if (event.identifiers.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(event.identifiers.email)) {
      return {
        valid: false,
        reason: 'Invalid email format',
      };
    }
  }

  // Rule 7: Phone should have reasonable length if provided
  if (event.identifiers.phone) {
    const phoneDigits = event.identifiers.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return {
        valid: false,
        reason: 'Phone number length must be between 7 and 15 digits',
      };
    }
  }

  // All validations passed
  return { valid: true };
}

