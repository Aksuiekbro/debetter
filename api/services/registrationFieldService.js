const RegistrationField = require('../models/RegistrationField');
const Debate = require('../models/Debate'); // Import Debate model
const mongoose = require('mongoose');

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
    // Check if the DEBATE (acting as a tournament) exists and is in upcoming status
    const debate = await Debate.findById(tournamentId);

    if (!debate) {
      console.error(`[Service] createField failed: Debate (tournament) with ID ${tournamentId} not found.`);
      throw new Error(`Debate (tournament) not found with ID: ${tournamentId}`);
    }

    // Check status on the debate object
    if (debate.status !== 'upcoming') {
      throw new Error('Custom fields can only be added to upcoming tournaments (debates)');
    }

    // Create the field, referencing the debate ID
    const field = await RegistrationField.create({
      tournament: tournamentId, // Keep field name as 'tournament' for consistency? Or rename?
      // Consider renaming the field in RegistrationField model to debateId or entityId if applicable
      fieldName: fieldData.fieldName,
      fieldType: fieldData.fieldType,
      isRequired: fieldData.isRequired || false,
      options: fieldData.options || [],
      displayOrder: fieldData.displayOrder || 0,
      createdBy: userId
    });

    // Update the debate to indicate it has custom fields
    // Check if Debate model has a 'customRegistrationFields' field
    if (debate.customRegistrationFields !== undefined && !debate.customRegistrationFields) {
      debate.customRegistrationFields = true;
      await debate.save();
    }

    return field;
  }
  
  /**
   * Get all custom registration fields for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Array>} Array of registration fields
   */
  async getFieldsByTournament(tournamentId) {
    // This method just queries RegistrationField, might not need changes unless validation is added
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

    // Check if this was the last field for the DEBATE
    const remainingFields = await RegistrationField.countDocuments({ tournament: field.tournament });
    if (remainingFields === 0) {
      // Update the DEBATE to indicate it no longer has custom fields
      // Ensure Debate model has 'customRegistrationFields' field
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
    // Find the DEBATE
    const debate = await Debate.findById(tournamentId);
    if (!debate) {
      throw new Error('Debate (tournament) not found');
    }

    // Find the participant in the DEBATE
    // Adjust participant lookup based on how participants are stored in Debate model
    // Assuming debate.participants or debate.teams structure
    let participantIndex = -1;
    if (debate.participants) {
        participantIndex = debate.participants.findIndex(
            p => p.userId?.toString() === userId
        );
    } else if (debate.teams) {
        // Need logic to find the correct team/participant within teams
        console.warn("[Service] saveParticipantFieldValues needs logic for 'teams' structure in Debate model");
        // Placeholder: find team, then member
        // This needs refinement based on actual Debate schema
    }

    if (participantIndex === -1) {
      throw new Error('Participant not found in this tournament (debate)');
    }

    // Get all fields for validation (using the existing method is fine)
    const fields = await this.getFieldsByTournament(tournamentId);

    // Validate required fields
    const requiredFields = fields.filter(f => f.isRequired).map(f => f.fieldName);
    for (const fieldName of requiredFields) {
      if (!fieldValues[fieldName] && fieldValues[fieldName] !== false) {
        throw new Error(`Field "${fieldName}" is required`);
      }
    }
    
    // Initialize customFields if it doesn't exist on the participant object
    // Adjust path based on Debate model structure
    const participantRef = debate.participants[participantIndex]; // Adjust if using teams
    if (!participantRef.customFields) {
      participantRef.customFields = new Map();
    }

    // Update the custom fields
    for (const [key, value] of Object.entries(fieldValues)) {
      participantRef.customFields.set(key, value);
    }

    // Mark the array/document as modified
    debate.markModified('participants'); // Adjust if using teams
    await debate.save();

    return participantRef;
  }

}

module.exports = new RegistrationFieldService();
