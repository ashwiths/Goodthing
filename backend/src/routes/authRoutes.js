import express from 'express';
import { signupUser, loginUser, registerUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
