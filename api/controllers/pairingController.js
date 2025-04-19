const Debate = require('../models/Debate');
const Team = require('../models/Team');
const User = require('../models/User');
const Pairing = require('../models/Pairing');
const ScheduleItem = require('../models/ScheduleItem');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all pairings for a tournament
 */
exports.getPairings = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const { published, round, roundType } = req.query;

  // Build query
  const query = { tournament: tournamentId };

  // Filter by published status if specified
  if (published !== undefined) {
    query.published = published === 'true';
  }

  // Filter by round if specified
  if (round !== undefined) {
    query.round = parseInt(round, 10);
  }

  // Filter by roundType if specified
  if (roundType !== undefined) {
    query.roundType = roundType;
  }

  // Find all pairings for the tournament
  const pairings = await Pairing.find(query)
    .populate('team1', 'name club')
    .populate('team2', 'name club')
    .populate('judges', 'username name');

  res.status(200).json({
    status: 'success',
    data: {
      pairings
    }
  });
});

/**
 * Generate random pairings for a tournament round
 */
exports.randomizePairings = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const { round, roundType, avoidRematches, avoidSameClub } = req.body;

  // Validate input
  if (!round || !roundType) {
    return next(new AppError('Round and round type are required', 400));
  }

  // Get all teams for the tournament
  const teams = await Team.find({ tournament: tournamentId });

  if (teams.length < 2) {
    return next(new AppError('Not enough teams to generate pairings', 400));
  }

  // Get all judges for the tournament
  const tournament = await Debate.findById(tournamentId);
  const judges = await User.find({ _id: { $in: tournament.judges } });

  // Get existing pairings for this tournament
  const existingPairings = await Pairing.find({ tournament: tournamentId });

  // Shuffle teams
  let shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  // Generate pairings
  const pairings = [];
  const usedTeams = new Set();

  // Helper function to check if teams have faced each other before
  const haveTeamsFacedBefore = (team1Id, team2Id) => {
    if (!avoidRematches) return false;

    return existingPairings.some(pairing =>
      (pairing.team1?.toString() === team1Id.toString() && pairing.team2?.toString() === team2Id.toString()) ||
      (pairing.team1?.toString() === team2Id.toString() && pairing.team2?.toString() === team1Id.toString())
    );
  };

  // Helper function to check if teams are from the same club
  const areTeamsFromSameClub = (team1, team2) => {
    if (!avoidSameClub) return false;

    return team1.club && team2.club && team1.club === team2.club;
  };

  // Try to create pairings
  for (let i = 0; i < shuffledTeams.length; i++) {
    const team1 = shuffledTeams[i];

    // Skip if team is already paired
    if (usedTeams.has(team1._id.toString())) continue;

    // Find a suitable opponent
    let team2 = null;

    for (let j = 0; j < shuffledTeams.length; j++) {
      const potentialTeam2 = shuffledTeams[j];

      // Skip if same team or already paired
      if (team1._id.toString() === potentialTeam2._id.toString() || usedTeams.has(potentialTeam2._id.toString())) {
        continue;
      }

      // Check constraints
      if (haveTeamsFacedBefore(team1._id, potentialTeam2._id) || areTeamsFromSameClub(team1, potentialTeam2)) {
        continue;
      }

      team2 = potentialTeam2;
      break;
    }

    // If no suitable opponent found, just pick the first available team
    if (!team2) {
      for (let j = 0; j < shuffledTeams.length; j++) {
        const potentialTeam2 = shuffledTeams[j];

        // Skip if same team or already paired
        if (team1._id.toString() === potentialTeam2._id.toString() || usedTeams.has(potentialTeam2._id.toString())) {
          continue;
        }

        team2 = potentialTeam2;
        break;
      }
    }

    // If still no opponent, create a bye
    if (!team2) {
      pairings.push({
        tournament: tournamentId,
        round,
        roundType,
        team1: team1._id,
        isBye: true,
        location: `Room ${pairings.length + 1}`
      });

      usedTeams.add(team1._id.toString());
      continue;
    }

    // Assign a judge if available
    const judgeIndex = pairings.length % judges.length;
    const judge = judges[judgeIndex];

    // Create pairing
    pairings.push({
      tournament: tournamentId,
      round,
      roundType,
      team1: team1._id,
      team2: team2._id,
      judges: judge ? [judge._id] : [],
      location: `Room ${pairings.length + 1}`
    });

    // Mark teams as used
    usedTeams.add(team1._id.toString());
    usedTeams.add(team2._id.toString());
  }

  // Return the generated pairings (without saving them)
  const populatedPairings = [];

  for (const pairing of pairings) {
    const populatedPairing = {
      ...pairing,
      team1: teams.find(team => team._id.toString() === pairing.team1.toString()),
      team2: pairing.team2 ? teams.find(team => team._id.toString() === pairing.team2.toString()) : null,
      judges: pairing.judges.map(judgeId => judges.find(judge => judge._id.toString() === judgeId.toString()))
    };

    populatedPairings.push(populatedPairing);
  }

  res.status(200).json({
    status: 'success',
    data: {
      pairings: populatedPairings
    }
  });
});

/**
 * Submit pairings for a tournament round
 */
exports.submitPairings = catchAsync(async (req, res, next) => {
  const { tournamentId } = req.params;
  const { round, roundType, pairings } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!round || !roundType || !pairings || !Array.isArray(pairings)) {
    return next(new AppError('Round, round type, and pairings are required', 400));
  }

  // Delete existing pairings for this round
  await Pairing.deleteMany({ tournament: tournamentId, round, roundType });

  // Create new pairings
  const newPairings = [];

  for (const pairing of pairings) {
    const newPairing = await Pairing.create({
      tournament: tournamentId,
      round,
      roundType,
      team1: pairing.team1._id || pairing.team1,
      team2: pairing.team2 ? (pairing.team2._id || pairing.team2) : null,
      judges: pairing.judges ? pairing.judges.map(judge => judge._id || judge) : [],
      location: pairing.location,
      isBye: pairing.isBye || false,
      published: true
    });

    newPairings.push(newPairing);
  }

  // Get tournament details for schedule item creation
  const tournament = await Debate.findById(tournamentId);
  if (!tournament) {
    return next(new AppError('Tournament not found', 404));
  }

  // Create a schedule item for this round
  const roundName = roundType === 'preliminary'
    ? `Preliminary Round ${round}`
    : (round === 1 ? '1/8 Finals' :
       round === 2 ? 'Quarter Finals' :
       round === 3 ? 'Semi Finals' :
       round === 4 ? 'Finals' : `Playoff Round ${round}`);

  // Create a date object for the schedule item
  const now = new Date();

  // Create a schedule item for this round
  await ScheduleItem.create({
    tournamentId,
    time: now,
    eventDescription: `${roundName} Pairings`,
    location: 'See Tournament Postings',
    createdBy: userId,
    metadata: {
      type: 'pairings',
      round,
      roundType
    }
  });

  res.status(201).json({
    status: 'success',
    data: {
      pairings: newPairings
    }
  });
});

/**
 * Delete a pairing
 */
exports.deletePairing = catchAsync(async (req, res, next) => {
  const { pairingId } = req.params;

  const pairing = await Pairing.findByIdAndDelete(pairingId);

  if (!pairing) {
    return next(new AppError('Pairing not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
