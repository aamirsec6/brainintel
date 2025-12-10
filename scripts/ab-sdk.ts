#!/usr/bin/env ts-node
/**
 * Lightweight A/B testing helper for Node/TS
 * - Create experiments
 * - Assign variants
 * - Record conversions
 * - Fetch results
 *
 * Usage:
 *   ts-node scripts/ab-sdk.ts
 *   (or import functions into your app)
 */

type TrafficSplit = Record<string, number>;

interface ExperimentInput {
  name: string;
  description?: string;
  variants: string[];
  traffic_split?: TrafficSplit;
  start_date?: string;
  end_date?: string;
}

const API = process.env.API_GATEWAY_URL || 'http://localhost:3000';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

export async function createExperiment(input: ExperimentInput) {
  return api('/v1/ab-testing/experiments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function assignVariant(experimentId: string, profileId: string) {
  return api(`/v1/ab-testing/experiments/${experimentId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
  });
}

export async function recordConversion(
  experimentId: string,
  profileId: string,
  conversionType: string,
  value?: number
) {
  return api(`/v1/ab-testing/experiments/${experimentId}/conversion`, {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId, conversion_type: conversionType, value }),
  });
}

export async function getResults(experimentId: string) {
  return api(`/v1/ab-testing/experiments/${experimentId}/results`);
}

// Simple demo when run directly
if (require.main === module) {
  (async () => {
    console.log('Running A/B helper demo against', API);
    const exp = await createExperiment({
      name: 'Demo Subject Line Test',
      variants: ['A', 'B'],
      traffic_split: { A: 50, B: 50 },
    });
    const expId = exp.experiment?.id || exp.id;
    console.log('Experiment created:', expId);

    const assignment = await assignVariant(expId, 'demo-profile-1');
    console.log('Assigned variant:', assignment);

    await recordConversion(expId, 'demo-profile-1', 'purchase', 1000);
    console.log('Conversion recorded');

    const results = await getResults(expId);
    console.log('Results:', JSON.stringify(results, null, 2));
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

