const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    unique: true,
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Email domain is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Validate domain format (e.g., cec.ac.in)
        return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v);
      },
      message: props => `${props.value} is not a valid domain!`
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
collegeSchema.index({ domain: 1 });

module.exports = mongoose.model('College', collegeSchema);

