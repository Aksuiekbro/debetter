# Tech Context: Debate Tournament Management System

## Core Technologies

*   **Frontend:** React (likely Create React App based structure), JavaScript, CSS (specific libraries like Material UI or Tailwind might be used, needs confirmation).
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB (using Mongoose ODM).
*   **Real-time:** WebSockets (specific library like Socket.IO needs confirmation).
*   **Internationalization (i18n):** `i18next` and related libraries.

## Development Setup

*   **Package Management:** npm (indicated by `package.json` and `package-lock.json` in both `api/` and `client/`).
*   **Environment Variables:** `.env` files are used for configuration (`api/.env`, root `.env`).
*   **API Base URL:** Configured in `client/src/config/api.js`.
*   **Deployment:** Vercel configuration present (`vercel.json`), suggesting Vercel as a deployment platform.

## Technical Constraints & Considerations

*   **Monorepo Structure (Sort of):** While not a strict monorepo using tools like Lerna or Nx, the project colocates the `client` and `api` folders in the same repository. Build/deployment processes need to handle this structure.
*   **API Versioning:** No explicit API versioning is immediately apparent in the routes.
*   **Testing:** Jest configuration (`client/jest.config.js`) and some test files (`client/src/e2e/`, `api/test/`) exist, but the extent of test coverage is unknown. Puppeteer tests (`puppeteer-test.js`) are also present for E2E testing.
*   **Cloud Services:** `api/services/cloudStorageService.js` suggests potential use of cloud storage (e.g., AWS S3, Google Cloud Storage) for file uploads (like profile pictures or tournament resources).
*   **AI Integration:** `ai_models/` directory with an ASR notebook (`asr.ipynb`) indicates planned or existing integration with speech recognition, likely requiring Python environment setup and potentially GPU resources if run locally.

## Dependencies (Key Libraries - Inferred)

*   **Backend:** Express, Mongoose,jsonwebtoken (likely for auth), bcrypt (likely for password hashing), Socket.IO (likely for websockets), dotenv.
*   **Frontend:** React, React Router, Axios (or fetch API), i18next, Socket.IO Client.
*   **(Potentially):** UI component libraries (e.g., Material UI, Chakra UI, Ant Design), state management libraries beyond Context (e.g., Redux, Zustand), date/time libraries (e.g., Moment.js, date-fns).

## Tool Usage Patterns

*   **Scripts:** Numerous Node.js scripts in `scripts/` and `api/scripts/` for various tasks like database seeding, data verification, and specific tournament operations (e.g., `createTournament.js`, `simulateTournament.js`, `verifyQamqorParticipants.js`).
*   **Documentation:** Project plans, schema info, and issue tracking seem to be maintained in the `docs/` directory using Markdown.
