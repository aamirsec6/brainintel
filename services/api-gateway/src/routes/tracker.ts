/**
 * Tracker Script Route
 * Serves the JavaScript tracker SDK
 */
import { Router, Response, Request } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const router: Router = Router();

/**
 * GET /tracker.js
 * Serve the JavaScript tracker SDK
 */
router.get('/tracker.js', (req: Request, res: Response) => {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      join(__dirname, '../../../../apps/website-tracker/retail-brain-tracker.js'),
      join(__dirname, '../../../apps/website-tracker/retail-brain-tracker.js'),
      join(process.cwd(), 'apps/website-tracker/retail-brain-tracker.js'),
      join(process.cwd(), 'website-tracker/retail-brain-tracker.js'),
    ];
    
    let trackerPath = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        trackerPath = path;
        break;
      }
    }
    
    if (!trackerPath) {
      return res.status(404).json({
        error: {
          message: 'Tracker script not found',
          code: 'NOT_FOUND',
        },
      });
    }
    
    const trackerScript = readFileSync(trackerPath, 'utf-8');
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
    res.send(trackerScript);
    return;
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to serve tracker script',
        code: 'INTERNAL_ERROR',
      },
    });
    return;
  }
});

export default router;

