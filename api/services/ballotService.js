const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

class BallotService {
  /**
   * Submit a ballot for a posting
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} postingId - The ID of the posting
   * @param {Object} ballotData - The ballot data
   * @param {string} userId - The ID of the user submitting the ballot
   * @returns {Promise<Object>} The updated posting
   */
  async submitBallot(tournamentId, postingId, ballotData, userId) {
    const tournament = await Debate.findById(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const posting = tournament.postings.id(postingId);
    
    if (!posting) {
      throw new Error('Posting not found');
    }

    // Initialize ballot object if it doesn't exist
    if (!posting.ballot) {
      posting.ballot = {};
    }

    // Update ballot data
    posting.ballot = {
      ...posting.ballot,
      submitted: true,
      submittedAt: new Date(),
      submittedBy: userId,
      winner: ballotData.winner,
      team1Score: ballotData.team1Score,
      team2Score: ballotData.team2Score,
      team1SpeakerPoints: ballotData.team1SpeakerPoints,
      team2SpeakerPoints: ballotData.team2SpeakerPoints,
      comments: ballotData.comments,
      team1Comments: ballotData.team1Comments,
      team2Comments: ballotData.team2Comments,
      individualScores: ballotData.individualScores,
      ballotNumber: ballotData.ballotNumber,
      motionUsed: ballotData.motionUsed
    };

    // Update posting status
    posting.status = 'completed';
    
    // Update winner in posting
    posting.winner = ballotData.winner;

    // Update team stats
    if (ballotData.winner) {
      const winnerTeam = tournament.teams.id(ballotData.winner);
      const loserTeam = tournament.teams.id(
        ballotData.winner.toString() === posting.team1.toString() 
          ? posting.team2 
          : posting.team1
      );

      if (winnerTeam) {
        winnerTeam.wins = (winnerTeam.wins || 0) + 1;
        winnerTeam.points = (winnerTeam.points || 0) + 3; // Example: 3 points for a win
        
        // Add round result if using the roundResults array
        if (Array.isArray(winnerTeam.roundResults)) {
          winnerTeam.roundResults.push({
            roundNumber: posting.round,
            points: 3, // Win points
            opponent: loserTeam ? loserTeam._id : null,
            speakerPoints: ballotData.winner.toString() === posting.team1.toString() 
              ? ballotData.team1SpeakerPoints 
              : ballotData.team2SpeakerPoints,
            room: posting.location,
            side: ballotData.winner.toString() === posting.team1.toString() ? 'proposition' : 'opposition'
          });
          
          // Update total speaker points
          winnerTeam.totalSpeakerPoints = (winnerTeam.totalSpeakerPoints || 0) + 
            (ballotData.winner.toString() === posting.team1.toString() 
              ? (ballotData.team1SpeakerPoints || 0) 
              : (ballotData.team2SpeakerPoints || 0));
        }
      }

      if (loserTeam) {
        loserTeam.losses = (loserTeam.losses || 0) + 1;
        loserTeam.points = (loserTeam.points || 0) + 1; // Example: 1 point for participation
        
        // Add round result if using the roundResults array
        if (Array.isArray(loserTeam.roundResults)) {
          loserTeam.roundResults.push({
            roundNumber: posting.round,
            points: 1, // Participation point
            opponent: winnerTeam ? winnerTeam._id : null,
            speakerPoints: ballotData.winner.toString() === posting.team1.toString() 
              ? ballotData.team2SpeakerPoints 
              : ballotData.team1SpeakerPoints,
            room: posting.location,
            side: ballotData.winner.toString() === posting.team1.toString() ? 'opposition' : 'proposition'
          });
          
          // Update total speaker points
          loserTeam.totalSpeakerPoints = (loserTeam.totalSpeakerPoints || 0) + 
            (ballotData.winner.toString() === posting.team1.toString() 
              ? (ballotData.team2SpeakerPoints || 0) 
              : (ballotData.team1SpeakerPoints || 0));
        }
      }
    }

    // Save tournament
    await tournament.save();
    
    return posting;
  }

  /**
   * Get a ballot for a posting
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} postingId - The ID of the posting
   * @returns {Promise<Object>} The ballot data
   */
  async getBallot(tournamentId, postingId) {
    const tournament = await Debate.findById(tournamentId)
      .populate('postings.ballot.submittedBy', 'username _id')
      .populate('postings.team1', 'name')
      .populate('postings.team2', 'name')
      .populate('postings.judges', 'username _id');
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const posting = tournament.postings.id(postingId);
    
    if (!posting) {
      throw new Error('Posting not found');
    }

    // Get team details
    const team1 = tournament.teams.id(posting.team1);
    const team2 = tournament.teams.id(posting.team2);

    return {
      postingId: posting._id,
      round: posting.round,
      roundType: posting.roundType,
      team1: {
        id: posting.team1,
        name: team1 ? team1.name : 'Unknown Team'
      },
      team2: {
        id: posting.team2,
        name: team2 ? team2.name : 'Unknown Team'
      },
      judges: posting.judges.map(judgeId => {
        const judge = tournament.participants.find(p => 
          p.userId && p.userId._id.toString() === judgeId.toString()
        );
        return judge ? {
          id: judge.userId._id,
          name: judge.userId.username
        } : { id: judgeId, name: 'Unknown Judge' };
      }),
      location: posting.location,
      theme: posting.theme,
      ballot: posting.ballot || {},
      ballotImageUrl: posting.ballotImageUrl
    };
  }

  /**
   * Get all ballots for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of ballots
   */
  async getAllBallots(tournamentId, filters = {}) {
    const tournament = await Debate.findById(tournamentId)
      .populate('postings.ballot.submittedBy', 'username _id')
      .populate('postings.judges', 'username _id');
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    let postings = tournament.postings || [];

    // Apply filters
    if (filters.round) {
      postings = postings.filter(p => p.round === parseInt(filters.round, 10));
    }

    if (filters.roundType) {
      postings = postings.filter(p => p.roundType === filters.roundType);
    }

    if (filters.submitted !== undefined) {
      postings = postings.filter(p => 
        (p.ballot && p.ballot.submitted) === filters.submitted
      );
    }

    // Map postings to ballot data
    return postings.map(posting => {
      const team1 = tournament.teams.id(posting.team1);
      const team2 = tournament.teams.id(posting.team2);

      return {
        postingId: posting._id,
        round: posting.round,
        roundType: posting.roundType,
        team1: {
          id: posting.team1,
          name: team1 ? team1.name : 'Unknown Team'
        },
        team2: {
          id: posting.team2,
          name: team2 ? team2.name : 'Unknown Team'
        },
        judges: posting.judges.map(judgeId => {
          const judge = tournament.participants.find(p => 
            p.userId && p.userId._id.toString() === judgeId.toString()
          );
          return judge ? {
            id: judge.userId._id,
            name: judge.userId.username
          } : { id: judgeId, name: 'Unknown Judge' };
        }),
        location: posting.location,
        theme: posting.theme,
        ballot: posting.ballot || {},
        ballotImageUrl: posting.ballotImageUrl,
        status: posting.status
      };
    });
  }

  /**
   * Upload a ballot image
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} postingId - The ID of the posting
   * @param {Buffer} imageBuffer - The image buffer
   * @param {string} fileName - The original file name
   * @returns {Promise<string>} The URL of the uploaded image
   */
  async uploadBallotImage(tournamentId, postingId, imageBuffer, fileName) {
    const tournament = await Debate.findById(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const posting = tournament.postings.id(postingId);
    
    if (!posting) {
      throw new Error('Posting not found');
    }

    // Create directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/ballots');
    await mkdirAsync(uploadsDir, { recursive: true });

    // Generate a unique filename
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${tournamentId}_${postingId}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Write the file
    await writeFileAsync(filePath, imageBuffer);

    // Update the posting with the image URL
    const imageUrl = `/uploads/ballots/${uniqueFileName}`;
    posting.ballotImageUrl = imageUrl;

    // Save the tournament
    await tournament.save();

    return imageUrl;
  }

  /**
   * Add participant feedback to a ballot
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} postingId - The ID of the posting
   * @param {Object} feedbackData - The feedback data
   * @param {string} userId - The ID of the user submitting the feedback
   * @returns {Promise<Object>} The updated posting
   */
  async addParticipantFeedback(tournamentId, postingId, feedbackData, userId) {
    const tournament = await Debate.findById(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const posting = tournament.postings.id(postingId);
    
    if (!posting) {
      throw new Error('Posting not found');
    }

    // Initialize ballot and participantFeedback if they don't exist
    if (!posting.ballot) {
      posting.ballot = {};
    }
    
    if (!posting.ballot.participantFeedback) {
      posting.ballot.participantFeedback = [];
    }

    // Check if user has already submitted feedback
    const existingFeedbackIndex = posting.ballot.participantFeedback.findIndex(
      feedback => feedback.userId && feedback.userId.toString() === userId.toString()
    );

    const feedback = {
      userId,
      comments: feedbackData.comments,
      submittedAt: new Date(),
      rating: feedbackData.rating
    };

    if (existingFeedbackIndex !== -1) {
      // Update existing feedback
      posting.ballot.participantFeedback[existingFeedbackIndex] = feedback;
    } else {
      // Add new feedback
      posting.ballot.participantFeedback.push(feedback);
    }

    // Save tournament
    await tournament.save();
    
    return posting;
  }

  /**
   * Get participant feedback for a posting
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} postingId - The ID of the posting
   * @returns {Promise<Array>} Array of feedback
   */
  async getParticipantFeedback(tournamentId, postingId) {
    const tournament = await Debate.findById(tournamentId)
      .populate('postings.ballot.participantFeedback.userId', 'username _id');
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const posting = tournament.postings.id(postingId);
    
    if (!posting) {
      throw new Error('Posting not found');
    }

    if (!posting.ballot || !posting.ballot.participantFeedback) {
      return [];
    }

    return posting.ballot.participantFeedback;
  }
}

module.exports = new BallotService();
