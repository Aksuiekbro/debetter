const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');
const ApfEvaluation = require('../models/ApfEvaluation'); // Import ApfEvaluation model
const cloudStorageService = require('./cloudStorageService'); // Import the cloud storage service
// Import other services if needed (e.g., tournamentService)

class DebateService {
  // Example: Get a single debate by ID
  async getDebateById(debateId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(debateId)) {
        throw new Error('Invalid debate ID format');
      }

      // Fetch debate without populating participants.userId initially
      let debate = await Debate.findById(debateId)
        .populate('creator', 'username role name')
        .exec();

      if (!debate) {
        throw new Error('Debate not found');
      }

      // Manually populate participant user details
      if (debate.participants && Array.isArray(debate.participants)) {
        // Filter out invalid IDs and get unique valid IDs
        const participantUserIds = [...new Set(
          debate.participants
            .map(p => p.userId)
            .filter(id => id && mongoose.Types.ObjectId.isValid(id))
        )];
        console.log('[Service] Extracted participantUserIds:', participantUserIds);

        const userDetailsMap = new Map();
        if (participantUserIds.length > 0) {
          try {
            const users = await User.find({
              '_id': { $in: participantUserIds }
            })
            .select('username email phoneNumber club name role judgeRole profilePhotoUrl')
            .lean();
            console.log('[Service] Found Users:', users);

            users.forEach(u => {
              if (u && u._id) {
                userDetailsMap.set(u._id.toString(), u);
              }
            });
          } catch (userError) {
            console.error('Error fetching user details:', userError);
            // Continue with partial data rather than failing completely
          }
        }

        // Create new participants array with populated user details
        const populatedParticipants = debate.participants.map(p => {
          try {
            const participantObject = p.toObject();
            if (p.userId) {
              const userDetail = userDetailsMap.get(p.userId.toString());
              console.log(`[Service] Mapping participant ID: ${p._id}, UserID: ${p.userId}, Found User:`, !!userDetail);
              participantObject.userId = userDetail || null;
            }
            return participantObject;
          } catch (participantError) {
            console.error('Error processing participant:', participantError);
            // Return a minimal valid participant object if conversion fails
            return {
              _id: p._id,
              userId: null,
              tournamentRole: p.tournamentRole || 'Debater'
            };
          }
        }).filter(Boolean); // Remove any null/undefined entries

        // Convert main debate document to plain object and replace participants
        const populatedDebate = debate.toObject();
        populatedDebate.participants = populatedParticipants;

        // Add participant counts
        if (populatedDebate.format === 'tournament') {
          try {
            populatedDebate.counts = {
              debaters: populatedDebate.participants?.filter(p => p.tournamentRole === 'Debater').length || 0,
              judges: populatedDebate.participants?.filter(p => p.tournamentRole === 'Judge').length || 0,
              maxDebaters: populatedDebate.tournamentSettings?.maxDebaters || 32,
              maxJudges: populatedDebate.tournamentSettings?.maxJudges || 8,
            };
          } catch (countError) {
            console.error('Error calculating counts:', countError);
            populatedDebate.counts = {
              debaters: 0,
              judges: 0,
              maxDebaters: 32,
              maxJudges: 8
            };
          }
        }

        return populatedDebate;
      } else {
        // If no participants, return basic debate info
        const plainDebate = debate.toObject();
        plainDebate.participants = [];
        if (plainDebate.format === 'tournament') {
          plainDebate.counts = {
            debaters: 0,
            judges: 0,
            maxDebaters: plainDebate.tournamentSettings?.maxDebaters || 32,
            maxJudges: plainDebate.tournamentSettings?.maxJudges || 8,
          };
        }
        return plainDebate;
      }
    } catch (error) {
      console.error(`Error fetching debate ${debateId}:`, error);
      throw error;
    }
  }

  // Creates a new debate document
  async createDebate(debateData) {
    try {
      // The debateData should already be prepared by the controller/tournamentService
      const debate = await Debate.create(debateData);
      // Note: Population might be needed depending on what the controller needs to return
      // If the full object is needed immediately, populate here or in the controller after creation.
      return debate;
    } catch (error) {
      console.error('Error creating debate in service:', error);
      // Handle specific mongoose validation errors if needed
      throw error;
    }
  }


  /**
   * Uploads or replaces a tournament map image.
   * @param {string} debateId - The ID of the debate (tournament).
   * @param {Buffer} fileBuffer - The image file buffer.
   * @param {string} originalFileName - The original name of the uploaded file.
   * @param {string} mimeType - The MIME type of the file.
   * @param {string} userId - The ID of the user performing the upload (for authorization).
   * @returns {Promise<string>} - The URL of the uploaded map.
   */
  async uploadTournamentMap(debateId, fileBuffer, originalFileName, mimeType, userId) {
    try {
      const debate = await Debate.findById(debateId);

      if (!debate) {
        throw new Error('Debate not found');
      }
      if (debate.format !== 'tournament') {
        throw new Error('Map can only be uploaded for tournaments.');
      }
      // Authorization check: Only the creator can upload
      if (debate.creator.toString() !== userId) {
        throw new Error('Not authorized to upload map for this tournament.'); // Use a specific error type in production
      }

      // If a map already exists, delete the old one from cloud storage first
      if (debate.mapImageUrl) {
        try {
          await cloudStorageService.deleteFile(debate.mapImageUrl);
        } catch (deleteError) {
          console.error(`Error deleting previous map image ${debate.mapImageUrl}:`, deleteError);
          // Log the error but proceed with uploading the new map
        }
      }

      // Construct a unique filename (e.g., using debateId and timestamp)
      const uniqueFileName = `tournament-${debateId}-map-${Date.now()}-${originalFileName}`;

      // Upload the new file
      const newMapUrl = await cloudStorageService.uploadFile(fileBuffer, uniqueFileName, mimeType);

      // Update the debate document
      debate.mapImageUrl = newMapUrl;
      await debate.save();

      return newMapUrl;
    } catch (error) {
      console.error(`Error uploading tournament map for debate ${debateId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes the tournament map image.
   * @param {string} debateId - The ID of the debate (tournament).
   * @param {string} userId - The ID of the user performing the deletion (for authorization).
   * @returns {Promise<void>}
   */
  async deleteTournamentMap(debateId, userId) {
    try {
      const debate = await Debate.findById(debateId);

      if (!debate) {
        throw new Error('Debate not found');
      }
      if (debate.format !== 'tournament') {
        throw new Error('Map can only be deleted for tournaments.');
      }
      // Authorization check: Only the creator can delete
      if (debate.creator.toString() !== userId) {
        throw new Error('Not authorized to delete map for this tournament.');
      }

      const imageUrlToDelete = debate.mapImageUrl;

      if (!imageUrlToDelete) {
        // No map exists, nothing to delete
        console.log(`No map image found for debate ${debateId} to delete.`);
        return; // Or throw an error if preferred: throw new Error('No map image exists to delete.');
      }

      // Update the debate document first to remove the URL
      debate.mapImageUrl = null;
      await debate.save();

      // Then, delete the file from cloud storage
      try {
        await cloudStorageService.deleteFile(imageUrlToDelete);
      } catch (deleteError) {
        console.error(`Error deleting map image ${imageUrlToDelete} from cloud storage:`, deleteError);
        // Log the error. The URL is already removed from the DB.
        // Consider adding a mechanism to retry deletion later if critical.
      }

    } catch (error) {
      console.error(`Error deleting tournament map for debate ${debateId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the tournament map image URL.
   * @param {string} debateId - The ID of the debate (tournament).
   * @returns {Promise<string|null>} - The URL of the map or null if none exists.
   */
  async getTournamentMapUrl(debateId) {
    try {
      // Select only necessary fields for efficiency
      const debate = await Debate.findById(debateId).select('mapImageUrl format').lean();

      if (!debate) {
        throw new Error('Debate not found');
      }
      if (debate.format !== 'tournament') {
        // Depending on requirements, might return null or throw error
        // Returning null seems reasonable if called on a non-tournament debate
        return null; 
      }

      return debate.mapImageUrl; // This will be null if no map is set
    } catch (error) {
      console.error(`Error getting tournament map URL for debate ${debateId}:`, error);
      throw error;
    }
  }



  /**
   * Calculates and returns ranked participant standings based on APF evaluations.
   * @param {string} tournamentId - The ID of the tournament (Debate).
   * @returns {Promise<Array<object>>} - Sorted array of participant standings.
   */
  async calculateParticipantStandings(tournamentId) {
    try {
      // 1. Fetch Tournament Data (Debate) with populated teams and postings
      const debate = await Debate.findById(tournamentId)
        .populate({
          path: 'teams',
          populate: {
            path: 'members.userId',
            select: 'name username _id' // Select fields needed for standings
          }
        })
        .populate('postings') // Populate postings to find the relevant game
        .lean(); // Use lean for performance

      if (!debate) {
        throw new Error('Tournament not found');
      }
      if (debate.format !== 'tournament') {
        throw new Error('Standings calculation only available for tournaments.');
      }

      // 2. Fetch all APF Evaluations for this tournament
      const evaluations = await ApfEvaluation.find({ debateId: tournamentId }).lean();

      if (!evaluations || evaluations.length === 0) {
        return []; // No evaluations yet, return empty standings
      }

      // 3. Prepare Data Structures
      const teamMap = new Map(debate.teams.map(team => [team._id.toString(), team]));
      const participantScores = new Map(); // Key: userId, Value: { totalScore, gamesPlayed, name, userId }

      // Helper to initialize participant data
      const ensureParticipant = (userId, name) => {
        if (!participantScores.has(userId.toString())) {
          participantScores.set(userId.toString(), {
            userId: userId,
            name: name || 'Unknown User', // Fallback name
            totalScore: 0,
            gamesPlayed: 0,
          });
        }
      };

      // 4. Aggregate Scores by iterating through evaluations
      for (const evaluation of evaluations) {
        // **Ambiguity Warning:** Linking evaluation to posting based on judge and winner
        // might be unreliable if a judge evaluates multiple games where the same team wins.
        // A direct postingId reference in ApfEvaluation schema is recommended for robustness.
        const relatedPosting = debate.postings.find(p =>
          p.judges.some(judgeId => judgeId.toString() === evaluation.judgeId.toString()) &&
          p.winner?.toString() === evaluation.winningTeam?.toString() && // Check winner matches
          p.status === 'completed' // Only consider completed postings
        );

        if (!relatedPosting) {
          console.warn(`Could not find a matching completed posting for evaluation judge ${evaluation.judgeId} and winning team ${evaluation.winningTeam} in tournament ${tournamentId}. Skipping evaluation.`);
          continue; // Skip this evaluation if no clear posting match
        }

        // Assumption: posting.team1 is Government, posting.team2 is Opposition
        const govTeamId = relatedPosting.team1.toString();
        const oppTeamId = relatedPosting.team2.toString();
        const govTeam = teamMap.get(govTeamId);
        const oppTeam = teamMap.get(oppTeamId);

        if (!govTeam || !oppTeam) {
            console.warn(`Could not find team data for posting ${relatedPosting._id} in tournament ${tournamentId}. Skipping evaluation.`);
            continue;
        }

        // Find members and their roles
        const govLeader = govTeam.members.find(m => m.role === 'leader');
        const govSpeaker = govTeam.members.find(m => m.role === 'speaker');
        const oppLeader = oppTeam.members.find(m => m.role === 'leader');
        const oppSpeaker = oppTeam.members.find(m => m.role === 'speaker');

        // Aggregate scores, ensuring participant exists in the map
        if (govLeader?.userId && evaluation.speakerScores?.leader_gov?.totalPoints != null) {
          ensureParticipant(govLeader.userId._id, govLeader.userId.name || govLeader.userId.username);
          const participant = participantScores.get(govLeader.userId._id.toString());
          participant.totalScore += evaluation.speakerScores.leader_gov.totalPoints;
          participant.gamesPlayed += 1;
        }
         if (govSpeaker?.userId && evaluation.speakerScores?.speaker_gov?.totalPoints != null) {
          ensureParticipant(govSpeaker.userId._id, govSpeaker.userId.name || govSpeaker.userId.username);
          const participant = participantScores.get(govSpeaker.userId._id.toString());
          participant.totalScore += evaluation.speakerScores.speaker_gov.totalPoints;
          participant.gamesPlayed += 1;
        }
         if (oppLeader?.userId && evaluation.speakerScores?.leader_opp?.totalPoints != null) {
          ensureParticipant(oppLeader.userId._id, oppLeader.userId.name || oppLeader.userId.username);
          const participant = participantScores.get(oppLeader.userId._id.toString());
          participant.totalScore += evaluation.speakerScores.leader_opp.totalPoints;
          participant.gamesPlayed += 1;
        }
         if (oppSpeaker?.userId && evaluation.speakerScores?.speaker_opp?.totalPoints != null) {
          ensureParticipant(oppSpeaker.userId._id, oppSpeaker.userId.name || oppSpeaker.userId.username);
          const participant = participantScores.get(oppSpeaker.userId._id.toString());
          participant.totalScore += evaluation.speakerScores.speaker_opp.totalPoints;
          participant.gamesPlayed += 1;
        }
      }

      // 5. Format, Calculate Average, Sort, and Rank
      const standings = Array.from(participantScores.values()).map(p => ({
        ...p,
        averageScore: p.gamesPlayed > 0 ? parseFloat((p.totalScore / p.gamesPlayed).toFixed(2)) : 0, // Calculate average and format
      }));

      // Sort by totalScore descending, then averageScore descending as tie-breaker
      standings.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.averageScore - a.averageScore; // Higher average wins tie
      });

      // Assign ranks
      let currentRank = 0;
      let lastScore = -1;
      let lastAvgScore = -1;
      standings.forEach((p, index) => {
        if (p.totalScore !== lastScore || p.averageScore !== lastAvgScore) {
            currentRank = index + 1;
            lastScore = p.totalScore;
            lastAvgScore = p.averageScore;
        }
        p.rank = currentRank;
      });

      return standings;

    } catch (error) {
      console.error(`Error calculating participant standings for tournament ${tournamentId}:`, error);
      // Re-throw specific errors if needed, otherwise throw the original error
      throw error;
    }
  }
  // TODO: Add methods for getDebates, joinDebate, leaveDebate, getUserDebates, updateDebate etc.
}

module.exports = new DebateService();