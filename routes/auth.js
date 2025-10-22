const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const College = require('../models/College');
const { protect, generateToken } = require('../middleware/auth');

/**
 * @route   GET /api/colleges
 * @desc    Get list of all colleges
 * @access  Public
 */
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find({}, 'name _id').sort({ name: 1 });
    
    res.json({
      success: true,
      count: colleges.length,
      data: colleges
    });
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching colleges'
    });
  }
});

/**
 * @route   POST /api/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('collegeId')
    .notEmpty()
    .withMessage('College selection is required')
    .isMongoId()
    .withMessage('Invalid college ID')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, email, password, collegeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Verify college exists and get domain
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college selected'
      });
    }

    // Validate email domain matches college domain
    const emailDomain = email.split('@')[1];
    if (emailDomain !== college.domain) {
      return res.status(400).json({
        success: false,
        message: `Email domain must be @${college.domain} for ${college.name}`
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      college: collegeId
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: college.name,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

/**
 * @route   POST /api/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email, password } = req.body;

    // Find user with password field (explicitly select it)
    const user = await User.findOne({ email }).select('+password').populate('college', 'name domain');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college.name,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @route   POST /api/colleges
 * @desc    Add a new college (Admin only)
 * @access  Private
 */
router.post('/colleges', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('College name must be between 2 and 200 characters'),
  body('domain')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Domain must be between 3 and 100 characters')
    .matches(/^[a-z0-9.-]+\.[a-z]{2,}$/)
    .withMessage('Invalid domain format')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, domain } = req.body;

    // Check if college already exists
    const existingCollege = await College.findOne({
      $or: [
        { name: name },
        { domain: domain.toLowerCase() }
      ]
    });

    if (existingCollege) {
      return res.status(400).json({
        success: false,
        message: 'College with this name or domain already exists'
      });
    }

    // Create new college
    const college = await College.create({
      name: name.trim(),
      domain: domain.toLowerCase().trim()
    });

    res.status(201).json({
      success: true,
      message: 'College added successfully',
      data: {
        _id: college._id,
        name: college.name,
        domain: college.domain
      }
    });
  } catch (error) {
    console.error('Add college error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding college'
    });
  }
});

/**
 * @route   GET /api/user/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/user/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        college: req.user.college,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
});

module.exports = router;

