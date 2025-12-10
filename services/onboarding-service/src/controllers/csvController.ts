/**
 * CSV Controller
 * Handles CSV upload and import
 */
import { Request, Response } from 'express';
import { createLogger } from '@retail-brain/logger';
import { parseCSV, detectColumns, importCustomersFromCSV } from '../services/csvService';

const logger = createLogger({ service: 'csv-controller' });

/**
 * Upload CSV file
 */
export async function uploadCSV(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file uploaded', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('CSV file uploaded', {
      filename: req.file.originalname,
      size: req.file.size,
    });

    // Parse CSV
    const rows = await parseCSV(req.file.path);

    // Auto-detect columns
    const columnMapping = detectColumns(rows[0]);

    res.json({
      filename: req.file.originalname,
      file_path: req.file.path, // Include the actual file path for import
      rows_count: rows.length,
      columns: Object.keys(rows[0] || {}),
      detected_mapping: columnMapping,
      preview: rows.slice(0, 5),
    });
  } catch (error) {
    logger.error('CSV upload failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to process CSV', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Preview CSV before import
 */
export async function previewCSV(req: Request, res: Response) {
  try {
    const { file_path, column_mapping } = req.body;

    const rows = await parseCSV(file_path);
    const preview = rows.slice(0, 10);

    res.json({
      total_rows: rows.length,
      preview,
      mapping: column_mapping,
    });
  } catch (error) {
    logger.error('CSV preview failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to preview CSV', code: 'INTERNAL_ERROR' },
    });
  }
}

/**
 * Import CSV data
 */
export async function importCSV(req: Request, res: Response) {
  try {
    const { file_path, column_mapping } = req.body;

    if (!file_path || !column_mapping) {
      return res.status(400).json({
        error: { message: 'Missing file_path or column_mapping', code: 'VALIDATION_ERROR' },
      });
    }

    logger.info('Starting CSV import', { file_path });

    const result = await importCustomersFromCSV(file_path, column_mapping);

    res.json({
      success: true,
      profiles_created: result.created,
      profiles_updated: result.updated,
      errors: result.errors,
      duration_ms: result.duration,
    });
  } catch (error) {
    logger.error('CSV import failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      error: { message: 'Failed to import CSV', code: 'INTERNAL_ERROR' },
    });
  }
}

