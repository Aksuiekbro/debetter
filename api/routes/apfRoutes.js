const express = require('express');
const router = express.Router();
const { 
    getApfTabulation,
    submitApfEvaluation,
    getJudgeAssignedDebates,
    getApfEvaluation, // Added comma here
    getDebaterFeedback // Added for debater feedback
} = require('../controllers/apfController');
const { submitFeedback: submitJudgeFeedback } = require('../controllers/judgeFeedbackController'); // Import new controller
const { protect } = require('../middleware/authMiddleware');

// APF tabulation routes
router.get('/tabulation', getApfTabulation);
router.get('/tabulation/:tournamentId', getApfTabulation);

// Judge assignment routes
router.get('/assignments', protect, getJudgeAssignedDebates);

// Evaluation routes
router.post('/:debateId/evaluate', protect, submitApfEvaluation);
router.get('/evaluations/:evaluationId', protect, getApfEvaluation);

// Debater feedback route
router.get('/feedback/:debateId/:postingId', protect, getDebaterFeedback);

// Judge feedback submission route
router.post('/postings/:postingId/judge-feedback/:judgeId', protect, submitJudgeFeedback);

module.exports = router;