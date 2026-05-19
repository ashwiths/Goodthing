import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import FocusStats from '../models/FocusStats.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Register a new user (pure MongoDB)
// @route   POST /api/auth/register
// @access  Public
export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    console.log(`[Auth Register] Creating new user profile in MongoDB for: ${email}`);
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });
    console.log(`[Auth Register] MongoDB user profile created successfully. ID: ${user._id}`);

    if (user) {
      // Pre-create blank UserStats and FocusStats default records to avoid duplicate conflict errors
      try {
        await Promise.all([
          UserStats.create({ user: user._id }),
          FocusStats.create({ user: user._id })
        ]);
        console.log(`[Auth Register] Automatically pre-created UserStats and FocusStats records for user ${user._id}`);
      } catch (statsErr) {
        console.error(`[Auth Register] Non-blocking stats creation warning for user ${user._id}:`, statsErr);
      }

      // 5. Generate token & response
      console.log(`[Auth Register] Generating JWT token for user ID: ${user._id}`);
      const token = generateToken(user._id);
      console.log(`[Auth Register] JWT generated successfully for user: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully ✅',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          accentColor: user.accentColor,
          darkMode: user.darkMode
        },
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token (pure MongoDB)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate token & response
    console.log(`[Auth Login] Login succeeded for ${email}. Generating JWT...`);
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful ✅',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        accentColor: user.accentColor,
        darkMode: user.darkMode
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Generate password reset verification code & send email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Generate a secure 6-character alphanumeric reset token/code
    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "9A3E7B"

    // Hash the token and save to user document with a 10-minute expiry
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await user.save();
    console.log(`[Auth Forgot] Saved reset code hash for user ${user._id}, valid for 10 minutes.`);

    // Send email with the reset code
    try {
      await sendEmail({
        email: user.email,
        code: resetCode,
      });
      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email 📩'
      });
    } catch (mailErr) {
      console.error('[Auth Forgot] Email sending error:', mailErr);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Verify reset code and update user password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body; // 'token' represents the 6-character code entered

    if (!email || !token || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Hash the input code/token to match against the stored SHA256 hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim().toUpperCase())
      .digest('hex');

    // Find user with matching hashed token and an unexpired timeline
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset credentials
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();
    console.log(`[Auth Reset] Password updated successfully for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully ✅'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user profile (JWT protected)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
