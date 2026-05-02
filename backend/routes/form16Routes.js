import express from 'express';
import { getLatestForm16ByUserId, saveForm16Details } from '../controllers/form16Controller.js';

const router = express.Router();

router.post('/', saveForm16Details);
router.get('/:userId', getLatestForm16ByUserId);

export default router;
