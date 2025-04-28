# Progress

*Updated on 2025-04-24*

## What Works

*   **Core Application Structure:** MERN stack setup is functional.
*   **User Authentication:** JWT-based authentication for Organizers and Participants (Debaters, Judges, Observers) is implemented. Role-based access control is partially implemented.
*   **Tournament Creation & Basic Management:** Organizers can create tournaments with basic details.
*   **Participant Registration (Basic):** Users can join tournaments as Judges or Observers.
*   **Custom Registration Fields (Organizer UI):** Organizers can define custom fields (text, number, select, checkbox, date) specific to a tournament via a dedicated tab in the management interface. They can add, edit, delete, and reorder these fields.
*   **Custom Registration Fields (Debater UI):** The debater registration form dynamically fetches and displays custom fields defined by the organizer for that tournament.
*   **Team & Participant Registration (Backend):** A backend endpoint (`/api/debates/:id/register-team`) exists to handle team registration. It creates an embedded team record, adds participant entries linked to users and the team, validates capacity/status, and saves both standard team info (name, institution) and custom field values. Uses transactions.
*   **Team & Participant Registration (Frontend):** The registration form collects standard team info (Team Name, Participant Names, School/University) and custom fields, submitting them to the backend endpoint.
*   **API Infrastructure:** Backend follows Controller-Service pattern. Routes for various features (tournaments, users, announcements, schedule, registration fields, etc.) are established.
*   **Real-time (Partial):** Socket.io is integrated but specific real-time updates might need further implementation or refinement.
*   **UI Components:** Material-UI is used, providing a consistent component library. Several management tabs (Announcements, Teams, Judges, Posting, Standings, Bracket, Check-In, Organizers, Custom Fields) exist.

## What's Left to Build / Refine

*   **Backend `register-team` Endpoint:** While the controller function is implemented, thorough testing and potential refinement based on real-world usage are needed. Specifically, robust handling of `participantIdentifiers` (resolving usernames/emails to User IDs) is critical.
*   **Standard Registration Fields:** Ensure the standard fields (Team Name, Participant Names, School/University) are consistently handled and displayed throughout the application (e.g., in team lists, standings).
*   **UI Simplification:** Remove specified fields (Format, Category, Complexity [replace with League], Tournament Mode, Duration) from the tournament creation/management interface as per `activeContext.md`.
*   **Schedule Refactor:** Change the 'Schedule' section to support photo uploads instead of detailed form entries. Implement backend storage and frontend UI for uploads.
*   **Judge Management Enhancement:** Implement functionality for organizers to manually add judges with their data. Implement judge check-in.
*   **Team/Participant Structure Refactor:** Fully merge "Teams" and "Participants" concepts in the UI (likely focusing on the `TeamsTab`). Implement team check-in. Ensure full edit access for organizers. Address potential data migration if needed.
*   **Round Generation & Management:** Implement logic for generating pairings, managing rounds, and advancing teams based on results.
*   **Judging System:** Implement judge allocation, ballot submission, and feedback mechanisms.
*   **Results & Analytics:** Implement results tracking, tabulation, standings calculation (beyond basic participant standings), and potentially analytics/reporting features.
*   **Real-time Updates:** Enhance real-time features for pairings, results, and tournament status updates using Socket.io.
*   **Testing:** Comprehensive unit, integration, and end-to-end tests are needed for robustness.
*   **Error Handling & UX:** Refine error handling and user experience across the application.

## Current Status

The application has a functional backend system for defining and collecting custom registration data alongside standard team information. The frontend provides the necessary interfaces for organizers to manage these fields and for debaters to fill them out during registration. The core registration logic is in place but requires testing and potential refinement of the backend endpoint. Several other major features related to tournament execution (scheduling, pairing, judging, results) still need implementation or significant refinement.

## Known Issues

*   The backend `/register-team` endpoint needs thorough testing, especially the user identifier resolution logic.
*   Potential inconsistencies might exist where "Participants" are referenced instead of the merged "Teams" concept in some UI areas or backend logic.
*   Error handling in the frontend registration form could be more specific.

## Evolution of Decisions

*   Initial request focused on adding fixed fields to registration.
*   Clarification revealed the need for organizer-defined *custom* fields per tournament.
*   Investigation showed a backend system for custom fields already existed but wasn't fully integrated into the frontend.
*   Implementation focused on integrating the existing backend with new/updated frontend components for both organizers (defining fields) and debaters (filling fields).
*   Confirmed that standard fields (Team Name, Institution) are stored differently (embedded in `Debate.teams`) than custom fields (`Debate.participants.customFields`).
