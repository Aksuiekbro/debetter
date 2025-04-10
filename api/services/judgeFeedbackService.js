const JudgeFeedback = require('../models/JudgeFeedback');
const Debate = require('../models/Debate'); // Needed for validation checks if done here, but better in controller
const mongoose = require('mongoose');

/**
 * Submits feedback for a judge regarding a specific posting.
 * Basic validation for duplicates is handled here.
 * More complex authorization (e.g., checking participant/judge roles in the posting)
 * should be handled in the controller before calling this service.
 *
 * @param {object} feedbackData - The feedback data.
 * @param {string} feedbackData.postingId - ID of the posting.
 * @param {string} feedbackData.tournamentId - ID of the tournament (Debate).
 * @param {string} feedbackData.judgeId - ID of the judge being reviewed.
 * @param {string} feedbackData.participantId - ID of the participant submitting feedback.
 * @param {object} feedbackData.criteriaRatings - Ratings object.
 * @param {string} [feedbackData.comment] - Optional comment.
 * @returns {Promise<object>} The saved feedback document.
 * @throws {Error} If feedback from this participant for this judge/posting already exists.
 * @throws {Error} If validation fails or on database error.
 */
const submitFeedback = async (feedbackData) => {
  const { postingId, judgeId, participantId } = feedbackData;

  // Validate ObjectIds before querying
  if (!mongoose.Types.ObjectId.isValid(postingId) ||
      !mongoose.Types.ObjectId.isValid(judgeId) ||
      !mongoose.Types.ObjectId.isValid(participantId) ||
      !mongoose.Types.ObjectId.isValid(feedbackData.tournamentId)) {
    throw new Error('Invalid ID format provided.');
  }


  // Check if feedback already exists (leveraging the unique index)
  const existingFeedback = await JudgeFeedback.findOne({
    postingId: new mongoose.Types.ObjectId(postingId),
    judgeId: new mongoose.Types.ObjectId(judgeId),
    participantId: new mongoose.Types.ObjectId(participantId),
  });

  if (existingFeedback) {
    throw new Error('Feedback already submitted for this judge in this posting.');
  }

  // Create and save the new feedback document
  try {
    const newFeedback = new JudgeFeedback(feedbackData);
    await newFeedback.save();
    return newFeedback;
  } catch (error) {
    // Handle potential validation errors from Mongoose or other DB errors
    if (error.name === 'ValidationError') {
      throw new Error(`Validation failed: ${error.message}`);
    }
    // Handle duplicate key error explicitly, though the check above should catch it
    if (error.code === 11000) {
       throw new Error('Feedback already submitted for this judge in this posting (duplicate key).');
    }
    console.error('Error saving judge feedback:', error);
    throw new Error('Failed to submit feedback due to a server error.');
  }
};

module.exports = {
  submitFeedback,
};