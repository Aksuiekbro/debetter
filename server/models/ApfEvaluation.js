const mongoose = require('mongoose');
const { Schema } = mongoose;

const speakerScoreSchema = new Schema({
  content: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  style: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strategy: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 300
  }
}, { _id: false });

const apfEvaluationSchema = new Schema({
  debateId: {
    type: Schema.Types.ObjectId,
    ref: 'Debate',
    required: true
  },
  judgeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: {
    leaderGovernment: speakerScoreSchema,
    leaderOpposition: speakerScoreSchema,
    speakerGovernment: speakerScoreSchema,
    speakerOpposition: speakerScoreSchema
  },
  winningTeam: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  notes: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total score before saving
apfEvaluationSchema.pre('save', function(next) {
  const roles = ['leaderGovernment', 'leaderOpposition', 'speakerGovernment', 'speakerOpposition'];
  
  roles.forEach(role => {
    if (this.scores[role]) {
      const { content, style, strategy } = this.scores[role];
      this.scores[role].totalScore = content + style + strategy;
    }
  });
  
  next();
});

module.exports = mongoose.model('ApfEvaluation', apfEvaluationSchema);