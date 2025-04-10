# MongoDB Data Models and Relationships

This document outlines the structure and relationships of the core MongoDB models used in the application, based on the current implementation.

## Core Models

### 1. User (`User.js`)

**Purpose:** Stores information about registered users, including participants, judges, organizers, and admins.

**Key Fields:**

*   `username`: String (Required, Unique) - User's login name.
*   `email`: String (Required, Unique) - User's email address.
*   `password`: String (Required) - Hashed password.
*   `role`: String (Enum: 'user', 'judge', 'organizer', 'admin', Default: 'user') - General role in the system.
*   `judgeRole`: String (Enum: 'Head Judge', 'Judge', 'Assistant Judge', Required if role='judge') - Specific role when acting as a judge.
*   `phoneNumber`: String - User's phone number.
*   `club`: String - Affiliated club or institution.
*   `experience`: String - Description of user's debate experience.
*   `profilePhotoUrl`: String - URL to the user's profile picture (cloud storage).
*   `otherProfileInfo`: String - Additional profile details.
*   `awards`: [String] - List of awards or achievements.
*   `judgingStyle`: String - Description of the judge's style.
*   `bio`: String - User's biography.
*   `debates`: [ObjectId (ref: 'Debate')] - Debates the user is associated with (e.g., participated, judged).
*   `notificationSettings`: Object - User preferences for receiving notifications (e.g., `game_assignment`, `system_alert`).
*   `notifications`: [Subdocument] - Embedded array of notifications for the user.
    *   `type`: String (Enum: 'game_assignment', 'evaluation_request', 'system_notice', Required)
    *   `debate`: ObjectId (ref: 'Debate')
    *   `posting`: ObjectId
    *   `message`: String (Required)
    *   `seen`: Boolean (Default: false)
    *   `createdAt`: Date
*   `createdAt`: Date - User registration timestamp.
*   `updatedAt`: Date - Last profile update timestamp.
*   *(Other fields like `friends`, `friendRequests`, `isTestAccount`, `isFirstOrganizer` also exist)*

### 2. Debate (`Debate.js` - Represents Tournaments)

**Purpose:** Stores information about debate events, primarily focusing on the 'tournament' format.

**Key Fields:**

*   `title`: String (Required) - Name of the tournament.
*   `description`: String (Required) - Detailed description.
*   `category`: String (Required, Enum: 'politics', 'technology', etc.) - Topic category.
*   `difficulty`: String (Required, Enum: 'beginner', 'intermediate', 'advanced') - Skill level.
*   `status`: String (Required, Enum: 'upcoming', 'team-assignment', 'in-progress', 'completed', Default: 'upcoming') - Current stage of the tournament.
*   `format`: String (Enum: 'standard', 'tournament', Default: 'standard') - Event format (currently focused on 'tournament').
*   `startDate`: Date (Required) - Tournament start date/time.
*   `registrationDeadline`: Date - Deadline for participant registration.
*   `creator`: ObjectId (ref: 'User', Required) - The user who created the tournament.
*   `participants`: [Subdocument] - Array of users involved in the tournament.
    *   `userId`: ObjectId (ref: 'User', Required)
    *   `tournamentRole`: String (Enum: 'Debater', 'Judge', 'Observer', Required, Default: 'Debater')
    *   `teamId`: ObjectId - Reference to the `_id` of the team within the `teams` array below.
*   `teams`: [Subdocument] - Embedded array of teams participating in the tournament.
    *   `_id`: ObjectId (Auto-generated)
    *   `name`: String (Required)
    *   `members`: [Subdocument]
        *   `userId`: ObjectId (ref: 'User', Required)
        *   `role`: String (Enum: 'leader', 'speaker', Required)
    *   `wins`: Number (Default: 0)
    *   `losses`: Number (Default: 0)
    *   `points`: Number (Default: 0)
*   `themes`: [Subdocument] - Array of specific themes or topics for the tournament rounds.
    *   `_id`: ObjectId (Auto-generated)
    *   `text`: String (Required)
*   `tournamentRounds`: [Subdocument] - Structure defining rounds and matches (bracket).
    *   `roundNumber`: Number
    *   `matches`: [Subdocument] - Details of individual matches within the round.
        *   *(Fields like `matchNumber`, `team1` (Team ID), `team2` (Team ID), `winner` (Team ID), `completed`)*
