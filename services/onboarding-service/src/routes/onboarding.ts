/**
 * Onboarding routes
 */
import { Router } from 'express';
import multer from 'multer';
import { uploadCSV, previewCSV, importCSV } from '../controllers/csvController';
import { connectShopify, testConnection } from '../controllers/connectorController';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

/**
 * CSV Import
 */
router.post('/csv/upload', upload.single('file'), uploadCSV);
router.post('/csv/preview', previewCSV);
router.post('/csv/import', importCSV);

/**
 * Connectors
 */
router.post('/connect/shopify', connectShopify);
router.post('/connect/test', testConnection);

export default router;

