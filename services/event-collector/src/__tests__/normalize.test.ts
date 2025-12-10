/**
 * Normalization Utilities Tests
 */
import {
  normalizeIdentifiers,
  extractEcommerceFields,
  extractSessionInfo,
} from '../utils/normalize';

describe('Identifier Normalization', () => {
  describe('Phone Normalization', () => {
    it('should normalize phone numbers', () => {
      const result = normalizeIdentifiers({
        phone: '+1 (555) 123-4567',
      });

      expect(result.phone).toBeDefined();
      expect(result.phone?.raw).toBe('+1 (555) 123-4567');
      expect(result.phone?.normalized).toBe('15551234567');
      expect(result.phone?.hash).toBeTruthy();
      expect(result.phone?.hash.length).toBe(64); // SHA256 length
    });

    it('should handle various phone formats', () => {
      const phones = [
        '+919876543210',
        '9876543210',
        '+91-987-654-3210',
        '(987) 654-3210',
      ];

      phones.forEach((phone) => {
        const result = normalizeIdentifiers({ phone });
        expect(result.phone?.normalized).toMatch(/^\d+$/);
      });
    });
  });

  describe('Email Normalization', () => {
    it('should normalize emails to lowercase', () => {
      const result = normalizeIdentifiers({
        email: 'User@Example.COM',
      });

      expect(result.email).toBeDefined();
      expect(result.email?.raw).toBe('User@Example.COM');
      expect(result.email?.normalized).toBe('user@example.com');
      expect(result.email?.hash).toBeTruthy();
    });

    it('should trim whitespace from emails', () => {
      const result = normalizeIdentifiers({
        email: '  user@example.com  ',
      });

      expect(result.email?.normalized).toBe('user@example.com');
    });
  });

  describe('Device & Other Identifiers', () => {
    it('should hash device identifiers', () => {
      const result = normalizeIdentifiers({
        device: 'ABC123-DEF456',
      });

      expect(result.device).toBeDefined();
      expect(result.device?.raw).toBe('ABC123-DEF456');
      expect(result.device?.hash).toBeTruthy();
      expect(result.device?.hash.length).toBe(64);
    });

    it('should handle multiple identifiers', () => {
      const result = normalizeIdentifiers({
        phone: '+919876543210',
        email: 'user@example.com',
        device: 'device123',
        loyalty_id: 'LOYAL123',
      });

      expect(result.phone).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.device).toBeDefined();
      expect(result.loyalty_id).toBeDefined();
    });

    it('should generate consistent hashes', () => {
      const result1 = normalizeIdentifiers({ phone: '+919876543210' });
      const result2 = normalizeIdentifiers({ phone: '+91 98765 43210' });

      // Same phone in different formats should produce same hash
      expect(result1.phone?.hash).toBe(result2.phone?.hash);
    });
  });
});

describe('E-commerce Field Extraction', () => {
  it('should extract e-commerce fields from payload', () => {
    const payload = {
      sku: 'TSHIRT-123',
      product_name: 'Cool T-Shirt',
      category: 'Apparel',
      price: 999,
      quantity: 2,
      revenue: 1998,
    };

    const result = extractEcommerceFields(payload);

    expect(result.sku).toBe('TSHIRT-123');
    expect(result.product_name).toBe('Cool T-Shirt');
    expect(result.category).toBe('Apparel');
    expect(result.price).toBe(999);
    expect(result.quantity).toBe(2);
    expect(result.revenue).toBe(1998);
  });

  it('should handle missing fields', () => {
    const payload = {
      sku: 'TSHIRT-123',
    };

    const result = extractEcommerceFields(payload);

    expect(result.sku).toBe('TSHIRT-123');
    expect(result.product_name).toBeNull();
    expect(result.category).toBeNull();
    expect(result.price).toBeNull();
  });

  it('should parse string numbers', () => {
    const payload = {
      price: '999',
      quantity: '2',
      revenue: '1998',
    };

    const result = extractEcommerceFields(payload);

    expect(result.price).toBe(999);
    expect(result.quantity).toBe(2);
    expect(result.revenue).toBe(1998);
  });
});

describe('Session Info Extraction', () => {
  it('should extract session information', () => {
    const payload = {
      session_id: 'sess_abc123',
      channel: 'mobile_app',
      campaign: 'summer_sale',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'summer2025',
    };

    const result = extractSessionInfo(payload);

    expect(result.session_id).toBe('sess_abc123');
    expect(result.channel).toBe('mobile_app');
    expect(result.campaign).toBe('summer_sale');
    expect(result.utm_source).toBe('facebook');
    expect(result.utm_medium).toBe('cpc');
    expect(result.utm_campaign).toBe('summer2025');
  });

  it('should handle missing session fields', () => {
    const payload = {
      session_id: 'sess_123',
    };

    const result = extractSessionInfo(payload);

    expect(result.session_id).toBe('sess_123');
    expect(result.channel).toBeNull();
    expect(result.utm_source).toBeNull();
  });
});

