import express from 'express';
import { 
  signupUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  getMe 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signupUser);      // Mapping both signup and register to signupUser for compatibility
router.post('/register', signupUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

export default router;
