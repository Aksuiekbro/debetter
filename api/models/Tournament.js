const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  teams: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rounds: [{
    name: {
      type: String,
      required: true
    },
    matches: [{
      team1: {
        id: String,
        name: String
      },
      team2: {
        id: String,
        name: String
      },
      winner: {
        id: String,
        name: String
      },
      completed: {
        type: Boolean,
        default: false
      },
      scores: {
        team1: {
          type: Number,
          default: 0
        },
        team2: {
          type: Number,
          default: 0
        }
      },
      judgeScores: [{
        judge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        team1Score: {
          type: Number,
          default: 0
        },
        team2Score: {
          type: Number,
          default: 0
        },
        notes: String
      }]
    }]
  }],
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  winner: {
    id: String,
    name: String
  },
  mapUrl: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save hook to update the updatedAt field
TournamentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tournament', TournamentSchema); 