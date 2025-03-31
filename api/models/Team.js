const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Team schema
const teamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'speaker'],
      required: true
    }
  }],
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Add timestamps for createdAt and updatedAt
});

// Add index for efficient querying by name
teamSchema.index({ name: 1 });

// Register the model
module.exports = mongoose.model('Team', teamSchema);