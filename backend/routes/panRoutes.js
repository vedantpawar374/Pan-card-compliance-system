import express from 'express';
import { getPanDetailsByUserId, upsertPanDetails } from '../controllers/panController.js';

const router = express.Router();

router.post('/', upsertPanDetails);
router.get('/:userId', getPanDetailsByUserId);

export default router;
