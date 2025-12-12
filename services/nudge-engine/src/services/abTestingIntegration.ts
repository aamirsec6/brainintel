/**
 * A/B Testing Integration for Nudge Engine
 * Allows testing different nudge variants (templates, discounts, messaging)
 */
import axios from 'axios';
import { getConfig } from '@retail-brain/config';
import { createLogger } from '@retail-brain/logger';

const logger = createLogger({
  service: 'nudge-ab-integration',
});

const config = getConfig();
const AB_TESTING_URL = process.env.AB_TESTING_SERVICE_URL || 'http://localhost:3019';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

export interface ABTestVariant {
  variant: string;
  template?: string;
  personalization?: Record<string, any>;
  discount?: number;
  message?: string;
}

/**
 * Get or assign variant for a customer in an experiment
 */
export async function getVariantForProfile(
  experimentId: string,
  profileId: string
): Promise<string | null> {
  try {
    const response = await axios.post(
      `${API_GATEWAY_URL}/v1/ab-testing/experiments/${experimentId}/assign`,
      { profile_id: profileId },
      { timeout: 3000 }
    );
    return response.data.variant || null;
  } catch (error) {
    logger.warn('Failed to assign variant', {
      experimentId,
      profileId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Record conversion when customer responds to nudge
 */
export async function recordNudgeConversion(
  experimentId: string,
  profileId: string,
  conversionType: string = 'purchase',
  value?: number
): Promise<void> {
  try {
    await axios.post(
      `${API_GATEWAY_URL}/v1/ab-testing/experiments/${experimentId}/conversion`,
      {
        profile_id: profileId,
        conversion_type: conversionType,
        value,
      },
      { timeout: 3000 }
    );
    logger.info('Conversion recorded', { experimentId, profileId, conversionType, value });
  } catch (error) {
    logger.warn('Failed to record conversion', {
      experimentId,
      profileId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Apply A/B test variant to nudge personalization
 * Example: Test different discount amounts (10% vs 20%)
 */
export function applyVariantToNudge(
  basePersonalization: Record<string, any>,
  variant: string,
  variantConfig: Record<string, ABTestVariant>
): Record<string, any> {
  const variantData = variantConfig[variant];
  if (!variantData) {
    return basePersonalization;
  }

  // Merge variant-specific personalization
  return {
    ...basePersonalization,
    ...variantData.personalization,
    // Override discount if specified
    discount: variantData.discount ?? basePersonalization.discount,
    // Override message if specified
    message: variantData.message ?? basePersonalization.message,
    // Add variant info for tracking
    ab_variant: variant,
  };
}

/**
 * Example: Get variant config for discount testing
 */
export function getDiscountTestVariants(): Record<string, ABTestVariant> {
  return {
    A: {
      variant: 'A',
      discount: 10,
      personalization: {
        discount_message: 'Get 10% off your next purchase!',
      },
    },
    B: {
      variant: 'B',
      discount: 20,
      personalization: {
        discount_message: 'Get 20% off your next purchase!',
      },
    },
  };
}

/**
 * Example: Get variant config for messaging testing
 */
export function getMessagingTestVariants(): Record<string, ABTestVariant> {
  return {
    A: {
      variant: 'A',
      personalization: {
        urgency: 'low',
        message: 'We miss you! Come back and explore our latest collection.',
      },
    },
    B: {
      variant: 'B',
      personalization: {
        urgency: 'high',
        message: 'Limited time offer! Don\'t miss out on exclusive deals.',
      },
    },
  };
}

