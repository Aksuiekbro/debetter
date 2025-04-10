# Tournament Schedule Feature - Backend Design Plan

**Date:** 2025-04-06

**Status:** Approved

## 1. Data Storage

*   **Approach:** Create a separate `ScheduleItem` Mongoose model.
*   **Justification:** Keeps the `Debate` model leaner, offers potential future query flexibility, and aligns with user preference. Introduces a new `scheduleitems` collection.

## 2. Schema Design (`ScheduleItem` Model)

**File:** `api/models/ScheduleItem.js`

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleItemSchema = new Schema({
  tournamentId: { // Reference to the Debate (Tournament)
    type: Schema.Types.ObjectId,
    ref: 'Debate', // Link to the Debate model
    required: true,
    index: true // Index for efficient querying by tournament
  },
  time: {
    type: Date,
    required: [true, 'Schedule item time is required']
  },
  eventDescription: {
    type: String,
    required: [true, 'Schedule item event description is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
    // Optional, might be virtual/online
  },
  createdBy: { // Track who created the item
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('ScheduleItem', scheduleItemSchema);
```

**Relationship Diagram (Mermaid):**

```mermaid
graph TD
    Debate -- "1..*" ScheduleItem : contains
```

## 3. API Endpoints

*   **Base Path:** `/api/debates/:tournamentId/schedule`
*   **`POST /api/debates/:tournamentId/schedule`**
    *   **Purpose:** Create a new schedule item linked to the tournament.
    *   **Authorization:** Organizer/Admin (for the specific tournament).
    *   **Body:** `{ time: Date, eventDescription: String, location?: String }`
*   **`GET /api/debates/:tournamentId/schedule`**
    *   **Purpose:** Retrieve all schedule items for the tournament.
    *   **Authorization:** Authenticated user.
*   **`PUT /api/debates/:tournamentId/schedule/:itemId`**
    *   **Purpose:** Update a specific schedule item.
    *   **Authorization:** Organizer/Admin (for the specific tournament).
    *   **Body:** `{ time?: Date, eventDescription?: String, location?: String }`
*   **`DELETE /api/debates/:tournamentId/schedule/:itemId`**
    *   **Purpose:** Delete a specific schedule item.
    *   **Authorization:** Organizer/Admin (for the specific tournament).

## 4. Backend Components Outline

*   **Routes (`api/routes/scheduleRoutes.js`):**
    *   Map endpoints to controller functions.
    *   Apply authentication and tournament-specific authorization middleware.
*   **Controller (`api/controllers/scheduleController.js`):**
    *   `createScheduleItem`: Handles POST, validates input, checks permissions, calls service.
    *   `getScheduleItemsForTournament`: Handles GET, calls service.
    *   `updateScheduleItem`: Handles PUT, validates input, checks permissions, calls service.
    *   `deleteScheduleItem`: Handles DELETE, checks permissions, calls service.
*   **Service (`api/services/scheduleService.js`):**
    *   `create`: Creates `ScheduleItem` document.
    *   `findByTournamentId`: Finds all items for a tournament.
    *   `update`: Finds item by ID, verifies `tournamentId`, updates.
    *   `delete`: Finds item by ID, verifies `tournamentId`, deletes.