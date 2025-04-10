const judgeFeedbackService = require('../services/judgeFeedbackService');
const Debate = require('../models/Debate'); // To find the tournament and validate roles
const mongoose = require('mongoose');

/**
 * Controller to handle submission of feedback for a judge on a specific posting.
 */
const submitFeedback = async (req, res) => {
  const { postingId, judgeId } = req.params;
  const { criteriaRatings, comment } = req.body;
  const participantId = req.user._id; // Assumes 'protect' middleware adds user object

  // 1. Validate IDs
  if (!mongoose.Types.ObjectId.isValid(postingId) ||
      !mongoose.Types.ObjectId.isValid(judgeId) ||
      !mongoose.Types.ObjectId.isValid(participantId)) {
    return res.status(400).json({ message: 'Invalid ID format provided.' });
  }

  try {
    // 2. Find the Debate (Tournament) containing the posting
    // We need to search across all Debate documents for the specific postingId
    const debateContainingPosting = await Debate.findOne({ 'postings._id': new mongoose.Types.ObjectId(postingId) });

    if (!debateContainingPosting) {
      return res.status(404).json({ message: 'Posting not found within any tournament.' });
    }

    // 3. Find the specific posting within the Debate document
    const posting = debateContainingPosting.postings.id(postingId);
    if (!posting) {
        // This case should theoretically be covered by the findOne query, but good practice to check
        return res.status(404).json({ message: 'Posting details not found.' });
    }

    // 4. Authorization Checks
    // a) Verify the requesting user was a participant in this posting
    // Participants are stored by team ID, need to check if user belongs to either team
    const participantTeamIds = [posting.teamA?.team, posting.teamB?.team].filter(id => id); // Get team IDs involved
    const isParticipant = participantTeamIds.some(teamId =>
        debateContainingPosting.teams.some(team =>
            team._id.equals(teamId) && team.members.some(member => member.equals(participantId))
        )
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden: You were not a participant in this posting.' });
    }

    // b) Verify the judgeId provided was the judge for this posting
    if (!posting.judge || !posting.judge.equals(judgeId)) {
      return res.status(403).json({ message: 'Forbidden: The specified user was not the judge for this posting.' });
    }

    // 5. Prepare feedback data
    const feedbackData = {
      postingId: new mongoose.Types.ObjectId(postingId),
      tournamentId: debateContainingPosting._id, // Link to the parent Debate document
      judgeId: new mongoose.Types.ObjectId(judgeId),
      participantId: new mongoose.Types.ObjectId(participantId),
      criteriaRatings,
      comment,
    };

    // 6. Call the service to submit feedback
    const savedFeedback = await judgeFeedbackService.submitFeedback(feedbackData);

    // 7. Send success response
    res.status(201).json({ message: 'Feedback submitted successfully.', feedback: savedFeedback });

  } catch (error) {
    console.error('Error submitting judge feedback:', error);
    // Handle specific errors from the service (like duplicates)
    if (error.message.includes('already submitted') || error.message.includes('duplicate key')) {
        return res.status(409).json({ message: error.message }); // Conflict
    }
    if (error.message.includes('Validation failed')) {
        return res.status(400).json({ message: error.message }); // Bad Request
    }
    if (error.message.includes('Invalid ID format')) {
        return res.status(400).json({ message: error.message });
    }
    // Generic server error
    res.status(500).json({ message: 'An error occurred while submitting feedback.' });
  }
};

module.exports = {
  submitFeedback,
};