# Active Context

*Updated on 2025-04-24 after implementing custom registration fields.*

## Current Development Focus

The project has a substantial feature set implemented. The focus remains on refining existing functionalities and implementing specific enhancements based on user feedback/requirements.

### Completed Tasks (This Session)

1.  **Debater Registration Form Enhancement:**
    *   **Backend:** Implemented the `POST /api/debates/:tournamentId/register-team` endpoint and the `registerTeamWithParticipants` controller function. This handles creating an embedded team within the tournament, adding participants linked to that team, validating capacity/status/duplicates, resolving user identifiers, and saving both standard team info (name, institution) and custom registration field values (using the existing `registrationFieldService`). Uses a transaction for atomicity.
    *   **Frontend (Organizer):** Integrated the existing `CustomRegistrationFields.js` component into `TournamentManagement.js` via a new tab, allowing organizers to define custom fields (text, number, select, checkbox, date) for their tournaments. Corrected API endpoints used in this component.
    *   **Frontend (Debater):** Updated `RegistrationForm.js` to correctly collect standard fields (Team Name, Participant Names, School/University) and dynamically render/collect custom fields defined by the organizer. Implemented the submission logic to call the new `/register-team` backend endpoint.

### Remaining Priorities (From Previous Context)

*   **UI Simplification:** Remove specified fields (Format, Category, Complexity [replace with League], Tournament Mode, Duration) from the tournament creation/management interface.
*   **Schedule Refactor:** Change the 'Schedule' section to support photo uploads instead of detailed form entries.
*   **Judge Management Enhancement:** Implement functionality for organizers to manually add judges with their data in a dedicated section. Enable check-in for judges.
*   **Team/Participant Structure Refactor:** Merge "Teams" and "Participants" sections into a single "Teams" section. Enable check-in within this section. Ensure organizers have full edit access. *(Note: The registration implementation assumes teams are embedded in the tournament document, which aligns with merging concepts).*

### Technical Implementation Details

- **Custom Fields:** Leveraged existing backend infrastructure (`RegistrationField` model, `registrationFieldService`, `registrationFieldController`) for defining custom fields. Custom values are stored in `Debate.participants.customFields`.
- **Standard Fields:** Standard team info (Name, Institution) stored in `Debate.teams` (embedded array). Participant names are derived from the `User` model linked via `Debate.teams.members.userId`.
- **Frontend:** Used Material-UI components, React hooks, and `react-beautiful-dnd` for the organizer UI. Used Formik/Yup principles (though direct state management was used in `RegistrationForm.js`) for the debater form.

## Blocking Issues

- None directly related to the completed custom fields task. Previous blocking issues regarding judge data and team/participant merging strategy remain relevant for future tasks.

## Decisions Needed

- Final UI design for the photo upload in the Schedule section.
- Specific data fields required for manual Judge entry.
- Strategy for handling existing "Participant" data when merging into "Teams" (if applicable beyond the current embedded structure).

## Resources

- MERN stack codebase.
- Custom registration field system now integrated into Organizer and Debater flows.
- Relevant files modified:
    - `api/controllers/debateController.js`
    - `api/routes/debateRoutes.js`
    - `client/src/components/TournamentManagement.js`
    - `client/src/components/TournamentManagement/CustomRegistrationFields.js`
    - `client/src/components/TournamentRegistration/RegistrationForm.js`

## Notes

The custom registration field functionality is now implemented, allowing organizers to define fields and debaters to fill them during registration. The next steps should focus on the remaining priorities listed above.
