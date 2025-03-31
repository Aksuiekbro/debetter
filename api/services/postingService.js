const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');
// Import notification service or helpers if extracted

// Helper function to send notifications (can be moved to a notification service)
async function sendGameNotifications(debate, postingData, postingId) {
    const { judgeIds, team1Id, team2Id, scheduledTime, theme, batchName } = postingData;
    const results = { judgesNotified: 0, teamMembersNotified: 0, errors: [] };
    const debateId = debate._id;

    let reminderText = `You have been assigned to an APF debate`;
    if (scheduledTime) reminderText += ` scheduled for ${new Date(scheduledTime).toLocaleString()}`;
    if (batchName) reminderText += ` (${batchName})`;
    reminderText += `. Theme: ${typeof theme === 'string' ? theme : theme?.label || 'Topic not specified'}`;

    // Notify judges
    for (const judgeId of judgeIds) {
        try {
            const judge = await User.findById(judgeId);
            if (judge) {
                if (!judge.notifications) judge.notifications = [];
                judge.notifications.push({
                    type: 'game_assignment', debate: debateId, posting: postingId,
                    message: `${reminderText} - You are judging.`, seen: false, createdAt: new Date()
                });
                await judge.save();
                results.judgesNotified++;
            }
        } catch (error) { results.errors.push(`Failed to notify judge ${judgeId}: ${error.message}`); }
    }

    // Notify team members
    const team1 = debate.teams.find(t => t._id.toString() === team1Id.toString());
    const team2 = debate.teams.find(t => t._id.toString() === team2Id.toString());

    const notifyTeam = async (team, teamName) => {
        if (team && team.members) {
            for (const member of team.members) {
                try {
                    if (member.userId) {
                        const teamMember = await User.findById(member.userId);
                        if (teamMember) {
                            if (!teamMember.notifications) teamMember.notifications = [];
                            teamMember.notifications.push({
                                type: 'game_assignment', debate: debateId, posting: postingId,
                                message: `${reminderText} - Your team (${teamName}) is participating.`, seen: false, createdAt: new Date()
                            });
                            await teamMember.save();
                            results.teamMembersNotified++;
                        }
                    }
                } catch (error) { results.errors.push(`Failed to notify team member: ${error.message}`); }
            }
        }
    };

    await notifyTeam(team1, team1?.name || 'Team 1');
    await notifyTeam(team2, team2?.name || 'Team 2');

    return results;
}


class PostingService {

    // Validates data for creating an APF posting
    async validatePostingData(debateId, postingData) {
        const { team1Id, team2Id, location, virtualLink, judgeIds, theme } = postingData;

        if (!team1Id || !team2Id || (!location && !virtualLink) || !judgeIds || judgeIds.length === 0 || !theme) {
            throw new Error('Missing required fields for APF posting');
        }
        if (team1Id === team2Id) {
            throw new Error('Teams cannot be the same');
        }

        const debate = await Debate.findById(debateId).populate('participants', '_id'); // Only need IDs
        if (!debate) throw new Error('Tournament not found');

        // Ensure teams exist
        const team1Exists = debate.teams?.some(t => t._id.toString() === team1Id.toString());
        const team2Exists = debate.teams?.some(t => t._id.toString() === team2Id.toString());
        if (!team1Exists || !team2Exists) throw new Error('One or both teams not found in this tournament');

        // Ensure judges are participants
        const participantIds = debate.participants.map(p => p._id.toString());
        const invalidJudges = judgeIds.filter(judgeId => !participantIds.includes(judgeId.toString()));
        if (invalidJudges.length > 0) {
            throw new Error(`Judges not found as participants: ${invalidJudges.join(', ')}`);
        }

        return debate; // Return debate for use in creation
    }

