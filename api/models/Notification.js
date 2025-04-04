const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'friend_request_sent',
      'friend_request_accepted',
      'game_assignment',
      'evaluation_submitted',
      'system_alert',
      'new_message',
      // Add other specific types as needed
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // Optional deep link URL
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Notification', notificationSchema);