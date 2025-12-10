/**
 * Experiment Controller
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import {
  createExperiment as createExperimentService,
  assignVariant as assignVariantService,
  recordConversion as recordConversionService,
  getExperimentResults as getExperimentResultsService,
  listExperiments as listExperimentsService,
} from '../services/experimentService';

const logger = createLogger({
  service: 'experiment-controller',
});

export async function createExperiment(req: Request, res: Response) {
  try {
    const { name, description, variants, traffic_split, start_date, end_date } = req.body;

    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({
        error: { message: 'name and variants (min 2) are required', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Creating experiment', { name });

    const experiment = await createExperimentService({
      name,
      description,
      variants,
      traffic_split: traffic_split || {},
      start_date,
      end_date,
    });

    res.json({
      experiment,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create experiment', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to create experiment', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function assignVariant(req: Request, res: Response) {
  try {
    const { experiment_id } = req.params;
    const { profile_id } = req.body;

    if (!profile_id) {
      return res.status(400).json({
        error: { message: 'profile_id is required', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Assigning variant', { experiment_id, profile_id });

    const assignment = await assignVariantService(experiment_id, profile_id);

    res.json({
      experiment_id,
      profile_id,
      variant: assignment,
      assigned_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to assign variant', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to assign variant', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function recordConversion(req: Request, res: Response) {
  try {
    const { experiment_id } = req.params;
    const { profile_id, conversion_type, value } = req.body;

    if (!profile_id || !conversion_type) {
      return res.status(400).json({
        error: { message: 'profile_id and conversion_type are required', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Recording conversion', { experiment_id, profile_id, conversion_type });

    await recordConversionService(experiment_id, profile_id, conversion_type, value);

    res.json({
      experiment_id,
      profile_id,
      conversion_type,
      recorded_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to record conversion', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to record conversion', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function getExperimentResults(req: Request, res: Response) {
  try {
    const { experiment_id } = req.params;

    logger.info('Fetching experiment results', { experiment_id });

    const results = await getExperimentResultsService(experiment_id);

    res.json({
      experiment_id,
      results,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch experiment results', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to fetch experiment results', code: 'INTERNAL_ERROR' },
    });
  }
}

export async function listExperiments(req: Request, res: Response) {
  try {
    logger.info('Listing experiments');

    const experiments = await listExperimentsService();

    res.json({
      experiments,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to list experiments', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to list experiments', code: 'INTERNAL_ERROR' },
    });
  }
}

