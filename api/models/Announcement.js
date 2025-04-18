const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate', // Assuming 'Debate' model holds tournament info as per context
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  backgroundColor: {
    type: String,
    trim: true,
    default: '#ffffff', // Default white background
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Optional: Add fields like 'isPublished', 'scheduledTime' if needed later
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;