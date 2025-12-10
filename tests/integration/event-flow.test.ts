/**
 * Integration Test: Complete Event Flow
 * Tests the entire pipeline from event ingestion to profile resolution
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Event Flow Integration Test', () => {
  const API_BASE = 'http://localhost:3000';
  const API_KEY = 'test_api_key';

  test('should accept valid event', async () => {
    const response = await fetch(`${API_BASE}/v1/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'test',
        event_type: 'test_event',
        event_ts: new Date().toISOString(),
        identifiers: {
          phone: '+911234567890',
        },
        payload: {},
      }),
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.status).toBe('accepted');
    expect(data.event_id).toBeDefined();
  });

  test('should reject event without identifiers', async () => {
    const response = await fetch(`${API_BASE}/v1/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'test',
        event_type: 'test_event',
        event_ts: new Date().toISOString(),
        identifiers: {},
        payload: {},
      }),
    });

    expect(response.status).toBe(400);
  });

  test('should reject unauthorized request', async () => {
    const response = await fetch(`${API_BASE}/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'test',
        event_type: 'test',
        event_ts: new Date().toISOString(),
        identifiers: { phone: '+911234567890' },
        payload: {},
      }),
    });

    expect(response.status).toBe(401);
  });
});

