/**
 * Pricing Routes
 */
import { Router } from 'express';
import { pricingController } from '../controllers/pricingController';

const router = Router();

// Get price for SKU
router.get('/sku/:sku', pricingController.getPrice);

// Create pricing rule
router.post('/rules', pricingController.createRule);

// Update pricing rule
router.put('/rules/:id', pricingController.updateRule);

// Delete pricing rule
router.delete('/rules/:id', pricingController.deleteRule);

// Get pricing rules
router.get('/rules', pricingController.getRules);

// Get price history
router.get('/history/:sku', pricingController.getPriceHistory);

export default router;

