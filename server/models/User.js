const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'judge', 'organizer', 'admin'],
    default: 'user'
  },
  judgeRole: {
    type: String,
    enum: ['Head Judge', 'Judge', 'Assistant Judge'],
    required: function() {
      return this.role === 'judge';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  bio: String,
  debates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate'
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isFirstOrganizer: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for efficient querying
userSchema.index({ username: 1, email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to handle password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.isFirstOrganizer;
};

module.exports = mongoose.model('User', userSchema);