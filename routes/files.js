const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const path = require('path');
const File = require('../models/File');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

/**
 * @route   POST /api/files/upload
 * @desc    Upload a new file
 * @access  Private
 */
router.post('/upload', protect, upload.single('file'), [
  body('semester')
    .notEmpty()
    .withMessage('Semester is required')
    .isIn(['1', '2', '3', '4', '5', '6', '7', '8'])
    .withMessage('Semester must be between 1 and 8'),
  body('course')
    .trim()
    .notEmpty()
    .withMessage('Course name is required')
    .isLength({ max: 100 })
    .withMessage('Course name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  try {
    const { semester, course, description } = req.body;

    // Generate file URL (in production, this would be S3/GCS URL)
    // For now, using local path as placeholder
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create file record with college from authenticated user
    const file = await File.create({
      college: req.user.college._id, // Critical: Use user's college for access control
      uploader: req.user._id,
      fileName: req.file.originalname,
      semester,
      course,
      description: description || '',
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date()
    });

    // Populate the file with uploader and college info
    await file.populate('uploader', 'name email');
    await file.populate('college', 'name');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

/**
 * @route   GET /api/files
 * @desc    Get files with college-based access control and optional filters
 * @access  Private
 */
router.get('/', protect, [
  query('semester')
    .optional()
    .isIn(['1', '2', '3', '4', '5', '6', '7', '8'])
    .withMessage('Invalid semester value'),
  query('course')
    .optional()
    .trim(),
  query('search_term')
    .optional()
    .trim(),
  query('myuploads')
    .optional()
    .isBoolean()
    .withMessage('myuploads must be true or false')
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
    // Build query with mandatory college filter for access control
    const query = {
      college: req.user.college._id // CRITICAL: Only files from user's college
    };

    // Optional filters
    if (req.query.semester) {
      query.semester = req.query.semester;
    }

    if (req.query.course) {
      // Case-insensitive exact match for course
      query.course = new RegExp(`^${req.query.course}$`, 'i');
    }

    if (req.query.myuploads === 'true') {
      query.uploader = req.user._id;
    }

    // Handle search term (case-insensitive search in fileName and description)
    if (req.query.search_term) {
      query.$or = [
        { fileName: new RegExp(req.query.search_term, 'i') },
        { description: new RegExp(req.query.search_term, 'i') }
      ];
    }

    // Execute query with population and sorting
    const files = await File.find(query)
      .populate('uploader', 'name email')
      .populate('college', 'name')
      .sort({ uploadDate: -1 }) // Most recent first
      .lean();

    res.json({
      success: true,
      count: files.length,
      filters: {
        college: req.user.college.name,
        semester: req.query.semester || 'all',
        course: req.query.course || 'all',
        myUploads: req.query.myuploads === 'true',
        searchTerm: req.query.search_term || 'none'
      },
      data: files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching files'
    });
  }
});

/**
 * @route   GET /api/files/:id
 * @desc    Get single file details with access control
 * @access  Private
 */
router.get('/:id', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid file ID')
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
    const file = await File.findById(req.params.id)
      .populate('uploader', 'name email')
      .populate('college', 'name domain');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // CRITICAL: Verify user has access to this file (same college)
    if (file.college._id.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access files from your college'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching file'
    });
  }
});

/**
 * @route   GET /api/files/:id/download
 * @desc    Download file with proper headers and access control
 * @access  Private
 */
router.get('/:id/download', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid file ID')
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
    const file = await File.findById(req.params.id)
      .populate('college', 'name domain');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // CRITICAL: Verify user has access to this file (same college)
    if (file.college._id.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only download files from your college'
      });
    }

    // Get the file path
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(file.fileUrl));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers to force download instead of opening in browser
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', file.fileType);
    res.setHeader('Content-Length', file.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading file'
        });
      }
    });

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading file'
    });
  }
});

module.exports = router;

