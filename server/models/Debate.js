const mongoose = require('mongoose');

const speakerAnalysisSchema = new mongoose.Schema({
  username: String,
  totalSpeakingTime: String,
  keyArguments: [{
    text: String,
    wasCountered: Boolean
  }],
  themes: [String]
});

const unaddressedArgumentSchema = new mongoose.Schema({
  speaker: String,
  argument: String
});

const factCheckSchema = new mongoose.Schema({
  statement: String,
  verification: String
});

const teamSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  side: {
    type: String,
    enum: ['proposition', 'opposition'],
    required: true
  }
});

const transcriptionSchema = new mongoose.Schema({
  speaker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  aiHighlights: {
    keyArguments: [String],
    statisticalClaims: [String],
    logicalConnections: [String]
  }
});

const roomSchema = new mongoose.Schema({
  judge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teams: [teamSchema],
  transcription: [transcriptionSchema],
  isActive: {
    type: Boolean,
    default: false
  }
});

const matchSchema = new mongoose.Schema({
  round: Number,
  matchNumber: Number,
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: roomSchema,
  completed: {
    type: Boolean,
    default: false
  }
});

const debateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
    enum: ['politics', 'technology', 'science', 'society', 'economics']
  },
  status: {
    type: String,
    required: true,
    lowercase: true,
    enum: ['upcoming', 'team-assignment', 'in-progress', 'completed'],
    default: 'upcoming'
  },
  difficulty: {
    type: String,
    required: true,
    lowercase: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  startDate: {
    type: Date,
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true,
    default: 6,
    min: 2
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  rooms: [roomSchema],
  teams: [teamSchema],
  startedAt: Date,
  endedAt: Date,
  analysis: {
    speakerAnalysis: {
      type: Map,
      of: speakerAnalysisSchema
    },
    unaddressedArguments: [unaddressedArgumentSchema],
    factCheck: [factCheckSchema],
    overallCoherence: String
  },
  format: {
    type: String,
    required: true,
    enum: ['standard', 'tournament'],
    default: 'standard'
  },
  mode: {
    type: String,
    required: true,
    enum: ['solo', 'duo'],
    default: 'solo'
  },
  tournamentRounds: [{
    roundNumber: Number,
    matches: [matchSchema]
  }],
  registrationDeadline: {
    type: Date
  },
  teamRegistrations: [{
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    registered: {
      type: Date,
      default: Date.now
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  }]
});

// Add index for better search performance
debateSchema.index({ title: 'text', description: 'text' });
// Add index for frequently filtered fields
debateSchema.index({ category: 1, status: 1, difficulty: 1 });
// Add index for sorting
debateSchema.index({ createdAt: -1 });
debateSchema.index({ startDate: 1 });

module.exports = mongoose.model('Debate', debateSchema);