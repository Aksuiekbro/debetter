# System Patterns: Debate Tournament Management System

## Architecture Overview

The system follows a typical **Monolithic Frontend + Backend API** pattern, commonly associated with the MERN stack.

*   **Frontend (`client/`):** A React single-page application (SPA) responsible for the user interface and user experience. It interacts with the backend via API calls.
*   **Backend (`api/`):** A Node.js/Express application serving as a RESTful API. It handles business logic, data persistence, and authentication.
*   **Database:** MongoDB (inferred from Mongoose models like `api/models/Tournament.js`, `api/models/User.js`, etc.).
*   **Real-time Communication:** Likely uses WebSockets for features like notifications and live updates (inferred from `api/services/socketService.js` and `client/src/contexts/SocketContext.js`).

## Key Technical Decisions & Patterns

*   **MERN Stack:** The core technology choice (MongoDB, Express, React, Node.js).
*   **RESTful API:** Backend exposes endpoints for frontend consumption.
*   **MVC (Model-View-Controller) on Backend:** The `api/` directory structure (models, controllers, routes, services) suggests an MVC or similar pattern for organizing backend logic. Services likely encapsulate business logic.
*   **Component-Based UI (Frontend):** React promotes building the UI from reusable components (`client/src/components/`).
*   **Context API / Hooks (Frontend):** Used for state management (`client/src/contexts/`, `client/src/hooks/`). `AuthContext` and `SocketContext` are present. Custom hooks encapsulate UI logic (`useTournamentUIManager`, `useJudgeManagement`, etc.).
*   **Middleware (Backend):** Express middleware is used for concerns like authentication (`authMiddleware.js`, `tournamentAuthMiddleware.js`) and file uploads (`uploadMiddleware.js`).
*   **Async Handling (Backend):** Utility `catchAsync.js` suggests a pattern for handling asynchronous operations in controllers.
*   **Error Handling (Backend):** Custom error class `appError.js` indicates a structured approach to error handling.
*   **Internationalization (i18n):** `i18next` library is used on the client-side (`client/src/i18n.js`, `client/public/locales/`).

## Component Relationships (High-Level)

*   `client/src/App.js` likely orchestrates routing and core layout.
*   `client/src/components/Navbar.js` provides navigation.
*   `client/src/contexts/AuthContext.js` manages user authentication state globally.
*   `client/src/components/TournamentManagement/*` components handle organizer-specific functionalities.
*   `api/server.js` is the entry point for the backend API.
*   `api/routes/*` define API endpoints and map them to `api/controllers/*`.
*   `api/controllers/*` handle incoming requests, interact with `api/services/*`.
*   `api/services/*` contain business logic and interact with `api/models/*`.
*   `api/models/*` define the database schema and interact with the MongoDB database.

## Critical Implementation Paths

*   **Authentication Flow:** User registration, login, token generation (likely JWT), and protected routes.
*   **Tournament Lifecycle:** Creation -> Registration -> Scheduling -> Running Debates -> Judging -> Results.
*   **Real-time Updates:** WebSocket connections for pushing updates (notifications, schedule changes, etc.).
*   **Data Management:** CRUD operations for Tournaments, Users, Teams, Debates, Judges, etc.
