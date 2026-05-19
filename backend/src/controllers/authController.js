import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import FocusStats from '../models/FocusStats.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';

// @desc    Register a new user
// @route   POST /api/auth/signup
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
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      // Pre-create blank UserStats and FocusStats default records to avoid E11000 duplicate upsert conflicts
      try {
        await Promise.all([
          UserStats.create({ user: user._id }),
          FocusStats.create({ user: user._id })
        ]);
        console.log(`[Auth Signup] Automatically pre-created UserStats and FocusStats records for user ${user._id}`);
      } catch (statsErr) {
        console.error(`[Auth Signup] Non-blocking stats creation warning for user ${user._id}:`, statsErr);
      }

      // 5. Generate token & response
      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully ✅',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          accentColor: user.accentColor,
          darkMode: user.darkMode,
        },
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Register a user signed up via Firebase Auth
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, firebaseUid, provider } = req.body;

    // 1. Validation
    if (!name || !email || !firebaseUid || !provider) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // 3. Create user
    console.log(`[Auth Register] Creating new user profile in MongoDB for: ${email}`);
    const user = await User.create({
      name,
      email,
      firebaseUid,
      provider,
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

      // 4. Generate token & response
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
          darkMode: user.darkMode,
          provider: user.provider,
        },
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password, firebaseUid, provider } = req.body;

    // 1. Firebase Provider Authentication Sync
    if (provider === 'firebase' && firebaseUid) {
      console.log(`[Auth Login] Syncing Firebase login for email: ${email}, UID: ${firebaseUid}`);
      let user = await User.findOne({ $or: [{ firebaseUid }, { email }] });
      if (!user) {
        console.warn(`[Auth Login] Sync failed: User profile not found in MongoDB for email ${email}`);
        return res.status(401).json({ error: 'Invalid credentials or user not found' });
      }

      // Automatically link firebaseUid and update provider if not set yet (legacy migration)
      if (!user.firebaseUid || user.provider !== 'firebase') {
        user.firebaseUid = firebaseUid;
        user.provider = 'firebase';
        await user.save();
        console.log(`[Auth Login] Automatically linked legacy user ${user._id} to Firebase UID ${firebaseUid}`);
      }

      console.log(`[Auth Login] Generating JWT token for user ID: ${user._id}`);
      const token = generateToken(user._id);
      console.log(`[Auth Login] JWT generated successfully for user: ${email}`);

      return res.status(200).json({
        success: true,
        message: 'Login successful ✅',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          accentColor: user.accentColor,
          darkMode: user.darkMode,
          provider: user.provider,
        },
      });
    }

    // 2. Standard Local bcrypt authentication
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token & response
    console.log(`[Auth Login] Local login succeeded for ${email}. Generating JWT...`);
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
        darkMode: user.darkMode,
        provider: user.provider,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
