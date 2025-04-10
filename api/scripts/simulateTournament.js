require('dotenv').config();
const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');

// Tournament date constants
const TOURNAMENT_DATE = new Date('2025-02-15T09:00:00Z');

// Generate a time slot for matches within the tournament day
const getMatchTime = (round, matchNumber) => {
  // Start at 9 AM, each round is 2 hours later
  const hourOffset = (round - 1) * 2;
  return new Date(new Date(TOURNAMENT_DATE).setHours(9 + hourOffset, 0, 0));
};

// Generate a theme for the debate
const getDebateTheme = () => {
  const themes = [
    "This house would ban private healthcare",
    "This house believes social media does more harm than good",
    "This house would implement a universal basic income",
    "This house would abolish nuclear weapons",
    "This house believes democracy is in crisis",
    "This house would legalize all drugs",
    "This house supports mandatory voting",
    "This house believes AI will do more harm than good",
    "This house would implement a wealth tax",
    "This house believes in free higher education",
    "This house would ban animal testing",
    "This house believes the UN has failed",
    "This house would abolish the death penalty",
    "This house supports the right to be forgotten online",
    "This house would implement a four-day work week",
    "This house would ban the use of fossil fuels"
  ];
  return themes[Math.floor(Math.random() * themes.length)];
};

// Helper function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Create teams from a list of debaters
const createTeams = (debaters) => {
  const shuffledDebaters = shuffleArray([...debaters]);
  const teams = [];
  
  // For a tournament of 32 debaters, we'll have 16 teams (assuming duo mode)
  for (let i = 0; i < shuffledDebaters.length; i += 2) {
    const leader = shuffledDebaters[i];
    const speaker = shuffledDebaters[i + 1];
    
    if (leader && speaker) {
      teams.push({
        _id: new mongoose.Types.ObjectId(), // Generate new ObjectId for each team
        name: `Team ${Math.floor(i/2) + 1}`, 
        members: [
          { userId: leader._id, role: 'leader' },
          { userId: speaker._id, role: 'speaker' }
        ],
        wins: 0,
        losses: 0,
        points: 0
      });
    }
  }
  
  return teams;
};

