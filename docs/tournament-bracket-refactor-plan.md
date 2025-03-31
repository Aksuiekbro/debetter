# Tournament Bracket Refactor Plan

This document outlines the plan to refactor the tournament bracket component to use a dedicated library (`react-brackets`) for a standard 16-team single-elimination visualization, add interactivity, and ensure responsiveness, potentially requiring backend adjustments.

## Phase 1: Frontend Implementation & Library Integration

1.  **Install Library:** Add `react-brackets` to the `client` project dependencies.
    *   Command: `npm install react-brackets` (executed in the `client` directory).
2.  **Replace Grid Component:**
    *   Modify `client/src/components/TournamentGrid.js` (or create a new component, e.g., `ReactBracketsDisplay.js` and use it in `BracketTab.js`).
    *   Remove the existing MUI `Grid` implementation.
    *   Import and use the main component from `react-brackets` (e.g., `<Bracket rounds={formattedRounds} />`).
3.  **Data Transformation:**
    *   Analyze the structure required by `react-brackets` for its `rounds` prop (refer to the library's documentation).
    *   In `client/src/components/BracketTab.js` (or wherever the data is passed to the bracket component), transform the `tournamentRounds` data fetched from the hook/API into the format required by `react-brackets`.
4.  **Implement Interactivity:**
    *   Utilize the `onMatchClick` (or similar) prop provided by `react-brackets`.
    *   Implement a handler function (e.g., `handleMatchClick`) that receives match details.
    *   This handler could open a modal dialog (using MUI's `Dialog`) displaying match information or navigate to a dedicated match details page.
5.  **Styling & Responsiveness:**
    *   Apply necessary styling to integrate the bracket visually.
    *   Leverage the library's responsiveness features or add custom CSS/MUI `sx` props to ensure good display on different screen sizes (e.g., horizontal scrolling).

## Phase 2: Backend Analysis & Potential Modification

1.  **Identify Data Source:**
    *   Examine `client/src/hooks/useTournamentData.js` to understand how `tournamentRounds` are fetched.
    *   Identify the specific API endpoint being called.
2.  **Analyze Backend Logic:**
    *   Review the corresponding backend route, controller function, and service function responsible for generating the bracket/round data.
    *   Check the Mongoose models (`Tournament.js`, `Debate.js`) for data storage structure.
3.  **Determine Necessary Changes:**
    *   Compare the current API data structure with the structure required by `react-brackets`.
    *   Plan modifications if structures differ significantly.
4.  **Implement Backend Changes (If Required):**
    *   Modify the backend service function to query and structure data as needed.
    *   Update the API response format.
    *   Adjust Mongoose models if necessary.

## Phase 3: Integration & Testing

1.  **Connect Frontend & Backend:** Ensure the frontend correctly consumes the API endpoint.
2.  **Test Rendering:** Verify the bracket renders correctly with the library.
3.  **Test Data Flow:** Test with actual tournament data, ensuring correct progression.
4.  **Test Interactivity:** Confirm match click actions work as expected.
5.  **Test Responsiveness:** Check layout on various screen sizes.

## High-Level Flow Diagram

```mermaid
graph TD
    subgraph Frontend (Client)
        A[TournamentManagement.js] -- Fetches data --> B(useTournamentData.js);
        B -- Calls API --> C{API Endpoint};
        B -- Receives data --> D[BracketTab.js];
        D -- Transforms data --> E(ReactBracketsDisplay.js / TournamentGrid.js);
        E -- Uses react-brackets --> F[Rendered Bracket UI];
        F -- User clicks match --> G(handleMatchClick);
        G -- Shows details --> H[Modal / Detail View];
    end

    subgraph Backend (Server)
        C -- Request --> I[Backend Route];
        I -- Calls --> J[Controller Function];
        J -- Calls --> K[Service Function];
        K -- Queries --> L[Database (Models)];
        L -- Returns data --> K;
        K -- Processes/Transforms data? --> J;
        J -- Sends response --> C;
    end

    subgraph Potential Backend Changes
        K -- May need modification --> K_Mod(Modified Service Logic);
        L -- May need modification --> L_Mod(Modified Models);
        K_Mod -- Returns new structure --> J;
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#ccf,stroke:#333,stroke-width:1px
    style L fill:#ccf,stroke:#333,stroke-width:1px