const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required for access control'],
    index: true // Critical for access control queries
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true,
    enum: {
      values: ['1', '2', '3', '4', '5', '6', '7', '8'],
      message: 'Semester must be between 1 and 8'
    }
  },
  course: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient filtering
fileSchema.index({ college: 1, semester: 1 });
fileSchema.index({ college: 1, course: 1 });
fileSchema.index({ college: 1, uploader: 1 });
fileSchema.index({ college: 1, uploadDate: -1 });

// Text index for search functionality
fileSchema.index({ fileName: 'text', description: 'text' });

module.exports = mongoose.model('File', fileSchema);

