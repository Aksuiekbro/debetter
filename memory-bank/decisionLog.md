# Decision Log

This file records architectural and implementation decisions...

*
## Decisions

[2025-04-29 14:59:29] - Fixed `/my-debates` page loading issue. The backend API (`/api/debates/user/mydebates`) was returning data in an incorrect format. Updated `api/controllers/debateController.js#getUserDebates` to fetch both created and participated debates and return them structured as `{ created: [...], participated: [...] }`.
[2025-04-29 15:05:13] - Fixed UI placeholder rendering issue (`{{status}}`, `{{category}}`, `{{difficulty}}`). Corrected i18n usage in `client/src/components/Debates.js` for status. Updated rendering logic in `client/src/components/MyDebates.js` for category and difficulty to handle translation keys or direct values.
[2025-04-29 15:15:35] - Second attempt to fix UI placeholder/i18n rendering in 'My Debates' > 'Created' tab. Modified `client/src/components/MyDebates.js` (DebateCard) to detect invalid data for status/category/difficulty and use fallback i18n keys (`myDebates.*.unknown`). Added fallback keys to `client/src/locales/en/translation.json`.

[2025-04-29 15:22:25] - Removed `category` and `difficulty` fields from the `Debate` model schema (`api/models/Debate.js`) as per revised user requirements. These fields are no longer needed for new tournament creation.
[2025-04-29 15:22:48] - Backend Change: Removed `difficulty` and `category` fields from the `Debate` model (`api/models/Debate.js`) as they were reportedly not being saved correctly during tournament creation and interpreted as no longer needed. This requires subsequent frontend updates.
[2025-04-29 15:24:12] - Frontend Cleanup: Removed UI elements (chips) displaying `status`, `category`, and `difficulty` from `DebateCard` in `client/src/components/MyDebates.js` to align with the removal of these fields from the backend `Debate` model.
[2025-04-29 15:27:36] - Feature Update: Added display of `leagueType` for created tournaments on 'My Debates' page. Updated backend API response (`debateController.js`), frontend component (`MyDebates.js`/`DebateCard`), and added i18n keys.
[2025-04-29 15:29:53] - UI Cleanup: Removed the 'Tournaments' link/button from the home page (`client/src/components/Home.js`) as requested, simplifying navigation.
[2025-04-29 16:04:44] - Feature Update: Implemented view-only mode for the Tournament Dashboard. Added `isViewOnly` prop, updated navigation from `MyDebates.js` to pass the flag, and added conditional rendering in `TournamentManagement.js` and its tabs to hide/disable controls for participants.
[2025-04-29 16:11:01] - Navigation Fix: Corrected the target URL for the 'View Details' button in `MyDebates.js` (Participated tab) to point to `/tournaments/:id/manage` instead of `/tournaments/:id`, while ensuring the `isViewOnly: true` state is still passed.
[2025-04-29 16:14:25] - Navigation Consistency: Updated navigation on the main `/debates` page (`client/src/pages/Tournaments.jsx` -> `TournamentCard`) to also direct users to the view-only dashboard (`/tournaments/:id/manage` with `isViewOnly: true`) when clicking on a tournament.
[2025-04-29 16:17:34] - Verified navigation logic in `client/src/pages/Tournaments.jsx` for tournament cards on the `/debates` page. The existing `onClick` handler already correctly navigates to `/tournaments/:id/manage` with `{ state: { isViewOnly: true } }`. No code changes were required in this file for the specified task.
[2025-04-29 16:20:32] - Routing Correction: Identified that the `/debates` path maps to `client/src/components/Debates.js`, not `client/src/pages/Tournaments.jsx`. Previous navigation fixes for the `/debates` page were applied to the wrong component. Need to fix navigation in `Debates.js`.
[2025-04-29 16:21:20] - Navigation Fix (Final): Corrected navigation logic in `client/src/components/Debates.js` (within `DebateCard`). Clicking 'View Details' for tournament-formatted items now correctly routes to `/tournaments/:id/manage` with `isViewOnly: true` state.

## Code Changes & Fixes

[2025-04-29 16:10:40] - Corrected navigation path for 'View Details' button in MyDebates.js (Participated tab). Changed target from `/tournaments/:id` to `/tournaments/:id/manage`, ensuring `isViewOnly: true` state is passed for participants.

## Frontend Changes

[2025-04-29 16:14:09] - Updated navigation for tournament cards on the /debates page (client/src/pages/Tournaments.jsx). The onClick handler now navigates to `/tournaments/:id/manage` with `state: { isViewOnly: true }` to ensure consistent view-only access to the tournament dashboard.
