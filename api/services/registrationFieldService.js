const RegistrationField = require('../models/RegistrationField');
const Debate = require('../models/Debate');

/**
 * Service for managing custom registration fields for tournaments
 */
class RegistrationFieldService {
  /**
   * Create a new custom registration field for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @param {Object} fieldData - The field data (name, type, etc.)
   * @param {string} userId - The ID of the user creating the field
   * @returns {Promise<Object>} The created field
   */
  async createField(tournamentId, fieldData, userId) {
    // Check if tournament exists and is in upcoming status
    const tournament = await Debate.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    
    if (tournament.status !== 'upcoming') {
      throw new Error('Custom fields can only be added to upcoming tournaments');
    }
    
    // Create the field
    const field = await RegistrationField.create({
      tournament: tournamentId,
      fieldName: fieldData.fieldName,
      fieldType: fieldData.fieldType,
      isRequired: fieldData.isRequired || false,
      options: fieldData.options || [],
      displayOrder: fieldData.displayOrder || 0,
      createdBy: userId
    });
    
    // Update the tournament to indicate it has custom fields
    if (!tournament.customRegistrationFields) {
      tournament.customRegistrationFields = true;
      await tournament.save();
    }
    
    return field;
  }
  
  /**
   * Get all custom registration fields for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Array>} Array of registration fields
   */
  async getFieldsByTournament(tournamentId) {
    return await RegistrationField.find({ tournament: tournamentId })
      .sort({ displayOrder: 1 })
      .lean();
  }
  
  /**
   * Update a custom registration field
   * @param {string} fieldId - The ID of the field to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated field
   */
  async updateField(fieldId, updateData) {
    const field = await RegistrationField.findById(fieldId);
    if (!field) {
      throw new Error('Registration field not found');
    }
    
    // Update allowed fields
    if (updateData.fieldName !== undefined) field.fieldName = updateData.fieldName;
    if (updateData.fieldType !== undefined) field.fieldType = updateData.fieldType;
    if (updateData.isRequired !== undefined) field.isRequired = updateData.isRequired;
    if (updateData.options !== undefined) field.options = updateData.options;
    if (updateData.displayOrder !== undefined) field.displayOrder = updateData.displayOrder;
    
    await field.save();
    return field;
  }
  
  /**
   * Delete a custom registration field
   * @param {string} fieldId - The ID of the field to delete
   * @returns {Promise<void>}
   */
  async deleteField(fieldId) {
    const field = await RegistrationField.findById(fieldId);
    if (!field) {
      throw new Error('Registration field not found');
    }
    
    await RegistrationField.findByIdAndDelete(fieldId);
    
    // Check if this was the last field for the tournament
    const remainingFields = await RegistrationField.countDocuments({ tournament: field.tournament });
    if (remainingFields === 0) {
      // Update the tournament to indicate it no longer has custom fields
      await Debate.findByIdAndUpdate(field.tournament, { customRegistrationFields: false });
    }
  }
  
  /**
   * Save participant's custom field values
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} userId - The ID of the participant
   * @param {Object} fieldValues - Object containing field values with field names as keys
   * @returns {Promise<Object>} Updated participant data
   */
  async saveParticipantFieldValues(tournamentId, userId, fieldValues) {
    const tournament = await Debate.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    
    // Find the participant in the tournament
    const participantIndex = tournament.participants.findIndex(
      p => p.userId.toString() === userId
    );
    
    if (participantIndex === -1) {
      throw new Error('Participant not found in this tournament');
    }
    
    // Get all fields for validation
    const fields = await this.getFieldsByTournament(tournamentId);
    
    // Validate required fields
    const requiredFields = fields.filter(f => f.isRequired).map(f => f.fieldName);
    for (const fieldName of requiredFields) {
      if (!fieldValues[fieldName] && fieldValues[fieldName] !== false) {
        throw new Error(`Field "${fieldName}" is required`);
      }
    }
    
    // Initialize customFields if it doesn't exist
    if (!tournament.participants[participantIndex].customFields) {
      tournament.participants[participantIndex].customFields = new Map();
    }
    
    // Update the custom fields
    for (const [key, value] of Object.entries(fieldValues)) {
      tournament.participants[participantIndex].customFields.set(key, value);
    }
    
    // Mark the array as modified
    tournament.markModified('participants');
    await tournament.save();
    
    return tournament.participants[participantIndex];
  }
}

module.exports = new RegistrationFieldService();
