require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Tournament ID from the URL
const TOURNAMENT_ID = '67e9100f4510e481c2667079';

// Read the tournament data from JSON file
const tournamentData = JSON.parse(fs.readFileSync('./qamqorCupData.json', 'utf8'));

// Connect to MongoDB with all required options from server.js
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  ssl: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  updateTournament();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Function to update the tournament
const updateTournament = async () => {
  try {
    
    // Define Tournament model schema
    const tournamentSchema = new mongoose.Schema({
      name: String,
      description: String,
      startDate: Date,
      endDate: Date,
      location: String,
      teams: [{
        id: String,
        name: String
      }],
      judges: [mongoose.Schema.Types.ObjectId],
      rounds: [{
        name: String,
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
          completed: Boolean,
          scores: {
            team1: Number,
            team2: Number
          }
        }]
      }],
      status: String,
      winner: {
        id: String,
        name: String
      }
    });
    
    // Check if model is already registered
    const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema);
    
    // Update the tournament
    const result = await Tournament.findByIdAndUpdate(
      TOURNAMENT_ID,
      {
        teams: tournamentData.teams,
        rounds: tournamentData.rounds,
        status: tournamentData.status,
        winner: tournamentData.winner
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error('Tournament not found');
    }
    
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating tournament:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}; 