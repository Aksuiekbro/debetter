const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const registrationFieldController = require('../controllers/registrationFieldController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Routes that require organizer permissions
router.post('/', isOrganizer, registrationFieldController.createField);
router.put('/:fieldId', isOrganizer, registrationFieldController.updateField);
router.delete('/:fieldId', isOrganizer, registrationFieldController.deleteField);

// Routes available to all authenticated users
router.get('/', registrationFieldController.getFields);
router.post('/values', registrationFieldController.saveFieldValues);

module.exports = router;
