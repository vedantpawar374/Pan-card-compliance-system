import express from 'express';
import { getTasksByUserId, markTaskAsCompleted } from '../controllers/taskController.js';

const router = express.Router();

router.get('/:userId', getTasksByUserId);
router.put('/:taskId/complete', markTaskAsCompleted);

export default router;
