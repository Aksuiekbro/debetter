# Plan: Create Historical "Qamqor Cup" Tournament Record

**Objective:** Create a database record for the "Qamqor Cup" tournament (hosted by Turan University) that occurred on February 15th, 2025. This involves creating test users and the tournament itself, using a workaround for the past date requirement.

**Core Concepts:**

*   **Users:** Created via `User` model and `authController.registerTestUsers` API.
*   **Tournaments:** Represented by `Debate` documents (`format: 'tournament'`). Created via `tournamentService` and `debateService` APIs.
*   **Participants:** Added via `tournamentService.registerParticipants` API.
*   **Date Workaround:** System validation prevents creating tournaments with past dates directly. The plan involves creating the tournament with temporary *future* dates and then requires a **manual database update** by the user to set the correct historical dates and status.

**Plan Diagram:**

```mermaid
graph TD
    A[Start] --> B(Define 32 Debater + 1 Organizer User Data);
    B --> C{Create Users via API};
    C --> D(Capture User IDs);
    D --> E(Select Organizer as Creator);
    E --> F(Define Tournament Details w/ Temp Dates);
    F --> G{Prepare/Create Tournament via API};
    G --> H(Capture Tournament ID);
    H --> I{Add 32 Debaters via API};
    I --> J[Automated Steps Complete];
    J --> K((Manual DB Update by User));
    K --> L[End];

    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style D fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style H fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style K fill:#f00,stroke:#333,stroke-width:2px

    subgraph Step 1: Create Users
        B
        C
        D
        E
    end

    subgraph Step 2: Create Tournament (Temp Dates)
        F
        G
        H
    end

    subgraph Step 3: Add Participants
        I
    end

    subgraph Step 4: Manual Correction
        K
    end
```

**Detailed Steps (Automated):**

1.  **Define User Data:**
    *   Generate data for 33 test users (`isTestAccount: true`):
        *   32 users with `role: 'user'` (debaters).
        *   1 user with `role: 'organizer'`.
    *   Assign example Kazakh names, unique emails (e.g., `[name]@qamqor.test.com`), and a standard password.
2.  **Create Users:**
    *   Use the `registerTestUsers` API endpoint (likely POST `/api/auth/register-test-users`) with the generated user data array.
    *   Record all returned user `_id` values, noting the organizer's ID.
3.  **Define Tournament Details:**
    *   `title`: "Qamqor Cup"
    *   `description`: "Tournament hosted by Turan University"
    *   `difficulty`: 'advanced'
    *   `category`: 'society'
    *   `startDate`: April 2nd, 2025, 14:00 (Temporary)
    *   `registrationDeadline`: April 1st, 2025, 14:00 (Temporary)
4.  **Prepare & Create Tournament:**
    *   Identify the organizer user object (using the ID from step 2).
    *   Use the organizer as the `creator`.
    *   Call the relevant API endpoint that utilizes `tournamentService.prepareTournamentData` and `debateService.createDebate` (e.g., POST `/api/debates` or similar).
    *   Record the returned tournament `_id`.
5.  **Add Participants:**
    *   Call the relevant API endpoint that utilizes `tournamentService.registerParticipants` (e.g., POST `/api/tournaments/{tournamentId}/participants/bulk` or similar).
    *   Provide the tournament ID and an object containing `{ debaterIds: [array_of_32_debater_ids] }`.

**Manual Database Update (User Task):**

*   **After the automated steps are confirmed successful**, connect to the database.
*   Find the `debates` collection and locate the newly created "Qamqor Cup" tournament document using its ID.
*   Update the following fields:
    *   `startDate`: Set to the ISODate representation of February 15th, 2025 (e.g., `ISODate("2025-02-15T00:00:00Z")` - adjust time as needed).
    *   `registrationDeadline`: Set to an appropriate ISODate before Feb 15th (e.g., `ISODate("2025-02-14T00:00:00Z")`).
    *   `status`: Set to `'completed'`.
*   Save the changes to the document.

**Next Steps:**

*   Confirm this plan is saved.
*   Switch to an appropriate mode (e.g., "code" or a mode capable of making API calls/running scripts) to execute the automated steps.