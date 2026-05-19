import express from 'express';
import { getProgressAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication
router.use(protect);

router.get('/progress', getProgressAnalytics);

export default router;
