require('dotenv').config();
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { generateBrackets } = require('./simulateTournament');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Kazakh team names
const kazakhTeamNames = [
  'Astana Arystandary', 'Almaty Barsy', 'Shymkent Samgauy', 
  'Karagandy Karplar', 'Aktobe Akzhayiktar', 'Atyrau Arlandary',
  'Oskemen Onzhortalary', 'Pavlodar Pertsendy', 'Taraz Tulpary',
  'Kostanay Koblany', 'Aktau Arlandary', 'Semey Sunkary',
  'Kyzylorda Kyzgaldaky', 'Turkistan Tulpary', 'Petropavl Peri',
  'Kokshetau Koktemy'
];

async function createTournament() {
  try {
    // Find judges with Kazakh names (let's assume they have already been created)
    const judges = await User.find({ 
      role: 'judge',
      $or: [
        { name: { $regex: /[әғқңөұүі]/i } },  // Kazakh-specific letters
        { surname: { $regex: /[әғқңөұүі]/i } },
        { name: { $regex: /(ov|ova|ev|eva)$/i, $not: { $regex: /^(ivanov|petrov|sidorov)/i } } }, // Kazakh surnames with Russian endings
        { surname: { $regex: /(ov|ova|ev|eva)$/i, $not: { $regex: /^(ivanov|petrov|sidorov)/i } } }
      ]
    }).limit(5);

    if (judges.length < 3) {
      // console.log('Not enough judges found, creating with default judges'); // Removed info log
    }

    // Create teams (in reality these would be actual user records)
    const teams = kazakhTeamNames.map(name => ({
      id: mongoose.Types.ObjectId().toString(),
      name: name
    }));

    // Generate tournament brackets
    const rounds = generateBrackets(teams);

    // Create the tournament
    const tournament = new Tournament({
      name: 'Qamqor Cup',
      description: 'Annual national tournament for programming excellence',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: 'Astana, Kazakhstan',
      teams: teams,
      judges: judges.map(judge => judge._id),
      rounds: rounds,
      status: 'upcoming'
    });

    await tournament.save();
    // console.log('Tournament created successfully:', tournament._id); // Removed success log
    
    // Print some info about the tournament
    // console.log(`Created "${tournament.name}" with ${teams.length} teams and ${judges.length} judges`); // Removed summary log
    // console.log(`Tournament structure: ${tournament.rounds.length} rounds with a total of ${tournament.rounds.reduce((sum, round) => sum + round.matches.length, 0)} matches`); // Removed summary log

  } catch (error) {
    console.error('Error creating tournament:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Only run the function if the script is executed directly
if (require.main === module) {
  createTournament();
}