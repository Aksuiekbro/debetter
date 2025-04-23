# Active Context

*Updated on 2025-04-23 after file structure analysis and user request review.*

## Current Development Focus

The project has a substantial feature set implemented. The current focus is shifting towards refining existing functionalities and implementing specific enhancements based on user feedback/requirements. This includes UI cleanup, feature modifications, and adding new capabilities to improve tournament management workflows.

### Current Priorities (Based on User Request)

1.  **UI Simplification:** Remove specified fields (Format, Category, Complexity [replace with League], Tournament Mode, Duration) from the tournament creation/management interface.
2.  **Schedule Refactor:** Change the 'Schedule' section to support photo uploads instead of detailed form entries.
3.  **Judge Management Enhancement:** Implement functionality for organizers to manually add judges with their data in a dedicated section. Enable check-in for judges.
4.  **Team/Participant Structure Refactor:** Merge "Teams" and "Participants" sections into a single "Teams" section. Enable check-in within this section. Ensure organizers have full edit access.
5.  **Debater Registration Form:** Define and enforce required fields (Team Name, Participant Names, School/University, etc.) for debater registration.

### Technical Requirements

- Modify relevant React components (e.g., `CreateTournamentForm.js`, `TournamentManagement.js` tabs, `ScheduleView.js`, `TeamsTab.js`, `JudgesTab.js`, `EntrantsTab.js`) to reflect UI changes.
- Update backend models (`Tournament.js`, `ScheduleItem.js`, `User.js` for judges, `Team.js`) and APIs (`tournamentService.js`, `scheduleService.js`, `judgeService.js`, `teamService.js`, `entrantService.js`, `registrationFieldService.js`) to support the requested changes.
- Implement file upload handling for the Schedule section (likely using `cloudStorageService.js` and `uploadMiddleware.js`).
- Ensure data consistency and potentially handle data migration if merging Teams/Participants requires schema changes.
- Update validation logic for registration forms.

## Current Tasks

- **Frontend:**
    - Modify `CreateTournamentForm.js` (or similar component) to remove fields and add "School/University League" dropdown.
    - Update `ScheduleView.js` (or relevant component) to replace form with photo upload interface.
    - Create/Update UI components within `TournamentManagement.js` for dedicated Judge addition (`JudgesTab.js`, `JudgeDialog.js`).
    - Refactor `TeamsTab.js`, `EntrantsTab.js`, `TeamDialog.js`, `EntrantDialog.js` into a unified "Teams" management interface.
    - Implement check-in functionality directly within the updated Teams and Judges tabs/sections.
    - Ensure edit functionality is present and enabled for organizers in Teams/Judges sections.
    - Update debater registration forms (`RegistrationForm.js`?) to include and require specified fields.
- **Backend:**
    - Update `Tournament.js` model to remove deprecated fields and add `league` field. Modify corresponding service/controller.
    - Update `ScheduleItem.js` model/service/controller to handle image references instead of detailed fields. Implement image upload endpoint.
    - Implement API endpoints (`judgeRoutes.js`, `judgeController.js`, `judgeService.js`) for manually adding/managing judges. Update `User.js` model if needed for judge-specific data.
    - Refactor backend logic (`entrantController.js`, `teamService.js`, `entrantService.js`, `Team.js` model) to handle the merged "Teams" concept.
    - Implement/Update check-in API endpoints (`checkInController.js`) for Teams and Judges.
    - Implement/Update API endpoints (`registrationFieldController.js`, `registrationFieldService.js`) to manage required fields for debater registration.

## Blocking Issues

- Need to confirm the exact data fields required for manually added judges.
- Potential complexity in merging "Teams" and "Participants" data if they have significantly diverged in structure or usage.

## Decisions Needed

- Final UI design for the photo upload in the Schedule section.
- Specific data fields required for manual Judge entry (Name, Affiliation, Contact, etc.?).
- Strategy for handling existing "Participant" data when merging into "Teams".
- Confirmation of all fields to be required during debater registration.

## Resources

- Existing MERN stack codebase with extensive features already implemented.
- File structure follows standard conventions (MVC on backend, component-based on frontend).
- Material-UI is used for frontend components.
- `docs/` folder contains potentially relevant planning documents.

## Notes

The memory bank (`progress.md`, `activeContext.md`) has been updated to reflect the project's actual advanced state. The immediate focus is now executing the list of changes provided in the user's initial request for this task session.
