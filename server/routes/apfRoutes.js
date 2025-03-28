const express = require('express');
const router = express.Router();
const { 
    getApfTabulation,
    submitApfEvaluation,
    getJudgeAssignedDebates,
    getApfEvaluation
} = require('../controllers/apfController');
const { protect } = require('../middleware/authMiddleware');

// APF tabulation routes
router.get('/tabulation', getApfTabulation);
router.get('/tabulation/:tournamentId', getApfTabulation);

// Judge assignment routes
router.get('/assignments', protect, getJudgeAssignedDebates);

// Evaluation routes
router.post('/:debateId/evaluate', protect, submitApfEvaluation);
router.get('/evaluations/:evaluationId', protect, getApfEvaluation);

module.exports = router;