// Generate tournament brackets from teams
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
      team1: i < numTeams ? shuffledTeams[i]._id : null, // Use Team ID
      team2: i + 1 < numTeams ? shuffledTeams[i + 1]._id : null, // Use Team ID
      winner: null,
      completed: false,
      scores: { team1: 0, team2: 0 }
    };
    
    // If one team is missing, the other team advances automatically
    if (match.team1 && !match.team2) {
      match.winner = match.team1; // Winner is still the ID here
      match.completed = true;
    } else if (!match.team1 && match.team2) {
      match.winner = match.team2; // Winner is still the ID here
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

// Create postings for the tournament
const createPostings = (tournament, judges, headJudgeId) => {
  const postings = [];
  const teams = tournament.teams;
  
  // Assign judges for each match in round 1
  for (let i = 0; i < tournament.tournamentRounds[0].matches.length; i++) {
    const match = tournament.tournamentRounds[0].matches[i];
    
    // Skip matches without teams
    if (!match.team1 || !match.team2) continue;
    
    // Assign judges, ensuring Head Judge is included
    const otherJudges = judges.filter(j => !j._id.equals(headJudgeId)); // Exclude head judge from random pool
    const shuffledOtherJudges = shuffleArray([...otherJudges]);
    const numOtherJudgesToAssign = Math.min(2, shuffledOtherJudges.length); // Assign up to 2 other judges
    const assignedJudges = [headJudgeId]; // Start with Head Judge
    for(let k = 0; k < numOtherJudgesToAssign; k++) {
        assignedJudges.push(shuffledOtherJudges[k]._id);
    }

    postings.push({
      round: 1, // Add round number
      matchNumber: i, // Add match number (index)
      team1: match.team1, // Team ID from bracket
      team2: match.team2, // Team ID from bracket
      location: `Room ${i + 1}`,
      judges: assignedJudges, // Use the array with Head Judge included
      theme: getDebateTheme(),
      status: 'scheduled', // Set status to scheduled
      createdAt: TOURNAMENT_DATE // Keep creation timestamp
      // Remove winner and evaluation for initial setup
    });
  }
  
  return postings;
};

// Simulate the tournament results by filling in winners
const simulateTournamentResults = (tournamentRounds, teams) => {
  const rounds = JSON.parse(JSON.stringify(tournamentRounds)); // Deep clone
  
  // For each round
  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    
    // Process each match in the round
    for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
      const match = round.matches[matchIndex];
      
      // Skip matches without both teams
      if (!match.team1 || !match.team2) continue;
      
      // Randomly determine winner
      match.winner = Math.random() > 0.5 ? match.team1 : match.team2;
      match.completed = true;
      
      // Update next round if this isn't the final round
      if (roundIndex < rounds.length - 1) {
        const nextRound = rounds[roundIndex + 1];
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
  
  return rounds;
};

// Update team statistics based on tournament results
const updateTeamStats = (teams, tournamentRounds) => {
  const updatedTeams = JSON.parse(JSON.stringify(teams));
  const teamStats = {};
  
  // Initialize team stats
  updatedTeams.forEach(team => {
    teamStats[team.id] = { wins: 0, losses: 0, points: 0 };
  });
  
  // Calculate wins and losses from round results
  tournamentRounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.completed && match.team1 && match.team2 && match.winner) {
        const winnerId = match.winner.id;
        const loserId = (match.team1.id === winnerId) 
          ? match.team2.id 
          : match.team1.id;
        
        if (teamStats[winnerId]) {
          teamStats[winnerId].wins += 1;
          teamStats[winnerId].points += 3; // 3 points for a win
        }
        
        if (teamStats[loserId]) {
          teamStats[loserId].losses += 1;
        }
      }
    });
  });
  
  // Update team objects with calculated stats
  updatedTeams.forEach(team => {
    const stats = teamStats[team.id];
    if (stats) {
      team.wins = stats.wins;
      team.losses = stats.losses;
      team.points = stats.points;
    }
  });
  
  return updatedTeams;
};

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the tournament
    const tournaments = await Debate.find({
      format: 'tournament',
      title: 'Qamqor Cup'
    }).populate({ path: 'participants.userId', model: 'User' }); // Populate userId within participants
    
    if (tournaments.length === 0) {
      console.error('Tournament not found');
      process.exit(1);
    }
    
    const tournament = tournaments[0];
    console.log(`Found tournament: ${tournament.title}`);
    
    // Extract debaters and judges
    // Filter based on tournamentRole, accessing populated user via p.userId if needed
    const debaters = tournament.participants.filter(p => p.tournamentRole === 'Debater');
    const judges = tournament.participants.filter(p => p.tournamentRole === 'Judge');
    
    console.log(`Found ${debaters.length} debaters and ${judges.length} judges`);

    // Find the Head Judge (assuming username 'judge_aibek' identifies them)
    // Find head judge by checking the populated userId's username
    const headJudgeParticipant = judges.find(p => p.userId && p.userId.username === 'judge_aibek');
    if (!headJudgeParticipant || !headJudgeParticipant.userId) {
        console.error('Head Judge (judge_aibek) not found among participants or userId not populated!');
        process.exit(1);
    }
    const headJudgeId = headJudgeParticipant.userId._id; // Get ID from populated user
    console.log(`Found Head Judge ID: ${headJudgeId}`);
    
    // Create teams
    const teams = createTeams(debaters);
    console.log(`Created ${teams.length} teams`);
    
    // Generate bracket
    const tournamentRounds = generateBrackets(teams);
    console.log(`Generated ${tournamentRounds.length} tournament rounds`);
    
    // // Simulate tournament results (REMOVED FOR SETUP)
    // const simulatedRounds = simulateTournamentResults(tournamentRounds, teams);
    // console.log('Simulated tournament results');
    
    // // Update team stats based on results (REMOVED FOR SETUP)
    // const updatedTeams = updateTeamStats(teams, simulatedRounds);
    // console.log('Updated team statistics');

    // Use original teams and rounds for setup
    const updatedTeams = teams;
    const simulatedRounds = tournamentRounds;
    
    // Create postings
    const postings = createPostings(
      { teams: updatedTeams, tournamentRounds: simulatedRounds },
      judges.map(p => p.userId), // Pass the array of populated User documents
      headJudgeId // Pass headJudgeId
    );
    console.log(`Created ${postings.length} postings`);
    
    // Update the tournament with all the simulated data
    tournament.teams = updatedTeams;
    tournament.tournamentRounds = simulatedRounds;
    tournament.postings = postings;
    // tournament.status = 'completed'; // Keep status as set by createTournament script (likely 'upcoming')
    // tournament.startDate = TOURNAMENT_DATE; // Keep original dates
    // tournament.startedAt = TOURNAMENT_DATE;
    // tournament.endedAt = new Date(new Date(TOURNAMENT_DATE).setHours(18, 0, 0)); // Don't set end date yet
    
    // Save the updated tournament
    await tournament.save();
    console.log('Tournament simulation completed and saved');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();

module.exports = {
  generateBrackets,
  simulateTournamentResults,
  updateTeamStats,
  shuffleArray
}; 