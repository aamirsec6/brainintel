/**
 * Inventory Routes
 */
import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController';

const router = Router();

// Get inventory by SKU
router.get('/sku/:sku', inventoryController.getBySku);

// Get inventory by channel
router.get('/channel/:channel', inventoryController.getByChannel);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStock);

// Update inventory
router.put('/:id', inventoryController.updateInventory);

// Reserve inventory
router.post('/:id/reserve', inventoryController.reserveInventory);

// Release reserved inventory
router.post('/:id/release', inventoryController.releaseInventory);

// Get inventory history
router.get('/:id/history', inventoryController.getHistory);

// Bulk update
router.post('/bulk-update', inventoryController.bulkUpdate);

export default router;

