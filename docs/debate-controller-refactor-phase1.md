# Debate Controller Refactor - Phase 1: Service Logic Extraction

**Objective:** Refactor `server/controllers/debateController.js` by moving business logic related to tournament team and posting management into their respective services (`teamService.js` and `postingService.js`). This aims to make the controller leaner and improve code organization without changing the API structure in this phase.

## Plan Details:

### 1. Enhance `teamService.js` (`server/services/teamService.js`)

*   **Implement `getTeamsForDebate(tournamentId)`:**
    *   Find the `Debate` by `tournamentId`.
    *   Populate the `teams.members.userId` field.
    *   Return the populated `teams` array.
*   **Implement `deleteTeam(tournamentId, teamId)`:**
    *   Find the debate.
    *   Remove the specified team from the `debate.teams` array.
    *   Save the debate document.
    *   Return a success status or confirmation.

### 2. Enhance `postingService.js` (`server/services/postingService.js`)

*   **Implement `getPostingsForDebate(debateId, filters = {})`:**
    *   Find the debate.
    *   Populate necessary fields within the `postings` array (e.g., teams, judges, creator).
    *   Apply optional filters (e.g., by status, batchName).
    *   Return the filtered and populated array of postings.
*   **Implement `getPostingById(debateId, postingId)`:**
    *   Find the debate.
    *   Find the specific posting within the `postings` array by `postingId`.
    *   Populate necessary fields.
    *   Return the single posting object.
*   **Implement `updatePostingDetails(debateId, postingId, updateData)`:**
    *   Find the debate and the specific posting.
    *   Update allowed fields based on `updateData` (e.g., location, time, theme, judges).
    *   Perform necessary validation.
    *   Save the debate document.
    *   Return the updated posting object. (Handles judge assignments).
*   **Implement `recordPostingResult(debateId, postingId, resultData)`:**
    *   Find the debate and the specific posting.
    *   Update result fields (e.g., winner, scores).
    *   Optionally, update related team statistics (`wins`, `losses`, `points`) in the `Debate.teams` array.
    *   Set posting status to 'completed' and update `completedAt`.
    *   Save the debate document.
    *   Return confirmation or the updated posting object.
*   **Implement `deletePosting(debateId, postingId)`:**
    *   Find the debate.
    *   Remove the specified posting from the `debate.postings` array.
    *   Save the debate document.
    *   Return a success status or confirmation.
*   **Notifications:** Keep the `sendGameNotifications` helper function within `postingService.js` for this phase.

### 3. Refactor `debateController.js` (`server/controllers/debateController.js`)

*   **Team-Related Functions:**
    *   Modify `createTeams`, `getTeams`, `updateTeam` (if exists), `deleteTeam` (if exists), `add/removeTeamMember` (if exists) to delegate their core logic to the corresponding methods in `teamService.js`.
*   **Posting-Related Functions (Assuming APF):**
    *   Modify `createApfPosting`, `createBatchApfPostings`, `getApfPostings`, `updateApfPosting`, `updatePostingResult`/`submitApfEvaluation`, `assignJudgesToPosting`, `deleteApfPosting`, `sendApfGameReminders` to delegate their core logic to the corresponding methods in `postingService.js`.
*   **Controller Responsibility:** The controller functions should primarily focus on:
    *   Extracting data from the request (`req.params`, `req.body`, `req.user`).
    *   Calling the appropriate service method(s).
    *   Handling the response (data or errors) from the service.
    *   Formatting and sending the HTTP response (`res.json(...)` or `res.status(...).json(...)`).

### Next Steps:

*   Implement the service enhancements.
*   Refactor the controller functions.
*   Thoroughly test all affected functionality.