*   `postings`: [Subdocument - `postingSchema`] - Embedded array representing individual match assignments (game cards). (See details below)
*   `mapImageUrl`: String - URL to the uploaded tournament venue map.
*   `createdAt`: Date - Tournament creation timestamp.
*   `updatedAt`: Date - Last update timestamp.
*   *(Other fields like `maxParticipants`, `tournamentSettings`, `tournamentFormats`, `eligibilityCriteria`, `mode`, `teamRegistrations`, `requiredJudges`, `maxJudges` also exist)*

### 3. Posting (Subdocument within `Debate.postings`)

**Purpose:** Represents a specific match assignment (game card) within a tournament.

**Key Fields:**

*   `_id`: ObjectId (Auto-generated)
*   `round`: Number - The tournament round number.
*   `matchNumber`: Number - The match number within the round.
*   `team1`: ObjectId (Required) - Reference to the `_id` of the embedded team from `Debate.teams`.
*   `team2`: ObjectId (Required) - Reference to the `_id` of the embedded team from `Debate.teams`.
*   `judges`: [ObjectId (ref: 'User')] - Array of assigned judges' User IDs.
*   `theme`: String (Required) - The specific topic/theme for this match.
*   `location`: String (Required) - Room or location for the match.
*   `status`: String (Enum: 'scheduled', 'in_progress', 'completed', Default: 'scheduled') - Current status of the match.
*   `winner`: ObjectId - Reference to the `_id` of the winning embedded team from `Debate.teams`.
*   `evaluation`: Subdocument - Embedded evaluation details (scores, comments).
    *   *(Fields like `team1Score`, `team2Score`, `comments`, `individualScores`, `evaluationId`)*
*   `recordedAudioUrl`: String - URL to the uploaded audio recording for the match.
*   `ballotImageUrl`: String - URL to the uploaded ballot image for the match.
*   `createdAt`: Date - Posting creation timestamp.
*   `createdBy`: ObjectId (ref: 'User') - User who generated the posting.
*   *(Other fields like `transcription`, `notifications` also exist)*

### 4. ApfEvaluation (`ApfEvaluation.js`)

**Purpose:** Stores detailed judge evaluations for APF format debates/matches.

**Key Fields:**

*   `debateId`: ObjectId (ref: 'Debate', Required) - The tournament this evaluation belongs to.
*   `judgeId`: ObjectId (ref: 'User', Required) - The judge who submitted the evaluation.
*   `winningTeam`: ObjectId (Required) - Reference to the `_id` of the winning embedded team from `Debate.teams`. *(Correction: Schema needs update to reflect this)*
*   `speakerScores`: Object - Detailed scores and feedback per speaker role.
    *   `leader_gov`: Subdocument (`detailedSpeakerScoreSchema`)
    *   `leader_opp`: Subdocument (`detailedSpeakerScoreSchema`)
    *   `speaker_gov`: Subdocument (`detailedSpeakerScoreSchema`)
    *   `speaker_opp`: Subdocument (`detailedSpeakerScoreSchema`)
        *   *(Includes `criteriaRatings`, `feedback`, `totalPoints`)*
*   `notes`: String - General notes from the judge.
*   `submittedAt`: Date (Default: Date.now) - Timestamp of submission.
*   `createdAt`: Date
*   `updatedAt`: Date
*   **Missing Field Suggestion:** Consider adding `postingId` (ObjectId) to directly link the evaluation to the specific match posting it relates to.
*   *(Other fields like `scores`, `teamScores`, `transcriptions` also exist)*

### 5. Announcement (`Announcement.js`)

**Purpose:** Stores tournament-wide announcements made by organizers.

**Key Fields:**

*   `tournamentId`: ObjectId (ref: 'Debate', Required) - The tournament the announcement is for.
*   `authorId`: ObjectId (ref: 'User', Required) - The user (organizer/admin) who created the announcement.
*   `title`: String (Required) - Announcement title.
*   `content`: String (Required) - Announcement body.
*   `createdAt`: Date
*   `updatedAt`: Date

### 6. ScheduleItem (`ScheduleItem.js`)

**Purpose:** Stores items for the tournament schedule (e.g., registration start, round times, breaks).

**Key Fields:**

