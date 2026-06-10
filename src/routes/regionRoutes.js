import { Router } from 'express';
import { getRegion, listRegions } from '../controllers/regionController.js';

const router = Router();

router.get('/', listRegions);
router.get('/:regionCode', getRegion);

export default router;
