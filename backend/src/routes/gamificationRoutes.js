import express from 'express';
import {
  getStreak,
  updateStreak,
  getAchievements,
  getProductivityScore,
  getBadges
} from '../controllers/gamificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce token protection on all gamification routes
router.use(protect);

router.get('/streak', getStreak);
router.post('/streak/update', updateStreak);
router.get('/achievements', getAchievements);
router.get('/productivity-score', getProductivityScore);
router.get('/badges', getBadges);

export default router;