*   `tournamentId`: ObjectId (ref: 'Debate', Required) - The tournament this schedule item belongs to.
*   `time`: Date (Required) - The date and time of the scheduled event.
*   `eventDescription`: String (Required) - Description of the event (e.g., "Round 1 Start", "Lunch Break").
*   `location`: String - Optional location for the event.
*   `createdBy`: ObjectId (ref: 'User', Required) - User who added the schedule item.
*   `createdAt`: Date
*   `updatedAt`: Date

### 7. JudgeFeedback (`JudgeFeedback.js`)

**Purpose:** Stores feedback provided by participants about judges for a specific match.

**Key Fields:**

*   `postingId`: ObjectId (Required) - The specific match posting the feedback is about.
*   `tournamentId`: ObjectId (ref: 'Debate', Required) - The tournament context.
*   `judgeId`: ObjectId (ref: 'User', Required) - The judge being reviewed.
*   `participantId`: ObjectId (ref: 'User', Required) - The participant providing the feedback.
*   `criteriaRatings`: Object - Ratings on specific criteria.
    *   `clarity`: Number (1-5)
    *   `fairness`: Number (1-5)
    *   `knowledge`: Number (1-5)
*   `comment`: String - Additional textual feedback.
*   `createdAt`: Date (Default: Date.now)

---

## Key Relationships

*   **User <-> Debate (Tournament):**
    *   One-to-Many: A `User` (creator) can create multiple `Debate` documents. (`Debate.creator` -> `User._id`)
    *   Many-to-Many: Users participate in `Debate`s. (`Debate.participants.userId` <-> `User._id`)
*   **Debate (Tournament) <-> Team (Embedded):**
    *   One-to-Many: A `Debate` contains multiple embedded `Team` documents within its `teams` array.
*   **Debate (Tournament) <-> Posting (Embedded):**
    *   One-to-Many: A `Debate` contains multiple embedded `Posting` documents within its `postings` array.
*   **Debate (Tournament) <-> Announcement:**
    *   One-to-Many: A `Debate` can have multiple `Announcement`s. (`Announcement.tournamentId` -> `Debate._id`)
*   **Debate (Tournament) <-> ScheduleItem:**
    *   One-to-Many: A `Debate` can have multiple `ScheduleItem`s. (`ScheduleItem.tournamentId` -> `Debate._id`)
*   **Debate (Tournament) <-> ApfEvaluation:**
    *   One-to-Many: A `Debate` can have multiple `ApfEvaluation`s associated with it. (`ApfEvaluation.debateId` -> `Debate._id`)
*   **Debate (Tournament) <-> JudgeFeedback:**
    *   One-to-Many: A `Debate` can have multiple `JudgeFeedback` entries related to its postings. (`JudgeFeedback.tournamentId` -> `Debate._id`)
*   **User (Judge) <-> ApfEvaluation:**
    *   One-to-Many: A `User` (judge) can submit multiple `ApfEvaluation`s. (`ApfEvaluation.judgeId` -> `User._id`)
*   **User (Judge) <-> JudgeFeedback:**
    *   Many-to-One: Multiple `JudgeFeedback` entries can target the same `User` (judge). (`JudgeFeedback.judgeId` -> `User._id`)
*   **User (Participant) <-> JudgeFeedback:**
    *   One-to-Many: A `User` (participant) can provide multiple `JudgeFeedback` entries (for different judges/postings). (`JudgeFeedback.participantId` -> `User._id`)
*   **Team (Embedded) <-> Posting (Embedded):**
    *   One-to-Many: An embedded `Team` (identified by its `_id` within `Debate.teams`) can be referenced in multiple `Posting`s (`team1`, `team2`, `winner`).
*   **User <-> Team (Embedded):**
    *   Many-to-Many: Users are members of embedded `Team`s within a `Debate`. (`Debate.teams.members.userId` <-> `User._id`)
*   **User <-> Posting (Embedded):**
    *   Many-to-Many: Users (judges) are assigned to `Posting`s. (`Debate.postings.judges` array contains `User._id`s)
*   **Posting (Embedded) <-> JudgeFeedback:**
    *   One-to-Many: A specific `Posting` (identified by its `_id` within `Debate.postings`) can receive multiple `JudgeFeedback` entries. (`JudgeFeedback.postingId` refers to `Debate.postings._id`)
*   **ApfEvaluation <-> Team:**
    *   *(Inconsistency Noted):* `ApfEvaluation.winningTeam` currently references the separate `Team` model, but should likely reference the embedded team `_id` from `Debate.teams`.