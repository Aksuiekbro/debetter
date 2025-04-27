const registrationFieldService = require('../services/registrationFieldService');

/**
 * Create a new custom registration field for a tournament
 */
exports.createField = async (req, res) => {
  try {
    // Parent router defines ':id' as the tournament identifier
    const { id: tournamentId } = req.params;
    const userId = req.user._id;

    const field = await registrationFieldService.createField(
      tournamentId,
      req.body,
      userId
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        field
      }
    });
  } catch (error) {
    console.error('Error creating registration field:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get all custom registration fields for a tournament
 */
exports.getFields = async (req, res) => {
  try {
    // Parent router defines ':id' as the tournament identifier
    const { id: tournamentId } = req.params;
    const fields = await registrationFieldService.getFieldsByTournament(tournamentId);
    
    res.status(200).json({
      status: 'success',
      results: fields.length,
      data: {
        fields
      }
    });
  } catch (error) {
    console.error('Error getting registration fields:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Update a custom registration field
 */
exports.updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await registrationFieldService.updateField(
      fieldId,
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        field
      }
    });
  } catch (error) {
    console.error('Error updating registration field:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Delete a custom registration field
 */
exports.deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    await registrationFieldService.deleteField(fieldId);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting registration field:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Save participant's custom field values
 */
exports.saveFieldValues = async (req, res) => {
  try {
    // Parent router defines ':id' as the tournament identifier
    const { id: tournamentId } = req.params;
    const userId = req.user._id;

    const participant = await registrationFieldService.saveParticipantFieldValues(
      tournamentId,
      userId,
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        participant
      }
    });
  } catch (error) {
    console.error('Error saving field values:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
