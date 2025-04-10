const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleItemSchema = new Schema({
  tournamentId: { // Reference to the Debate (Tournament)
    type: Schema.Types.ObjectId,
    ref: 'Debate', // Link to the Debate model
    required: true,
    index: true // Index for efficient querying by tournament
  },
  time: {
    type: Date,
    required: [true, 'Schedule item time is required']
  },
  eventDescription: {
    type: String,
    required: [true, 'Schedule item event description is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
    // Optional, might be virtual/online
  },
  createdBy: { // Track who created the item
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('ScheduleItem', scheduleItemSchema);