    // Creates a single APF posting
    async createPosting(debateId, userId, postingData) {
        const {
            team1Id, team2Id, location, virtualLink, judgeIds, theme, useCustomModel,
            scheduledTime, status = 'scheduled', notifyParticipants = true, batchName = ''
        } = postingData;

        const debate = await this.validatePostingData(debateId, postingData);

        const newPosting = {
            _id: new mongoose.Types.ObjectId(), // Generate ID
            team1: team1Id,
            team2: team2Id,
            location: location || '',
            virtualLink: virtualLink || '',
            judges: judgeIds,
            theme,
            useCustomModel: !!useCustomModel,
            createdAt: new Date(),
            scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
            status: status || 'scheduled',
            createdBy: userId,
            batchName: batchName || '',
            notifications: { judgesNotified: false, sentAt: null }
        };

        if (!debate.postings) debate.postings = [];
        debate.postings.push(newPosting);
        await debate.save();

        // Send notifications if enabled
        let notificationResults = {};
        if (notifyParticipants) {
            try {
                notificationResults = await sendGameNotifications(debate, postingData, newPosting._id);
                // Update notification status in the posting
                const savedDebate = await Debate.findById(debateId);
                const savedPosting = savedDebate.postings.id(newPosting._id);
                if (savedPosting) {
                    savedPosting.notifications.judgesNotified = true;
                    savedPosting.notifications.sentAt = new Date();
                    await savedDebate.save();
                    newPosting.notifications = savedPosting.notifications; // Reflect update in returned data
                }
            } catch (notifyError) {
                console.error(`Error sending notifications for posting ${newPosting._id}:`, notifyError);
                // Decide if this should throw an error or just log
            }
        }

        return { ...newPosting, notificationResults }; // Return the created posting data
    }

    // Creates multiple APF postings in a batch
    async createBatchPostings(debateId, userId, batchData) {
        const { batchGames, batchName } = batchData;
        if (!Array.isArray(batchGames) || batchGames.length === 0) {
            throw new Error('No games provided for batch creation');
        }

        const debate = await Debate.findById(debateId).populate('participants', '_id').populate('teams'); // Need teams for notifications
        if (!debate) throw new Error('Tournament not found');

        const results = [];
        const errors = [];
        const createdPostings = [];

        for (const game of batchGames) {
            try {
                // Extract necessary data, map team/judge objects to IDs if needed
                const postingData = {
                    team1Id: game.team1?.id || game.team1,
                    team2Id: game.team2?.id || game.team2,
                    location: game.location,
                    virtualLink: game.virtualLink,
                    judgeIds: game.judges?.map(j => j.id || j) || [],
                    theme: typeof game.theme === 'string' ? game.theme : game.theme?.label || '',
                    useCustomModel: game.useCustomModel,
                    scheduledTime: game.scheduledTime,
                    status: game.status,
                    notifyParticipants: game.notifyParticipants !== false, // Default true
                    batchName: batchName || '',
                };

                // Validate each game individually (optional, could rely on single create validation)
                await this.validatePostingData(debateId, postingData);

                const newPosting = {
                    _id: new mongoose.Types.ObjectId(),
                    team1: postingData.team1Id, team2: postingData.team2Id,
                    location: postingData.location || '', virtualLink: postingData.virtualLink || '',
                    judges: postingData.judgeIds, theme: postingData.theme,
                    useCustomModel: !!postingData.useCustomModel, createdAt: new Date(),
                    scheduledTime: postingData.scheduledTime ? new Date(postingData.scheduledTime) : null,
                    status: postingData.status || 'scheduled', createdBy: userId,
                    batchName: postingData.batchName || '',
                    notifications: { judgesNotified: false, sentAt: null }
                };
                createdPostings.push(newPosting); // Add to list to be saved
                results.push({ // Add simplified result
                     _id: newPosting._id, team1Id: newPosting.team1, team2Id: newPosting.team2,
                     status: newPosting.status, batchName: newPosting.batchName
                });

            } catch (gameError) {
                console.error('Error processing game in batch:', gameError);
                errors.push({ game: { team1: game.team1?.name, team2: game.team2?.name }, message: gameError.message });
            }
        }

        // Add all valid postings to the debate
        if (createdPostings.length > 0) {
            if (!debate.postings) debate.postings = [];
            debate.postings.push(...createdPostings);
            await debate.save();

            // Send notifications for successfully created postings
            const updatedDebate = await Debate.findById(debateId).populate('teams'); // Re-fetch with teams for notifications
            for (const game of batchGames) {
                 // Find the corresponding created posting ID to link notifications
                 const created = createdPostings.find(p => p.team1 === (game.team1?.id || game.team1) && p.team2 === (game.team2?.id || game.team2));
                 if (created && game.notifyParticipants !== false) {
                    try {
                        await sendGameNotifications(updatedDebate, { ...game, judgeIds: game.judges?.map(j => j.id || j) || [] }, created._id);
                        // Update notification status in DB (could be optimized)
                        const finalDebate = await Debate.findById(debateId);
                        const finalPosting = finalDebate.postings.id(created._id);
                        if (finalPosting) {
                            finalPosting.notifications.judgesNotified = true;
                            finalPosting.notifications.sentAt = new Date();
                            await finalDebate.save();
                        }
                    } catch (notifyError) {
                        console.error(`Error sending batch notifications for posting ${created._id}:`, notifyError);
                        errors.push({ game: { team1: game.team1?.name, team2: game.team2?.name }, message: `Notification failed: ${notifyError.message}` });
                    }
                 }
            }
        }

        return { results, errors };
    }

