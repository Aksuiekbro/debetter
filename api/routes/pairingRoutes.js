const express = require('express');
const pairingController = require('../controllers/pairingController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(protect);

// Get all pairings for a tournament
router.get('/', pairingController.getPairings);

// Generate random pairings
router.post('/randomize',
  requireRole('admin', 'organizer'),
  pairingController.randomizePairings
);

// Submit pairings
router.post('/submit',
  requireRole('admin', 'organizer'),
  pairingController.submitPairings
);

// Delete a pairing
router.delete('/:pairingId',
  requireRole('admin', 'organizer'),
  pairingController.deletePairing
);

module.exports = router;
