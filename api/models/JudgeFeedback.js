const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const judgeFeedbackSchema = new Schema({
  postingId: {
    type: Schema.Types.ObjectId,
    required: true,
    // Note: Direct ref to Debate.postings is complex. Storing ID and validating contextually.
    // ref: 'Debate.postings' // This is not standard Mongoose syntax for subdocuments.
    index: true,
  },
  tournamentId: {
    type: Schema.Types.ObjectId,
    ref: 'Debate', // Reference the main Debate document which contains postings
    required: true,
    index: true,
  },
  judgeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  criteriaRatings: {
    clarity: { type: Number, min: 1, max: 5 },
    fairness: { type: Number, min: 1, max: 5 },
    knowledge: { type: Number, min: 1, max: 5 },
    // Add other criteria as needed
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate feedback from the same participant for the same judge in the same posting
judgeFeedbackSchema.index({ postingId: 1, judgeId: 1, participantId: 1 }, { unique: true });

const JudgeFeedback = mongoose.model('JudgeFeedback', judgeFeedbackSchema);

module.exports = JudgeFeedback;