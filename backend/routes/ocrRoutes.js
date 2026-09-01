import express from 'express';
import multer from 'multer';
import { extractPanFromImage } from '../controllers/ocrController.js';

const router = express.Router();
const upload = multer({ dest: 'backend/uploads/' });

router.post('/upload', upload.single('pan_image'), extractPanFromImage);

export default router;
