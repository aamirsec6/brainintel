/**
 * Experiment routes
 */
import { Router } from 'express';
import {
  createExperiment,
  assignVariant,
  recordConversion,
  getExperimentResults,
  listExperiments,
} from '../controllers/experimentController';

const router = Router();

router.post('/', createExperiment);
router.get('/', listExperiments);
router.get('/:experiment_id/results', getExperimentResults);
router.post('/:experiment_id/assign', assignVariant);
router.post('/:experiment_id/conversion', recordConversion);

export default router;

