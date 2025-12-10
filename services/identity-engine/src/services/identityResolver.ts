/**
 * Identity Resolver
 * Main entry point for identity resolution
 */
import { createLogger } from '@retail-brain/logger';
import { normalizeIdentifiers } from '../../../event-collector/src/utils/normalize';
import { findExactMatches } from './exactMatcher';
import { findFuzzyMatches } from './fuzzyMatcher';
import { calculateScore } from './scoringEngine';
import { mergeProfiles } from './mergeService';
import { createProfile } from './profileService';
import { queueForReview } from './reviewQueueService';
import { identityConfig } from '@retail-brain/config';

const logger = createLogger({
  service: 'identity-resolver',
  level: process.env.LOG_LEVEL || 'info',
});

interface IdentityResolutionResult {
  profile_id: string;
  action: 'matched' | 'merged' | 'created' | 'queued_for_review';
  confidence_score?: number;
  matched_profiles?: string[];
}

/**
 * Resolve identity for an event
 */
export async function resolveIdentityForEvent(
  eventId: string,
  identifiers: Record<string, unknown>
): Promise<IdentityResolutionResult> {
  const startTime = Date.now();

  try {
    logger.info('Starting identity resolution', { event_id: eventId });

    // Step 1: Normalize identifiers
    const normalized = normalizeIdentifiers(identifiers);
    
    logger.debug('Identifiers normalized', {
      event_id: eventId,
      identifier_count: Object.keys(normalized).length,
    });

    // Step 2: Find exact matches
    const exactMatches = await findExactMatches(normalized);

    if (exactMatches.length === 1) {
      // Single exact match - use it
      const profileId = exactMatches[0];
      logger.info('Single exact match found', {
        event_id: eventId,
        profile_id: profileId,
        duration_ms: Date.now() - startTime,
      });

      return {
        profile_id: profileId,
        action: 'matched',
        confidence_score: 1.0,
      };
    }

    if (exactMatches.length > 1) {
      // Multiple exact matches - need to merge or score
      logger.info('Multiple exact matches found', {
        event_id: eventId,
        match_count: exactMatches.length,
      });

      // Score each pair and determine merge
      const scores = await Promise.all(
        exactMatches.slice(1).map(async (targetId) => ({
          source: exactMatches[0],
          target: targetId,
          score: await calculateScore(exactMatches[0], targetId, normalized),
        }))
      );

      // Find highest scoring pair
      const bestMatch = scores.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      if (bestMatch.score >= identityConfig.autoMergeThreshold) {
        // Auto-merge
        logger.info('Auto-merging profiles', {
          event_id: eventId,
          source: bestMatch.source,
          target: bestMatch.target,
          score: bestMatch.score,
        });

        const mergedProfileId = await mergeProfiles(
          bestMatch.source,
          bestMatch.target,
          bestMatch.score,
          'auto'
        );

        return {
          profile_id: mergedProfileId,
          action: 'merged',
          confidence_score: bestMatch.score,
          matched_profiles: [bestMatch.source, bestMatch.target],
        };
      } else if (bestMatch.score >= identityConfig.manualReviewThreshold) {
        // Queue for manual review
        logger.info('Queueing for manual review', {
          event_id: eventId,
          score: bestMatch.score,
        });

        await queueForReview(bestMatch.source, bestMatch.target, bestMatch.score);

        return {
          profile_id: bestMatch.source,
          action: 'queued_for_review',
          confidence_score: bestMatch.score,
          matched_profiles: [bestMatch.source, bestMatch.target],
        };
      }

      // Score too low - use first profile
      return {
        profile_id: exactMatches[0],
        action: 'matched',
        confidence_score: 1.0,
      };
    }

    // Step 3: No exact match - try fuzzy matching
    const fuzzyMatches = await findFuzzyMatches(normalized, identifiers);

    if (fuzzyMatches.length > 0) {
      // Calculate scores for fuzzy matches
      const scores = await Promise.all(
        fuzzyMatches.map(async (candidateId) => ({
          profile_id: candidateId,
          score: await calculateScore(null, candidateId, normalized),
        }))
      );

      // Find best match
      const bestMatch = scores.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      if (bestMatch.score >= identityConfig.autoMergeThreshold) {
        // High confidence fuzzy match - use it
        logger.info('High-confidence fuzzy match', {
          event_id: eventId,
          profile_id: bestMatch.profile_id,
          score: bestMatch.score,
        });

        return {
          profile_id: bestMatch.profile_id,
          action: 'matched',
          confidence_score: bestMatch.score,
        };
      } else if (bestMatch.score >= identityConfig.manualReviewThreshold) {
        // Medium confidence - create new and queue for review
        const newProfileId = await createProfile(normalized, identifiers);

        await queueForReview(newProfileId, bestMatch.profile_id, bestMatch.score);

        logger.info('Created new profile and queued for review', {
          event_id: eventId,
          new_profile_id: newProfileId,
          candidate_profile_id: bestMatch.profile_id,
          score: bestMatch.score,
        });

        return {
          profile_id: newProfileId,
          action: 'queued_for_review',
          confidence_score: bestMatch.score,
          matched_profiles: [newProfileId, bestMatch.profile_id],
        };
      }
    }

    // Step 4: No matches - create new profile
    const newProfileId = await createProfile(normalized, identifiers);

    logger.info('Created new profile', {
      event_id: eventId,
      profile_id: newProfileId,
      duration_ms: Date.now() - startTime,
    });

    return {
      profile_id: newProfileId,
      action: 'created',
    };
  } catch (error) {
    logger.error(
      'Identity resolution failed',
      error instanceof Error ? error : new Error(String(error)),
      { event_id: eventId }
    );
    throw error;
  }
}

