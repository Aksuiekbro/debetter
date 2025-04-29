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
