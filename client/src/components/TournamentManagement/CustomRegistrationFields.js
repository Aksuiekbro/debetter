import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Switch, Select, MenuItem, FormControl, InputLabel, Chip, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { api } from '../../config/api';

const CustomRegistrationFields = ({ tournament, currentUser }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState('');
  const [dialogError, setDialogError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user is organizer
  const isOrganizer = currentUser && currentUser.role === 'organizer';
  
  // Fetch fields
  const fetchFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(`/api/debates/${tournamentId}/registration-fields`);
      setFields(response.data.data.fields);
    } catch (err) {
      console.error('Error fetching registration fields:', err);
      setError(err.response?.data?.message || 'Failed to load registration fields');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFields();
  }, [tournamentId]);
  
  // Handle dialog open for new field
  const handleOpenDialog = () => {
    setEditingField(null);
    setFieldName('');
    setFieldType('text');
    setIsRequired(false);
    setOptions('');
    setDialogError(null);
    setOpenDialog(true);
  };
  
  // Handle dialog open for editing field
  const handleEditField = (field) => {
    setEditingField(field);
    setFieldName(field.fieldName);
    setFieldType(field.fieldType);
    setIsRequired(field.isRequired);
    setOptions(field.options.join(', '));
    setDialogError(null);
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle field save
  const handleSaveField = async () => {
    if (!fieldName.trim()) {
      setDialogError('Field name is required');
      return;
    }
    
    setIsSubmitting(true);
    setDialogError(null);
    
    try {
      const fieldData = {
        fieldName,
        fieldType,
        isRequired,
        options: fieldType === 'select' ? options.split(',').map(opt => opt.trim()).filter(opt => opt) : []
      };
      
      if (editingField) {
        // Update existing field
        await api.client.put(`/api/debates/${tournamentId}/registration-fields/${editingField._id}`, fieldData);
      } else {
        // Create new field
        await api.client.post(`/api/debates/${tournamentId}/registration-fields`, fieldData);
      }
      
      await fetchFields();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving field:', err);
      setDialogError(err.response?.data?.message || 'Failed to save field');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle field delete
  const handleDeleteField = async (fieldId) => {
    if (!window.confirm(t('customRegistrationFields.confirmDelete', 'Are you sure you want to delete this field?'))) {
      return;
    }
    
    try {
      await api.client.delete(`/api/debates/${tournamentId}/registration-fields/${fieldId}`);
      await fetchFields();
    } catch (err) {
      console.error('Error deleting field:', err);
      setError(err.response?.data?.message || 'Failed to delete field');
    }
  };
  
  // Handle field reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);
    
    // Update display order
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      displayOrder: index
    }));
    
    setFields(updatedFields);
    
    // Update display order in database
    try {
      for (const field of updatedFields) {
        await api.client.put(`/api/debates/${tournamentId}/registration-fields/${field._id}`, {
          displayOrder: field.displayOrder
        });
      }
    } catch (err) {
      console.error('Error updating field order:', err);
      setError('Failed to update field order');
      await fetchFields(); // Reload original order
    }
  };
  
  // Render field type label
  const getFieldTypeLabel = (type) => {
    switch (type) {
      case 'text': return t('customRegistrationFields.textField', 'Text');
      case 'number': return t('customRegistrationFields.numberField', 'Number');
      case 'select': return t('customRegistrationFields.selectField', 'Dropdown');
      case 'checkbox': return t('customRegistrationFields.checkboxField', 'Checkbox');
      case 'date': return t('customRegistrationFields.dateField', 'Date');
      default: return type;
    }
  };
  
  return (
    <Box sx={{ pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('customRegistrationFields.title', 'Custom Registration Fields')}
        </Typography>
        {isOrganizer && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            {t('customRegistrationFields.addField', 'Add Field')}
          </Button>
        )}
      </Box>
      
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      
      {!loading && !error && fields.length === 0 && (
        <Typography>
          {isOrganizer
            ? t('customRegistrationFields.noFieldsOrganizer', 'No custom fields defined. Add fields to collect additional information from participants.')
            : t('customRegistrationFields.noFields', 'No custom fields defined for this tournament.')}
        </Typography>
      )}
      
      {!loading && !error && fields.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <List
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ width: '100%', bgcolor: 'background.paper' }}
              >
                {fields.map((field, index) => (
                  <Draggable
                    key={field._id}
                    draggableId={field._id}
                    index={index}
                    isDragDisabled={!isOrganizer}
                  >
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        divider
                      >
                        {isOrganizer && (
                          <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                            <DragIcon />
                          </Box>
                        )}
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {field.fieldName}
                              {field.isRequired && (
                                <Chip
                                  label={t('customRegistrationFields.required', 'Required')}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {getFieldTypeLabel(field.fieldType)}
                              </Typography>
                              {field.fieldType === 'select' && field.options.length > 0 && (
                                <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                  {t('customRegistrationFields.options', 'Options')}: {field.options.join(', ')}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        {isOrganizer && (
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleEditField(field)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteField(field._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      {/* Field Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingField
            ? t('customRegistrationFields.editField', 'Edit Field')
            : t('customRegistrationFields.addField', 'Add Field')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label={t('customRegistrationFields.fieldName', 'Field Name')}
              fullWidth
              margin="normal"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="field-type-label">
                {t('customRegistrationFields.fieldType', 'Field Type')}
              </InputLabel>
              <Select
                labelId="field-type-label"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                label={t('customRegistrationFields.fieldType', 'Field Type')}
              >
                <MenuItem value="text">{t('customRegistrationFields.textField', 'Text')}</MenuItem>
                <MenuItem value="number">{t('customRegistrationFields.numberField', 'Number')}</MenuItem>
                <MenuItem value="select">{t('customRegistrationFields.selectField', 'Dropdown')}</MenuItem>
                <MenuItem value="checkbox">{t('customRegistrationFields.checkboxField', 'Checkbox')}</MenuItem>
                <MenuItem value="date">{t('customRegistrationFields.dateField', 'Date')}</MenuItem>
              </Select>
            </FormControl>
            
            {fieldType === 'select' && (
              <TextField
                label={t('customRegistrationFields.options', 'Options (comma-separated)')}
                fullWidth
                margin="normal"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                helperText={t('customRegistrationFields.optionsHelp', 'Enter options separated by commas')}
              />
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
              }
              label={t('customRegistrationFields.required', 'Required')}
              sx={{ mt: 1 }}
            />
            
            {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSaveField}
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
            disabled={isSubmitting || !fieldName.trim()}
          >
            {t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomRegistrationFields;
