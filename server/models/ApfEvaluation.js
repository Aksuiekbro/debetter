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

const detailedSpeakerScoreSchema = new Schema({
  criteriaRatings: {
    type: Map,
    of: Number
  },
  feedback: {
    type: String
  },
  totalPoints: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

const teamCriteriaScoreSchema = new Schema({
  type: Map,
  of: Number
}, { _id: false });

const transcriptionSchema = new Schema({
  type: Map,
  of: String
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
  speakerScores: {
    leader_gov: detailedSpeakerScoreSchema,
    leader_opp: detailedSpeakerScoreSchema,
    speaker_gov: detailedSpeakerScoreSchema,
    speaker_opp: detailedSpeakerScoreSchema
  },
  teamScores: {
    team1: teamCriteriaScoreSchema,
    team2: teamCriteriaScoreSchema
  },
  transcriptions: transcriptionSchema,
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
    if (this.scores && this.scores[role]) {
      const { content, style, strategy } = this.scores[role];
      this.scores[role].totalScore = content + style + strategy;
    }
  });
  
  next();
});

module.exports = mongoose.model('ApfEvaluation', apfEvaluationSchema);