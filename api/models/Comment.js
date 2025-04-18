const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  announcement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
