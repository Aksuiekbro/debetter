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
[2025-04-29 16:24:20] - UI Cleanup: Removed status display element (`Typography` lines 70-72) from `DebateCard` within `client/src/components/Debates.js` to resolve placeholder issue on the main `/debates` page.
[2025-04-29 16:29:29] - UI Cleanup: Removed 'Categories' filter UI and logic from the `/debates` page (`client/src/components/Debates.js`).
[2025-04-29 16:30:11] - UI Cleanup: Removed 'Mode: solo' display element (`Typography`) from `DebateCard` within `client/src/components/Debates.js`.
[2025-04-29 16:31:17] - Backend Model Cleanup: Removed the `mode` field (enum: ['solo', 'duo']) entirely from the `Debate` model schema (`api/models/Debate.js`) to align with the removal of this concept.
[2025-04-29 16:45:29] - Backend Model Update: Added `customFieldAnswers` array field to `api/models/Team.js` schema to store answers for custom registration fields.
[2025-04-29 16:49:33] - Feature Implementation: Completed Team Registration flow. Implemented `handleSubmit` in `TeamRegistrationForm.js` to gather form data (standard + custom), format payload, and POST to `/api/tournaments/:id/register/team` endpoint. Includes basic success/error handling.
[2025-04-29 16:59:20] - Feature Update: Added 'Register Your Team' button and modal logic to `DebateCard` within `client/src/components/Debates.js`, allowing registration initiation from the main `/debates` list page.
[2025-04-29 17:18:42] - Issue Resolution: Investigated login failure reported by user. No specific code error found in login flow. Issue resolved after adding/removing debug logs, suggesting a transient server state problem fixed by a restart.
[2025-04-29 17:21:47] - Bug Fix: Resolved 'Leave Debate' error (`Debate validation failed: status: 'pending' is not a valid enum value`). Removed the line `debate.status = 'pending';` from the `leaveDebate` function in `api/controllers/debateController.js` as 'pending' is not a valid status enum.
[2025-04-29 17:27:10] - Investigated conditional rendering of 'Register Your Team' button in `client/src/components/Debates.js` -> `DebateCard`. Found that the existing logic correctly renders the button for debaters on tournament cards and triggers the modal (`TeamRegistrationForm`) directly via `setIsTeamRegModalOpen(true)`, without checking for `customRegistrationFields`. No code change needed in `DebateCard` for this specific button's rendering/trigger logic.
[2025-04-29 17:35:56] - Verified the `onClick` handler for the 'Register Your Team' button (lines 181-189 in `client/src/components/Debates.js`). The handler `() => setIsTeamRegModalOpen(true)` already correctly implements the requirement to only open the team registration modal. No code change was necessary for this specific handler based on the task instructions.
[2025-04-29 17:39:21] - Bug Fix: Resolved issue where registration modal wouldn't open from `/debates` page if no custom fields existed. Corrected conditional logic in `DebateCard` to prevent conflicting 'Join' button from rendering for debaters viewing tournaments. Restored `TeamRegistrationForm` in modal.

## Code Changes & Fixes

[2025-04-29 16:10:40] - Corrected navigation path for 'View Details' button in MyDebates.js (Participated tab). Changed target from `/tournaments/:id` to `/tournaments/:id/manage`, ensuring `isViewOnly: true` state is passed for participants.
[2025-04-29 16:55:21] - Standardized import casing for `AppError` in `api/services/entrantService.js` from `../utils/AppError` to `../utils/appError` to resolve workspace diagnostic.

## Frontend Changes

[2025-04-29 16:14:09] - Updated navigation for tournament cards on the /debates page (client/src/pages/Tournaments.jsx). The onClick handler now navigates to `/tournaments/:id/manage` with `state: { isViewOnly: true }` to ensure consistent view-only access to the tournament dashboard.

## Schema Modifications

[2025-04-29 16:45:11] - Added `customFieldAnswers` field to `api/models/Team.js` schema to store answers to custom registration questions. This field is an array of objects, each containing `fieldId` (referencing `RegistrationField`) and the `answer` string.

[2025-05-08 13:01:01] - Test entry: Successfully interacted with the roo-code-memory-bank-mcp by reading and appending an entry.

[2025-05-08 16:13:23] - The `shadcn-ui` npm package is deprecated. The correct package to use is `shadcn`. For example, instead of `npx shadcn-ui@latest add button`, use `npx shadcn@latest add button`. More information can be found at https://ui.shadcn.com/docs/cli
