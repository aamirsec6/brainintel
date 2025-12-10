/**
 * Connector Routes
 */
import { Router } from 'express';
import { connectorController } from '../controllers/connectorController';

const router = Router();

// List all connectors
router.get('/', connectorController.listConnectors);

// Get connector by ID
router.get('/:id', connectorController.getConnector);

// Create connector
router.post('/', connectorController.createConnector);

// Update connector
router.put('/:id', connectorController.updateConnector);

// Delete connector
router.delete('/:id', connectorController.deleteConnector);

// Trigger manual sync
router.post('/:id/sync', connectorController.triggerSync);

// Get sync status
router.get('/:id/sync/status', connectorController.getSyncStatus);

export default router;

