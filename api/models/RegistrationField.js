const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Schema for custom registration fields that organizers can define for tournaments
 */
const registrationFieldSchema = new Schema({
  tournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'select', 'checkbox', 'date'],
    default: 'text'
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  options: {
    type: [String], // For select fields, contains the available options
    default: []
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Compound index for tournament and fieldName to ensure uniqueness
registrationFieldSchema.index({ tournament: 1, fieldName: 1 }, { unique: true });

const RegistrationField = mongoose.model('RegistrationField', registrationFieldSchema);

module.exports = RegistrationField;
