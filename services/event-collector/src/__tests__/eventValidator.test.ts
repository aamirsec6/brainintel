/**
 * Event Validator Tests
 */
import { validateEvent } from '../services/eventValidator';
import { IncomingEvent } from '@retail-brain/types';

describe('Event Validator', () => {
  const validEvent: IncomingEvent = {
    source: 'app',
    event_type: 'purchase',
    event_ts: new Date().toISOString(),
    identifiers: {
      phone: '+919876543210',
      email: 'user@example.com',
    },
    payload: {
      sku: 'TSHIRT-123',
      price: 999,
    },
  };

  describe('Valid Events', () => {
    it('should pass validation for a valid event', () => {
      const result = validateEvent(validEvent);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should accept event with only phone identifier', () => {
      const event = {
        ...validEvent,
        identifiers: { phone: '+919876543210' },
      };
      const result = validateEvent(event);
      expect(result.valid).toBe(true);
    });

    it('should accept event with only email identifier', () => {
      const event = {
        ...validEvent,
        identifiers: { email: 'test@example.com' },
      };
      const result = validateEvent(event);
      expect(result.valid).toBe(true);
    });

    it('should accept event with device identifier', () => {
      const event = {
        ...validEvent,
        identifiers: { device: 'abc123def456' },
      };
      const result = validateEvent(event);
      expect(result.valid).toBe(true);
    });
  });

  describe('Timestamp Validation', () => {
    it('should reject event with future timestamp (>5 min)', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const event = {
        ...validEvent,
        event_ts: futureDate.toISOString(),
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('should reject event with very old timestamp (>1 year)', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);

      const event = {
        ...validEvent,
        event_ts: oldDate.toISOString(),
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('old');
    });

    it('should accept event from 6 months ago', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 6);

      const event = {
        ...validEvent,
        event_ts: pastDate.toISOString(),
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', () => {
      const event = {
        ...validEvent,
        identifiers: { email: 'not-an-email' },
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('email');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@company.co.uk',
        'name+tag@domain.org',
      ];

      validEmails.forEach((email) => {
        const event = {
          ...validEvent,
          identifiers: { email },
        };
        const result = validateEvent(event);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Phone Validation', () => {
    it('should reject phone with too few digits', () => {
      const event = {
        ...validEvent,
        identifiers: { phone: '12345' },
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Phone');
    });

    it('should reject phone with too many digits', () => {
      const event = {
        ...validEvent,
        identifiers: { phone: '+1234567890123456' },
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Phone');
    });

    it('should accept various phone formats', () => {
      const validPhones = [
        '+919876543210',
        '1234567890',
        '+1 (555) 123-4567',
        '555-1234',
      ];

      validPhones.forEach((phone) => {
        const event = {
          ...validEvent,
          identifiers: { phone },
        };
        const result = validateEvent(event);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Source and Event Type Validation', () => {
    it('should reject empty source', () => {
      const event = {
        ...validEvent,
        source: '',
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('source');
    });

    it('should reject empty event type', () => {
      const event = {
        ...validEvent,
        event_type: '',
      };

      const result = validateEvent(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('type');
    });

    it('should accept various sources', () => {
      const sources = ['web', 'app', 'pos', 'whatsapp', 'email'];

      sources.forEach((source) => {
        const event = {
          ...validEvent,
          source,
        };
        const result = validateEvent(event);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept various event types', () => {
      const eventTypes = ['view', 'purchase', 'add_to_cart', 'login', 'signup'];

      eventTypes.forEach((event_type) => {
        const event = {
          ...validEvent,
          event_type,
        };
        const result = validateEvent(event);
        expect(result.valid).toBe(true);
      });
    });
  });
});

