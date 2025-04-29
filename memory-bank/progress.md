# Progress

This file tracks the project's progress...

*
[2025-04-29 14:52:38] - Conditionally hid the 'Join as Debater' and 'Join as Judge' buttons on the /debates page (within DebateCard component in client/src/components/Debates.js). Buttons are now hidden only for users with the 'organizer' role.

[2025-04-29 15:23:49] - Removed UI elements (status, category, difficulty chips) from `client/src/components/MyDebates.js` (within `DebateCard`) to align with backend model changes where these fields were removed from the `Debate` model.

[2025-04-29 15:27:19] - Completed task: Display `leagueType` on the 'My Debates' page for created tournaments.
- Verified `leagueType` field in `Debate` model.
- Updated `getUserDebates` controller to ensure `leagueType` is returned.
- Modified `DebateCard` component in `MyDebates.js` to display `leagueType` using a Chip.
- Added `leagueTypes` translations to `en`, `kz`, and `ru` locale files.

[2025-04-29 16:29:10] - Removed the 'Categories' filter UI and associated logic from the `/debates` page (`client/src/components/Debates.js`). This involved removing the relevant state, API query parameter handling, filter options definition, and JSX rendering for the categories filter section.

[2025-04-29 16:44:12] - Created backend endpoint shell for team registration:
- Defined route `POST /api/tournaments/:tournamentId/register/team` in `api/routes/tournaments.js`.
- Created controller function shell `registerTeamForTournament` in `api/controllers/entrantController.js`.
- Created service function shell `registerTeam` with TODO comments in `api/services/entrantService.js`.
- Reviewed `api/models/Team.js`; noted it needs modification to store custom field answers.

## Frontend Development

[2025-04-29 16:49:13] - Implemented the `handleSubmit` function in `client/src/components/TeamRegistrationForm.js` to handle team registration form submission. This includes preparing the payload with standard and custom fields, sending a POST request to `/api/tournaments/:tournamentId/register/team`, and basic success/error handling.

[2025-04-29 18:16:40] - Fixed a bug in `client/src/components/Debates.js` where the join debate form/modal wasn't opening for debaters. The button state was also updating incorrectly. Removed an erroneous conditional block in `handleJoinDebate` that was preventing the correct join logic from executing.
