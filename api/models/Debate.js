const mongoose = require('mongoose');
const { Schema } = mongoose;

const baseSchemas = {
  team: { members: [{ type: Schema.Types.ObjectId, ref: 'User' }], side: { type: String, enum: ['proposition', 'opposition'], required: true } },
  transcription: {
    speaker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    aiHighlights: { keyArguments: [String], statisticalClaims: [String], logicalConnections: [String] }
  }
};

// Sub-schema for team members within embedded teams
const teamMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['leader', 'speaker'], required: true }
}, { _id: false }); // _id: false prevents Mongoose from creating an _id for subdocuments

// Sub-schema for round results
const roundResultSchema = new Schema({
  roundNumber: { type: Number, required: true },
  points: { type: Number, default: 0 },
  rank: { type: Number }, // Rank in this round (1st, 2nd, etc.)
  opponent: { type: Schema.Types.ObjectId }, // Reference to opponent team's _id
  judges: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  speakerPoints: { type: Number, default: 0 }, // Individual speaker points
  notes: { type: String },
  room: { type: String },
  side: { type: String, enum: ['proposition', 'opposition'] }
}, { _id: false });

// Sub-schema for embedded teams within a Debate
const embeddedTeamSchema = new Schema({
  name: { type: String, required: true },
  members: [teamMemberSchema],
  club: { type: String, trim: true },
  city: { type: String, trim: true },
  institution: { type: String, trim: true },
  isPresent: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  checkedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  roundResults: [roundResultSchema], // Results for each round
  totalSpeakerPoints: { type: Number, default: 0 }, // Total speaker points across all rounds
  averageRank: { type: Number, default: 0 }, // Average rank across all rounds
  breakingScore: { type: Number, default: 0 } // Calculated score for breaking (tiebreaker)
});


const roomSchema = new Schema({
  judge: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teams: [baseSchemas.team],
  transcription: [baseSchemas.transcription],
  isActive: Boolean
});

const matchSchema = new Schema({
  round: Number,
  matchNumber: Number,
  team1: { type: Schema.Types.ObjectId, ref: 'User' },
  team2: { type: Schema.Types.ObjectId, ref: 'User' },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  completed: Boolean,
  room: roomSchema
});

const postingSchema = new Schema({
  team1: { // Stores the _id of the embedded team object from Debate.teams
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  team2: { // Stores the _id of the embedded team object from Debate.teams
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  theme: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed'],
    default: 'scheduled'
  },
  round: { // Link to the tournament round
    type: Number,
    required: true
  },
  roundType: { // Type of round (preliminary or playoff)
    type: String,
    enum: ['preliminary', 'playoff'],
    default: 'preliminary'
  },
  matchNumber: { // Link to the match number within the round
    type: Number
  },
  winner: { // Stores the _id of the embedded team object from Debate.teams
    type: mongoose.Schema.Types.ObjectId
  },
  confirmed: { // Whether the posting has been confirmed by an organizer
    type: Boolean,
    default: false
  },
  published: { // Whether the posting has been published to participants
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ballot: {
    submitted: { type: Boolean, default: false },
    submittedAt: { type: Date },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    winner: { type: mongoose.Schema.Types.ObjectId }, // Reference to the winning team
    team1Score: { type: Number },
    team2Score: { type: Number },
    team1SpeakerPoints: { type: Number },
    team2SpeakerPoints: { type: Number },
    comments: { type: String },
    team1Comments: { type: String },
    team2Comments: { type: String },
    individualScores: { type: Schema.Types.Mixed },
    ballotNumber: { type: String }, // For tracking physical ballots
    motionUsed: { type: String }, // The actual motion/topic used
    participantFeedback: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comments: { type: String },
      submittedAt: { type: Date },
      rating: { type: Number, min: 1, max: 5 } // Optional rating
    }]
  },
  transcription: {
    full: String,
    summary: String
  },
  notifications: {
    judgesNotified: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  },
  recordedAudioUrl: { type: String }, // URL for the recorded audio file
  ballotImageUrl: { type: String } // URL for the uploaded ballot image
});

const debateSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, lowercase: true, enum: ['politics', 'technology', 'science', 'society', 'economics'] },
  status: { type: String, required: true, enum: ['upcoming', 'team-assignment', 'in-progress', 'completed'], default: 'upcoming' },
  difficulty: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  startDate: { type: Date, required: true },
  registrationDeadline: { type: Date },
  participants: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      tournamentRole: { type: String, enum: ['Debater', 'Judge', 'Observer', 'Organizer'], required: true, default: 'Debater' }, // Simplified roles
      teamId: { type: Schema.Types.ObjectId }, // Refers to _id in embedded teams array
      status: { type: String, enum: ['pending', 'registered', 'waitlisted', 'rejected'], default: 'pending' }, // Status of the participant in the tournament
      customFields: { type: Map, of: Schema.Types.Mixed }, // Store custom registration field values
      // Judge-specific fields
      club: { type: String, trim: true },
      judgeStatus: { type: String, trim: true }, // e.g., student year, judging experience
      judgeRank: { type: String, enum: ['Novice', 'Experienced', 'Expert', 'Head Judge'], default: 'Novice' }, // Judge ranking
      yearsExperience: { type: Number, min: 0 }, // Years of experience in debate
      courseLevel: { type: String, trim: true }, // Current course/level/year of study
      isPresent: { type: Boolean, default: false },
      checkedInAt: { type: Date },
      checkedInBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Added organizers array
  maxParticipants: { type: Number, default: function() { return this.format === 'tournament' ? 32 : 6; } },
  createdAt: { type: Date, default: Date.now },
  rooms: [roomSchema],
  teams: [embeddedTeamSchema], // Embed team data directly
  startedAt: Date,
  endedAt: Date,
  format: { type: String, enum: ['standard', 'tournament'], default: 'standard' },
  tournamentSettings: {
    maxDebaters: { type: Number, default: 32 },
    maxJudges: { type: Number, default: 8 },
    currentDebaters: { type: Number, default: 0 },
    currentJudges: { type: Number, default: 0 }
  },
  tournamentFormats: { type: [String], enum: ['APD', 'BP', 'LD', 'WSDC', 'Other'] }, // Expanded tournament format options
  leagueType: { type: String, enum: ['school', 'university', 'open', 'other'], default: 'open' }, // Added league type
  customRegistrationFields: { type: Boolean, default: false }, // Flag to indicate if tournament has custom registration fields
  eligibilityCriteria: { type: String }, // Added for tournament eligibility rules
  mode: { type: String, enum: ['solo', 'duo'] },
  tournamentRounds: [{ roundNumber: Number, matches: [matchSchema] }],
  registrationDeadline: Date,
  teamRegistrations: [{
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    registered: { type: Date, default: Date.now },
    confirmed: Boolean
  }],
  requiredJudges: { type: Number, default: function() { return this.format === 'tournament' ? 8 : 3 } },
  maxJudges: { type: Number, default: function() { return this.format === 'tournament' ? 8 : 3; } },
  postings: [postingSchema],
  themes: [{ // Array to store tournament-specific themes/topics
    _id: { type: Schema.Types.ObjectId, auto: true }, // Auto-generate ID for each theme
    text: { type: String, required: true, trim: true }
  }],
  mapImageUrl: {
    type: String,
    trim: true,
    default: null
  },
}, {
  timestamps: true
});

// Add indexes for efficient querying
debateSchema.index({ format: 1, status: 1 });
debateSchema.index({ 'participants._id': 1 });
debateSchema.index({ 'creator': 1 });
debateSchema.index({ startDate: 1 });

debateSchema.pre('save', async function(next) {
  // console.log('Debate pre-save hook triggered. Format:', this.format); // Removed debug log
  if (this.format === 'tournament') {
    // Populate the userId within each participant object to access user details
    await this.populate({ path: 'participants.userId', model: 'User' });
    // Filter based on the tournamentRole stored directly in the participants array
    const debaters = this.participants.filter(p => p.tournamentRole === 'Debater');
    const judges = this.participants.filter(p => p.tournamentRole === 'Judge');
    Object.assign(this.tournamentSettings, { currentDebaters: debaters.length, currentJudges: judges.length });
    // console.log('Debaters:', debaters.length, 'Judges:', judges.length); // Removed debug log
    if (debaters.length > 32 || judges.length > 8) throw new Error('Tournament limits exceeded');
  }
  next();
});

debateSchema.methods = {
  canAcceptParticipant(userRole) {
    return this.format === 'tournament'
      ? (userRole === 'judge' ? this.tournamentSettings.currentJudges < 8 : this.tournamentSettings.currentDebaters < 32)
      : this.participants.length < this.maxParticipants;
  },
  validateParticipantCount() {
    return this.format === 'tournament'
      ? { isValid: this.tournamentSettings.currentDebaters <= 32 && this.tournamentSettings.currentJudges <= 8,
          currentCounts: { debaters: this.tournamentSettings.currentDebaters, judges: this.tournamentSettings.currentJudges },
          maxCounts: { debaters: 32, judges: 8 } }
      : { isValid: this.participants.length <= this.maxParticipants,
          currentCount: this.participants.length, maxCount: this.maxParticipants };
  },
  isFull() {
    if (this.format === 'tournament') {
      const debaterCount = this.participants.filter(p => p.role !== 'judge').length;
      const judgeCount = this.participants.filter(p => p.role === 'judge').length;
      return debaterCount >= 32 || judgeCount >= 8;
    }
    return this.participants.length >= this.maxParticipants;
  },
  getParticipantCounts() {
    const debaters = this.participants.filter(p => p.role !== 'judge');
    const judges = this.participants.filter(p => p.role === 'judge');
    return {
      debaters: debaters.length,
      judges: judges.length,
      maxDebaters: this.format === 'tournament' ? 32 : this.maxParticipants,
      maxJudges: this.format === 'tournament' ? 8 : 3
    };
  },
  initializeTournamentBracket() {
    if (this.format !== 'tournament') return;

    // Get all debaters (non-judge participants)
    const debaters = this.participants.filter(p => p.role !== 'judge');

    // Shuffle debaters randomly
    const shuffledDebaters = [...debaters].sort(() => Math.random() - 0.5);

    // Initialize rounds (5 rounds for 32 participants: Round of 32, 16, 8, 4, and Finals)
    this.tournamentRounds = Array.from({ length: 5 }, (_, i) => ({
      roundNumber: i + 1,
      matches: []
    }));

    // Create initial matches for Round of 32
    for (let i = 0; i < shuffledDebaters.length; i += 2) {
      this.tournamentRounds[0].matches.push({
        round: 1,
        matchNumber: Math.floor(i/2) + 1,
        team1: shuffledDebaters[i]?._id || null,
        team2: shuffledDebaters[i + 1]?._id || null,
        completed: false
      });
    }

    // Set status to team-assignment once bracket is initialized
    this.status = 'team-assignment';
  },

  validateTournamentStart() {
    if (this.format !== 'tournament') return true;

    const counts = this.getParticipantCounts();
    return counts.debaters === 32 && counts.judges >= 3;
  }
};

debateSchema.index({ title: 'text', description: 'text', category: 1, status: 1, difficulty: 1, createdAt: -1, startDate: 1 });

module.exports = mongoose.model('Debate', debateSchema);