    // Updates the status of an APF posting
    async updatePostingStatus(debateId, postingId, newStatus) {
        if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
            throw new Error('Invalid status value');
        }

        const debate = await Debate.findById(debateId);
        if (!debate) throw new Error('Tournament not found');

        const posting = debate.postings?.id(postingId);
        if (!posting) throw new Error('APF posting not found');

        posting.status = newStatus;
        if (newStatus === 'completed' && !posting.completedAt) {
            posting.completedAt = new Date();
        }

        await debate.save();
        return { status: posting.status, completedAt: posting.completedAt };
    }

    // Sends reminders for a specific APF game
    async sendReminders(debateId, postingId, userId) {
        const debate = await Debate.findById(debateId).populate('participants').populate('teams');
        if (!debate) throw new Error('Tournament not found');

        const posting = debate.postings?.id(postingId);
        if (!posting) throw new Error('APF posting not found');

        // Use the helper function to send notifications
        const notificationResults = await sendGameNotifications(debate, {
            judgeIds: posting.judges,
            team1Id: posting.team1,
            team2Id: posting.team2,
            scheduledTime: posting.scheduledTime,
            theme: posting.theme,
            batchName: posting.batchName
        }, postingId); // Pass postingId for linking

        // Record reminder event
        if (!posting.reminders) posting.reminders = [];
        posting.reminders.push({ sentAt: new Date(), sentBy: userId });
        await debate.save();

        return notificationResults;
    }

    // TODO: Add method for deleting a posting if needed

  // Gets postings for a debate, with population and filtering
  async getPostingsForDebate(debateId, filters = {}) {
    const debate = await Debate.findById(debateId)
      .populate({
        path: 'postings',
        populate: [
          { path: 'team1', select: 'name members', populate: { path: 'members.userId', select: 'username _id' } },
          { path: 'team2', select: 'name members', populate: { path: 'members.userId', select: 'username _id' } },
          { path: 'judges', select: 'username _id role' },
          { path: 'createdBy', select: 'username _id' },
          { path: 'evaluations.judge', select: 'username _id' } // Populate judge in evaluations if needed
        ]
      })
      .lean(); // Use lean for performance

    if (!debate) throw new Error('Tournament not found');
    if (debate.format !== 'tournament') throw new Error('Debate is not a tournament');

    let postings = debate.postings || [];

    // Apply filters if any
    if (filters.status) {
      postings = postings.filter(p => p.status === filters.status);
    }
    if (filters.batchName) {
      postings = postings.filter(p => p.batchName === filters.batchName);
    }
    // Add more filters as needed

    return postings;
  }

  // Gets a single posting by ID, with population
  async getPostingById(debateId, postingId) {
    const debate = await Debate.findById(debateId)
      .populate({
        path: 'postings',
        match: { _id: postingId }, // Filter postings array during population
        populate: [
          { path: 'team1', select: 'name members', populate: { path: 'members.userId', select: 'username _id' } },
          { path: 'team2', select: 'name members', populate: { path: 'members.userId', select: 'username _id' } },
          { path: 'judges', select: 'username _id role' },
          { path: 'createdBy', select: 'username _id' },
          { path: 'evaluations.judge', select: 'username _id' }
        ]
      })
      .lean();

    if (!debate) throw new Error('Tournament not found');

    const posting = debate.postings?.[0]; // Result is an array, take the first element
    if (!posting) throw new Error('Posting not found');

    return posting;
  }

  // Updates details of a specific posting
  async updatePostingDetails(debateId, postingId, updateData, userId) {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Tournament not found');

    const posting = debate.postings?.id(postingId);
    if (!posting) throw new Error('Posting not found');

    // Update allowed fields
    if (updateData.location !== undefined) posting.location = updateData.location;
    if (updateData.virtualLink !== undefined) posting.virtualLink = updateData.virtualLink;
    if (updateData.scheduledTime !== undefined) posting.scheduledTime = updateData.scheduledTime ? new Date(updateData.scheduledTime) : null;
    if (updateData.theme !== undefined) posting.theme = updateData.theme;
    if (updateData.useCustomModel !== undefined) posting.useCustomModel = !!updateData.useCustomModel;
    if (updateData.status !== undefined) {
        if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(updateData.status)) {
            throw new Error('Invalid status value');
        }
        posting.status = updateData.status;
        if (posting.status === 'completed' && !posting.completedAt) {
            posting.completedAt = new Date();
        }
    }
    if (updateData.judgeIds !== undefined && Array.isArray(updateData.judgeIds)) {
        // Optional: Validate new judges are participants
        const participantIds = debate.participants.map(p => p._id.toString());
        const invalidJudges = updateData.judgeIds.filter(judgeId => !participantIds.includes(judgeId.toString()));
        if (invalidJudges.length > 0) {
            throw new Error(`Judges not found as participants: ${invalidJudges.join(', ')}`);
        }
        posting.judges = updateData.judgeIds;
    }

    // Add audit trail for update if needed
    posting.lastUpdatedAt = new Date();
    posting.lastUpdatedBy = userId; // Assuming userId is passed

    debate.markModified('postings'); // Mark the array element as modified
    await debate.save();

    // Re-fetch the specific posting with populated data to return
    const updatedPosting = await this.getPostingById(debateId, postingId);
    return updatedPosting;
  }

  // Records the result of a posting and updates team stats
  async recordPostingResult(debateId, postingId, resultData, userId) {
    const { winnerTeamId, loserTeamId, team1Score, team2Score, notes } = resultData;

    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Tournament not found');

    const posting = debate.postings?.id(postingId);
    if (!posting) throw new Error('Posting not found');
    if (posting.status === 'completed') throw new Error('Result already recorded for this posting');

    const team1 = debate.teams?.id(posting.team1);
    const team2 = debate.teams?.id(posting.team2);

    if (!team1 || !team2) throw new Error('One or both teams associated with the posting not found');

    // Update posting results
    posting.result = {
      winner: winnerTeamId,
      loser: loserTeamId,
      team1Score: team1Score,
      team2Score: team2Score,
      recordedAt: new Date(),
      recordedBy: userId, // Assuming userId is passed
      notes: notes || ''
    };
    posting.status = 'completed';
    posting.completedAt = new Date();

    // Update team stats
    const winner = debate.teams.id(winnerTeamId);
    const loser = debate.teams.id(loserTeamId);

    if (winner) {
      winner.wins = (winner.wins || 0) + 1;
      // Add points logic if applicable (e.g., winner.points = (winner.points || 0) + 3;)
    }
    if (loser) {
      loser.losses = (loser.losses || 0) + 1;
      // Add points logic if applicable (e.g., loser.points = (loser.points || 0) + 1;) // Example: 1 point for participation
    }

    debate.markModified('postings');
    debate.markModified('teams');
    await debate.save();

    // Re-fetch the specific posting with populated data to return
    const updatedPosting = await this.getPostingById(debateId, postingId);
    return updatedPosting;
  }

  // Deletes a posting from a tournament
  async deletePosting(debateId, postingId) {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Tournament not found');
    if (!debate.postings || debate.postings.length === 0) throw new Error('Tournament has no postings to delete');

    const postingIndex = debate.postings.findIndex(p => p._id.toString() === postingId);
    if (postingIndex === -1) throw new Error('Posting not found in tournament');

    // TODO: Add validation - check if posting has results or evaluations before deleting?

    debate.postings.splice(postingIndex, 1); // Remove the posting
    debate.markModified('postings'); // Mark the array as modified
    await debate.save();

    return { success: true, message: 'Posting deleted successfully' };
  }

}

module.exports = new PostingService();