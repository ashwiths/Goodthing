import express from 'express';
import {
  startFocus,
  completeFocus,
  getFocusStats,
  getFocusHistory,
  getFocusStreaks,
  getFocusAnalytics
} from '../controllers/focusController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth token protection on all deep focus routes
router.use(protect);

router.post('/start', startFocus);
router.post('/complete', completeFocus);
router.get('/stats', getFocusStats);
router.get('/history', getFocusHistory);
router.get('/streaks', getFocusStreaks);
router.get('/analytics', getFocusAnalytics);

export default router;
