import express from 'express';
import { getPanDetailsByUserId, upsertPanDetails, validatePanNumber } from '../controllers/panController.js';

const router = express.Router();

router.post('/', upsertPanDetails);
router.post('/validate', validatePanNumber);
router.get('/:userId', getPanDetailsByUserId);

export default router;
