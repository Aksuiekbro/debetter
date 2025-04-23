# Active Context: Tournament Creation & Management Refactor

## Current Focus

*   Refactoring tournament creation and management UI/backend based on user request.
*   Updating Memory Bank to reflect completed changes.

## Recent Changes

*   **Tournament Creation Form (`client/src/components/CreateTournamentForm.js`):**
    *   Removed fields: "Format", "Category", "Difficulty". (Note: The request mentioned removing "Tournament Mode" and "Duration", but these were not present in the form code).
    *   Added "League" field with options "Школьная" (School) and "Студенческая" (Student).
    *   Changed "Schedule" input to an image file upload.
*   **Backend Model (`api/models/Debate.js`):**
    *   Removed fields: `category`, `difficulty`, `tournamentFormats`.
    *   Added `leagueType` field (enum: `['school', 'university']`, required).
    *   Added `scheduleImageUrl` field (String).
*   **Backend Controller (`api/controllers/debateController.js`):**
    *   Updated `createDebate` function to remove processing for deleted fields.
    *   Added validation for the new `leagueType`.
    *   Added logic to handle `scheduleImage` file upload using `cloudStorageService` and save the URL to `scheduleImageUrl`.
*   **Backend Routes (`api/routes/debateRoutes.js`):**
    *   Added `upload.single('scheduleImage')` middleware to the `POST /api/debates` route.
*   **i18n Files (`client/public/locales/*`):**
    *   Updated `en`, `kz`, `ru` translation files to remove keys for deleted fields and add/update keys for "League" and "Schedule Upload". Removed invalid comments.
*   **Tournament Management UI (`client/src/components/TournamentManagement.js`):**
    *   Removed the `EntrantsTab` component import and usage.
    *   Adjusted tab indices accordingly.
    *   Passed `entrants` data and check-in handlers to `TeamsTab`.
*   **Teams Tab (`client/src/components/TournamentManagement/TeamsTab.js`):**
    *   Updated props to explicitly receive `entrants`, `onCheckInEntrant`, `onCheckOutEntrant`. (UI remains focused on team-level check-in for now).
*   **Judges Tab (`client/src/components/TournamentManagement/JudgesTab.js`):**
    *   Added check-in/out buttons for each judge, using `onCheckInJudge` and `onCheckOutJudge` props.
*   **Judge Management Backend:**
    *   Confirmed existing `POST /api/debates/:id/judges` route and `addJudge` controller/service logic are suitable for adding judges via the dialog.
*   **Custom Registration Fields (`client/src/components/TournamentManagement/CustomRegistrationFields.js`):**
    *   Confirmed existing component allows organizers to add required fields like "Team Name", "Participant Names", "School/University". No changes needed.

## Next Steps

1.  Update `progress.md` in the Memory Bank.
2.  Remove unused files: `client/src/components/TournamentManagement/EntrantsTab.js` and `client/src/components/TournamentManagement/EntrantDialog.js`.
3.  Attempt completion.

## Active Decisions & Considerations

*   The request to merge "Teams" and "Participants" was interpreted as removing the separate "Entrants" tab and ensuring team/member management happens within the "Teams" tab context. Check-in functionality remains primarily at the team/judge level for now, as requested.
*   The requirement for specific registration fields (Team Name, Participant Names, School/University) is handled by the existing Custom Registration Fields feature, allowing organizers to configure them as needed.

## Important Patterns & Preferences

*   Continue maintaining documentation in Memory Bank.
*   Leverage existing services and components where possible.

## Learnings & Insights

*   The `Debate` model is used as the primary document for storing tournament information.
*   The system has a robust custom registration field mechanism.
*   Check-in logic exists at both the individual entrant level (via hooks) and potentially team/judge level (needs verification in backend services if `onCheckInTeam`/`onCheckOutTeam` are fully implemented).
