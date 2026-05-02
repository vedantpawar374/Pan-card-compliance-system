import express from 'express';
import { getLatestAnalysisByUserId } from '../controllers/analysisController.js';

const router = express.Router();

router.get('/:userId', getLatestAnalysisByUserId);

export default router;
