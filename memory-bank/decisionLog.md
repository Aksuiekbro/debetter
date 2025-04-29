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
