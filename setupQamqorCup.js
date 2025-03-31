require('dotenv').config();
const mongoose = require('mongoose');
const Tournament = require('./api/models/Tournament');

// Tournament ID from the URL
const TOURNAMENT_ID = '67e9100f4510e481c2667079';

// Function to generate team names
const generateTeamNames = () => [
  "Aibek's Team",
  "Nurlan's Team",
  "Kairat's Team",
  "Sanzhar's Team",
  "Azamat's Team",
  "Timur's Team",
  "Ruslan's Team",
  "Marat's Team",
  "Damir's Team",
  "Olzhas's Team",
  "Galymzhan's Team",
  "Yerlan's Team",
  "Serik's Team",
  "Berik's Team",
  "Kanat's Team",
  "Askhat's Team"
];

// Function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Function to generate brackets from teams
const generateBrackets = (teams) => {
  // Shuffle teams for random seeding
  const shuffledTeams = shuffleArray(teams);
  
  // Calculate the number of rounds needed
  const numTeams = shuffledTeams.length;
  const numRounds = Math.ceil(Math.log2(numTeams));
  
  // Calculate the total number of teams needed for a perfect bracket (power of 2)
  const perfectBracketSize = Math.pow(2, numRounds);
  
  // Create the bracket structure
  const rounds = [];
  
  // Create the first round with actual teams
  const firstRound = {
    name: 'Round 1',
    matches: []
  };
  
  // Fill the first round with matches
  for (let i = 0; i < perfectBracketSize; i += 2) {
    // Create a match object
    const match = {
      team1: i < numTeams ? shuffledTeams[i] : null,
      team2: i + 1 < numTeams ? shuffledTeams[i + 1] : null,
      winner: null,
      completed: false,
      scores: { team1: 0, team2: 0 }
    };
    
    // If one team is missing, the other team advances automatically
    if (match.team1 && !match.team2) {
      match.winner = match.team1;
      match.completed = true;
    } else if (!match.team1 && match.team2) {
      match.winner = match.team2;
      match.completed = true;
    }
    
    firstRound.matches.push(match);
  }
  
  rounds.push(firstRound);
  
  // Create subsequent rounds with empty matches
  for (let round = 1; round < numRounds; round++) {
    const roundName = round === numRounds - 1 ? 'Final' : 
                     round === numRounds - 2 ? 'Semifinals' : 
                     round === numRounds - 3 ? 'Quarterfinals' : 
                     `Round ${round + 2}`;
    
    const currentRound = {
      name: roundName,
      matches: []
    };
    
    // Number of matches in this round is half of the previous round
    const numMatches = Math.ceil(rounds[round - 1].matches.length / 2);
    
    for (let i = 0; i < numMatches; i++) {
      currentRound.matches.push({
        team1: null,
        team2: null,
        winner: null,
        completed: false,
        scores: { team1: 0, team2: 0 }
      });
    }
    
    rounds.push(currentRound);
  }
  
  return rounds;
};

// Function to simulate tournament results
const simulateTournamentResults = (rounds, teams) => {
  // Deep clone to avoid mutation issues
  const simulatedRounds = JSON.parse(JSON.stringify(rounds));
  
  // For each round
  for (let roundIndex = 0; roundIndex < simulatedRounds.length; roundIndex++) {
    const round = simulatedRounds[roundIndex];
    
    // Process each match in the round
    for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
      const match = round.matches[matchIndex];
      
      // Skip matches without both teams
      if (!match.team1 || !match.team2) continue;
      
      // Generate random scores between 70-95
      const team1Score = Math.floor(Math.random() * 26) + 70;
      const team2Score = Math.floor(Math.random() * 26) + 70;
      
      // Set scores
      match.scores.team1 = team1Score;
      match.scores.team2 = team2Score;
      
      // Determine winner based on scores
      if (team1Score > team2Score) {
        match.winner = match.team1;
      } else if (team2Score > team1Score) {
        match.winner = match.team2;
      } else {
        // In case of a tie, use a coin toss
        match.winner = Math.random() > 0.5 ? match.team1 : match.team2;
      }
      
      match.completed = true;
      
      // Update next round if this isn't the final round
      if (roundIndex < simulatedRounds.length - 1) {
        const nextRound = simulatedRounds[roundIndex + 1];
        const nextMatchIndex = Math.floor(matchIndex / 2);
        
        if (nextMatchIndex < nextRound.matches.length) {
          const nextMatch = nextRound.matches[nextMatchIndex];
          
          // Place winner in appropriate slot of next match
          if (matchIndex % 2 === 0) {
            nextMatch.team1 = match.winner;
          } else {
            nextMatch.team2 = match.winner;
          }
        }
      }
    }
  }
  
  // Set the tournament winner (winner of the final match)
  const finalRound = simulatedRounds[simulatedRounds.length - 1];
  const finalMatch = finalRound.matches[0];
  
  return {
    simulatedRounds,
    winner: finalMatch.winner
  };
};

// Main function to set up the tournament
const setupQamqorCup = async () => {
  try {
    // Connect to MongoDB with all required options from server.js
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      ssl: true,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB');

    // Find tournament by ID
    const tournament = await Tournament.findById(TOURNAMENT_ID);
    if (!tournament) {
      throw new Error(`Tournament with ID ${TOURNAMENT_ID} not found`);
    }
    console.log(`Found tournament: ${tournament.name}`);

    // Create 16 teams with unique names
    const teamNames = generateTeamNames();
    const teams = teamNames.map((name, index) => ({
      id: `team${index + 1}`,
      name: name
    }));
    console.log(`Created ${teams.length} teams`);

    // Generate bracket
    const rounds = generateBrackets(teams);
    console.log(`Generated ${rounds.length} tournament rounds`);

    // Simulate tournament results
    const { simulatedRounds, winner } = simulateTournamentResults(rounds, teams);
    console.log(`Simulated tournament results. Winner: ${winner.name}`);

    // Update tournament with teams and rounds
    tournament.teams = teams;
    tournament.rounds = simulatedRounds;
    tournament.winner = winner;
    tournament.status = 'completed';

    // Save tournament
    await tournament.save();
    console.log('Tournament updated successfully');

    console.log('Qamqor Cup setup complete!');
  } catch (error) {
    console.error('Error setting up Qamqor Cup:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script
setupQamqorCup();
