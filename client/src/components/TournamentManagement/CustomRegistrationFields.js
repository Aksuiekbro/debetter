import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FixedSizeList } from 'react-window'; // Import FixedSizeList
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  ListItem, ListItemText, /* ListItemSecondaryAction removed */ IconButton, // Added IconButton back
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, // Added Dialog components
  Switch, Select, MenuItem, FormControl, InputLabel, Chip, Divider // Added Form components
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

const CustomRegistrationFields = ({ tournament, currentUser }) => { // Removed authLoading prop
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();

  // Log received props for debugging
  console.log('[CustomRegFields] Props received - currentUser exists:', !!currentUser);

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState('');
  const [dialogError, setDialogError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is an organizer for THIS specific tournament (Revised Logic)
  const isTournamentOrganizer = React.useMemo(() => {
    // Ensure consistent string comparison for IDs
    const currentUserIdString = String(currentUser?._id);

    // Handle creator ID (could be object or string)
    const creator = tournament.creator;
    const creatorIdString = creator ? String(creator._id || creator) : null;

    // Handle organizers array (could be array of objects or strings)
    const organizerIds = tournament.organizers?.map(org => String(org?._id || org)) || [];

    const isCreator = creatorIdString === currentUserIdString;
    const isListedOrganizer = organizerIds.includes(currentUserIdString);

    // Add explicit logging before returning
    console.log("[CustomRegFields] Permission Check Values:");
    console.log("  - Current User ID:", currentUserIdString);
    console.log("  - Creator ID:", creatorIdString);
    console.log("  - Organizer IDs:", JSON.stringify(organizerIds));
    console.log("  - Is Creator?", isCreator);
    console.log("  - Is Listed Organizer?", isListedOrganizer);
    console.log("  - Final Result:", isCreator || isListedOrganizer);


    return isCreator || isListedOrganizer;
  }, [currentUser, tournament]);


  // Fetch fields - wrapped in useCallback for stable reference
  const fetchFields = useCallback(async () => {
    // Only proceed if currentUser is valid (redundant check, but safe)
    if (!currentUser) {
        console.warn('[CustomRegFields] fetchFields called without currentUser.');
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(`/api/tournaments/${tournamentId}/registration-fields`);
      console.log('[CustomRegFields] API Response Data:', response.data);

      let foundFields = [];
      if (response.data?.data?.fields && Array.isArray(response.data.data.fields)) {
          console.log('[CustomRegFields] Fields found at response.data.data.fields:', response.data.data.fields);
          foundFields = response.data.data.fields;
      } else if (response.data?.fields && Array.isArray(response.data.fields)) {
          console.log('[CustomRegFields] Fields found directly at response.data.fields:', response.data.fields);
          foundFields = response.data.fields;
      } else if (Array.isArray(response.data)) {
          console.log('[CustomRegFields] Fields found directly in response.data:', response.data);
          foundFields = response.data;
      } else {
          console.warn('[CustomRegFields] Unexpected API response structure:', response.data);
      }
      // Sort fields by displayOrder if available, otherwise keep API order
      foundFields.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
      setFields(foundFields);

    } catch (err) {
      console.error('[CustomRegFields] Error fetching registration fields:', err);
      setError(err.response?.data?.message || t('customFieldsTab.errors.loadFailed', 'Failed to load registration fields'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t, currentUser]); // Add currentUser as dependency

  // Fetch fields only if authenticated (currentUser exists)
  useEffect(() => {
    // Parent now guarantees currentUser exists when this component renders
    if (currentUser) {
      console.log('[CustomRegFields] currentUser exists, fetching fields...');
      fetchFields();
    } else {
      // This case should ideally not happen if parent logic is correct
      console.error('[CustomRegFields] Rendered without currentUser! This should not happen.');
      setLoading(false);
      setError(t('customFieldsTab.errors.notAuthorized', 'You must be logged in to view custom fields.'));
      setFields([]);
    }
  }, [currentUser, fetchFields]);

  // Log fields state whenever it changes
  useEffect(() => {
    console.log('[CustomRegFields] Fields state updated:', fields);
  }, [fields]);

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
    if (!isTournamentOrganizer) return; // Prevent non-organizers from saving
    if (!fieldName.trim()) {
      setDialogError(t('customFieldsTab.errors.nameRequired', 'Field name is required'));
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

      // Define base endpoint for registration fields on tournaments
      const baseEndpoint = `/api/tournaments/${tournamentId}/registration-fields`;
      if (editingField) {
        // Update existing field via PUT on tournaments/:id/registration-fields/:fieldId
        await api.client.put(
          `${baseEndpoint}/${editingField._id}`,
          fieldData
        );
      } else {
        // Create new field via POST to tournaments/:id/registration-fields
        await api.client.post(
          baseEndpoint,
          fieldData
        );
      }

      await fetchFields();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving field:', err);
      setDialogError(err.response?.data?.message || t('customFieldsTab.errors.saveFailed', 'Failed to save field'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle field delete
  const handleDeleteField = async (fieldId) => {
    if (!isTournamentOrganizer) return; // Prevent non-organizers from deleting
    if (!window.confirm(t('customFieldsTab.confirmDelete', 'Are you sure you want to delete this field?'))) {
      return;
    }
    try {
      // DELETE tournaments/:id/registration-fields/:fieldId
      await api.client.delete(
        `/api/tournaments/${tournamentId}/registration-fields/${fieldId}`
      );
      await fetchFields();
    } catch (err) {
      console.error('Error deleting field:', err);
      setError(err.response?.data?.message || t('customFieldsTab.errors.deleteFailed', 'Failed to delete field'));
    }
  };
  
  // Handle field reordering
  const handleDragEnd = async (result) => {
    if (!isTournamentOrganizer) return; // Prevent non-organizers from reordering
    if (!result.destination) return;

    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);

    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      displayOrder: index
    }));

    setFields(updatedFields); // Optimistic update

    try {
      // Send batch update or individual updates
      // Example: Batch update (if backend supports it)
      // await api.client.put(`/api/tournaments/${tournamentId}/registration-fields/order`, { orderedIds: updatedFields.map(f => f._id) });

      // Example: Individual updates (less efficient)
       for (let i = 0; i < updatedFields.length; i++) {
         await api.client.put(`/api/registration-fields/${updatedFields[i]._id}`, { displayOrder: i });
       }
    } catch (err) {
      console.error('Error updating field order:', err);
      setError(t('customFieldsTab.errors.orderUpdateFailed', 'Failed to update field order'));
      await fetchFields(); // Revert to original order on error
    }
  };
  
  // Render field type label
  const getFieldTypeLabel = (type) => {
    switch (type) {
      case 'text': return t('customFieldsTab.fieldType.text', 'Text');
      case 'number': return t('customFieldsTab.fieldType.number', 'Number');
      case 'select': return t('customFieldsTab.fieldType.select', 'Dropdown');
      case 'checkbox': return t('customFieldsTab.fieldType.checkbox', 'Checkbox');
      case 'date': return t('customFieldsTab.fieldType.date', 'Date');
      default: return type;
    }
  };
  
  // Row component for react-window
  const Row = useCallback(({ index, style, data }) => {
    const { fields, isTournamentOrganizer, handleEditField, handleDeleteField, getFieldTypeLabel, t } = data;
    const field = fields[index];

    if (!field) {
      // Handle potential edge case where index might be out of bounds temporarily
      return null;
    }

    return (
      <Draggable
        key={field._id}
        draggableId={field._id}
        index={index}
        isDragDisabled={!isTournamentOrganizer} // Use isTournamentOrganizer here
      >
        {(providedDraggable) => (
          <ListItem
            ref={providedDraggable.innerRef}
            {...providedDraggable.draggableProps}
            divider
            style={{ ...style, ...providedDraggable.draggableProps.style }}
            component="div"
            // Make ListItem a flex container
            sx={{ display: 'flex', alignItems: 'center', width: '100%' }}
          >
            {isTournamentOrganizer && (
              <Box {...providedDraggable.dragHandleProps} sx={{ mr: 1, display: 'flex', alignItems: 'center', cursor: 'grab', flexShrink: 0 }}>
                <DragIcon />
              </Box>
            )}
            {/* Let ListItemText grow to take available space */}
            <ListItemText
              sx={{ flexGrow: 1, mr: 1 }} // Add margin-right to separate from buttons
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {field.fieldName}
                  {field.isRequired && (
                    <Chip
                      label={t('customFieldsTab.required', 'Required')}
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
                  {field.fieldType === 'select' && field.options?.length > 0 && (
                    <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                      {t('customFieldsTab.options', 'Options')}: {field.options.join(', ')}
                    </Typography>
                  )}
                </>
              }
            />
            {/* Remove ListItemSecondaryAction, place Box directly */}
            {isTournamentOrganizer && (
              // Use ml: 'auto' to push this Box to the right
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexShrink: 0 }}>
                <IconButton edge="end" onClick={() => handleEditField(field)} aria-label={t('common.edit', 'Edit')}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteField(field._id)} aria-label={t('common.delete', 'Delete')}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </ListItem>
        )}
      </Draggable>
    );
  }, []); // Dependencies should include handlers if they aren't stable (useCallback)


  // --- Render Logic ---

  // The check for !currentUser at the start is now redundant because the parent handles it.
  // We can remove it or keep it as a safeguard.
  // Let's keep it for now, but log an error if it happens.
  if (!currentUser) {
     console.error('[CustomRegFields] Safeguard triggered: Rendering message because currentUser prop is missing.');
     return (
        <Box sx={{ pt: 2 }}>
            <Alert severity="error">{t('customFieldsTab.errors.unexpectedError', 'An unexpected error occurred. Please ensure you are logged in.')}</Alert>
        </Box>
     );
  }

  // --- If authenticated (currentUser exists), proceed with rendering the component content ---
  console.log("[CustomRegFields] Rendering main content - isTournamentOrganizer:", isTournamentOrganizer);

  return (
    <Box sx={{ pt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('customFieldsTab.title', 'Custom Registration Fields')}
        </Typography>
        {isTournamentOrganizer && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            {t('customFieldsTab.addField', 'Add Field')}
          </Button>
        )}
      </Box>

      {/* Loading State */}
      {loading && (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
             <CircularProgress />
         </Box>
      )}

      {/* Error State */}
      {error && !loading && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {/* Content: No Fields or Fields List */}
      {!loading && !error && (
          fields.length === 0 ? (
              <Typography sx={{ mt: 2 }}>
                  {isTournamentOrganizer
                      ? t('customFieldsTab.noFieldsOrganizer', 'No custom fields defined. Add fields to collect additional information from participants.')
                      : t('customFieldsTab.noFields', 'No custom fields defined for this tournament.')}
              </Typography>
          ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable
                      droppableId="fields"
                      mode="virtual"
                      renderClone={(provided, snapshot, rubric) => {
                          const field = fields[rubric.source.index];
                          return (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps} // Apply drag handle props here too
                              divider
                              style={provided.draggableProps.style}
                              component="div"
                              // Make ListItem a flex container
                              sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 3,
                                display: 'flex', // Add flex display
                                alignItems: 'center', // Align items vertically
                                width: '100%' // Ensure it takes full width
                              }}
                            >
                              {isTournamentOrganizer && (
                                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', cursor: 'grab', flexShrink: 0 }}>
                                  <DragIcon />
                                </Box>
                              )}
                              {/* Let ListItemText grow */}
                              <ListItemText
                                sx={{ flexGrow: 1, mr: 1 }} // Add margin-right
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {field.fieldName}
                                    {field.isRequired && (
                                      <Chip
                                        label={t('customFieldsTab.required', 'Required')}
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
                                    {field.fieldType === 'select' && field.options?.length > 0 && (
                                      <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                        {t('customFieldsTab.options', 'Options')}: {field.options.join(', ')}
                                      </Typography>
                                    )}
                                  </>
                                }
                              />
                              {/* Remove ListItemSecondaryAction, place Box directly */}
                              {isTournamentOrganizer && (
                                // Use ml: 'auto' to push this Box to the right
                                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexShrink: 0 }}>
                                  <IconButton edge="end" onClick={() => handleEditField(field)} aria-label={t('common.edit', 'Edit')}>
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton edge="end" onClick={() => handleDeleteField(field._id)} aria-label={t('common.delete', 'Delete')}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              )}
                            </ListItem>
                          );
                      }}
                  >
                      {(provided) => (
                          <FixedSizeList
                              height={Math.min(500, fields.length * 75 + 10)} // Dynamic height
                              itemCount={fields.length}
                              itemSize={75}
                              width="100%"
                              outerRef={provided.innerRef}
                              itemData={{ // Pass necessary data/handlers
                                  fields,
                                  isTournamentOrganizer,
                                  handleEditField, // Ensure these are stable (useCallback)
                                  handleDeleteField, // Ensure these are stable (useCallback)
                                  getFieldTypeLabel,
                                  t
                              }}
                              {...provided.droppableProps}
                          >
                              {Row}
                          </FixedSizeList>
                      )}
                  </Droppable>
              </DragDropContext>
          )
      )}

      {/* Field Dialog - Conditionally render based on organizer status */}
      {isTournamentOrganizer && (
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
              <DialogTitle>
                  {editingField
                      ? t('customFieldsTab.editField', 'Edit Field')
                      : t('customFieldsTab.addField', 'Add Field')}
              </DialogTitle>
              <DialogContent>
                  <Box sx={{ pt: 1 }}>
                    <TextField
                      label={t('customFieldsTab.fieldName', 'Field Name')}
                      fullWidth
                      margin="normal"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      required
                    />
      
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="field-type-label">
                        {t('customFieldsTab.fieldTypeLabel', 'Field Type')}
                      </InputLabel>
                      <Select
                        labelId="field-type-label"
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value)}
                        label={t('customFieldsTab.fieldTypeLabel', 'Field Type')}
                      >
                        <MenuItem value="text">{t('customFieldsTab.fieldType.text', 'Text')}</MenuItem>
                        <MenuItem value="number">{t('customFieldsTab.fieldType.number', 'Number')}</MenuItem>
                        <MenuItem value="select">{t('customFieldsTab.fieldType.select', 'Dropdown')}</MenuItem>
                        <MenuItem value="checkbox">{t('customFieldsTab.fieldType.checkbox', 'Checkbox')}</MenuItem>
                        <MenuItem value="date">{t('customFieldsTab.fieldType.date', 'Date')}</MenuItem>
                      </Select>
                    </FormControl>
      
                    {fieldType === 'select' && (
                      <TextField
                        label={t('customFieldsTab.optionsLabel', 'Options (comma-separated)')}
                        fullWidth
                        margin="normal"
                        value={options}
                        onChange={(e) => setOptions(e.target.value)}
                        helperText={t('customFieldsTab.optionsHelp', 'Enter options separated by commas')}
                      />
                    )}
      
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isRequired}
                          onChange={(e) => setIsRequired(e.target.checked)}
                        />
                      }
                      label={t('customFieldsTab.required', 'Required')}
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
      )}
    </Box>
  );
};

export default CustomRegistrationFields;
