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
  phoneNumber: { type: String, trim: true },
  club: { type: String, trim: true },
  experience: { type: String },
  profilePhotoUrl: { type: String }, // URL from cloud storage
  otherProfileInfo: { type: String },
  awards: [{ type: String }], // Array of strings for awards
  judgingStyle: { type: String, trim: true },
  isTestAccount: {
    type: Boolean,
    default: false
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
  notifications: [{
    type: {
      type: String,
      enum: ['game_assignment', 'evaluation_request', 'system_notice'],
      required: true
    },
    debate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debate'
    },
    posting: mongoose.Schema.Types.ObjectId,
    message: {
      type: String,
      required: true
    },
    seen: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isFirstOrganizer: {
    type: Boolean,
    default: false
  },
  notificationSettings: {
    friend_request_sent: { type: Boolean, default: true },
    friend_request_accepted: { type: Boolean, default: true },
    game_assignment: { type: Boolean, default: true },
    evaluation_submitted: { type: Boolean, default: true },
    system_alert: { type: Boolean, default: true },
    new_message: { type: Boolean, default: true },
    // Add defaults for any other types defined in Notification schema
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