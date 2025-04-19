const mongoose = require('mongoose');

const PairingSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: [true, 'Tournament is required']
  },
  round: {
    type: Number,
    required: [true, 'Round number is required']
  },
  roundType: {
    type: String,
    enum: ['preliminary', 'playoff'],
    default: 'preliminary'
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team 1 is required']
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: String
  },
  isBye: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  result: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    team1Score: {
      type: Number,
      default: 0
    },
    team2Score: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
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

// Update the updatedAt field on save
PairingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Pairing', PairingSchema);
