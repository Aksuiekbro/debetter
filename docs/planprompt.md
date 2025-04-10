Phase 1: Core Setup & Organizer Basics

Prompt 1: Tournament Creation & Basic Info
"Create the initial setup flow for a tournament organizer. The organizer must be able to input the following details for a new tournament:
Tournament Name (string)
Formats (multi-select or checkboxes: American Parliamentary Debate, British Parliamentary, Lincoln Douglas)
Date (date picker)
Location (string/address)
Description (text area)
Eligibility Criteria (text area)
Store these details associated with a unique tournament ID."
Prompt 2: Organizer Dashboard Shell & Navigation
"Create the main dashboard structure for tournament organizers. After logging in and selecting a tournament they manage, they should see a primary navigation menu leading to the following sections:
Announcements
Participants
Judges
Teams
Game Creation
Tabulation/Leaderboard
Implement the basic routing or page structure for these sections, even if the content is initially empty."
Phase 2: Organizer Management Sections

Prompt 3: Organizer - Announcements Management
"Implement the 'Announcements' section for organizers. This section should have sub-pages/tabs for:
Schedule: Allow organizers to create, view, edit, and delete schedule items (e.g., time, event description, location). Display these in a clear, potentially paginated list.
Map: Allow organizers to upload and display an image file representing the building map. Allow replacing or deleting the map.
Other Announcements: Implement a simple feed-style announcement system (like Telegram). Organizers can post text-based announcements (CRUD operations - Create, Read, Update, Delete), displayed chronologically."



Prompt 4: Organizer - Participant Management
"Implement the 'Participants' section for organizers.
Display a table/list of all registered participants for the tournament with columns: Name, Email, Phone Number, Role (e.g., Debater, Observer), Team, Club.
Allow organizers to edit any of these fields for any participant.
Allow organizers to delete a participant entry.
Each participant's name in the list should be a link that navigates to their profile page (we'll define the profile page structure later)."
Prompt 5: Organizer - Judge Management
"Implement the 'Judges' section for organizers.
Display a table/list of all judges associated with the tournament (invited or registered) with columns: Name, Email, Phone Number, Rank.
Allow organizers to view this list.
(Future feature implication: Organizers will need to be able to invite judges and set/update their rank, but focus on viewing for now).
Each judge's name in the list should be a link that navigates to their profile page (profile page structure to be defined later)."
Prompt 6: Organizer - Team Management
"Implement the 'Teams' section for organizers.
Display a table/list of all registered teams with columns: Team Name, Members (list of participant names).
Allow organizers to view the teams and their members.
Allow organizers to delete entire teams."
Phase 3: Game Creation & Execution

Prompt 7: Organizer - Game Topic Management
"Implement the first part of the 'Game Creation' section for organizers: Managing Topics/Themes.
Allow organizers to Create, Read, Update, and Delete debate topics/themes for the tournament."
Prompt 8: Organizer - Bracket Generation & Game Card Creation
"Implement the second part of the 'Game Creation' section for organizers:
Bracket/Pairing: Provide a mechanism to generate game pairings (brackets). Initial Step: Allow manual pairing selection - select two teams, assign roles if applicable (e.g., Gov/Opp for BP). (Automatic generation can be a later enhancement).
Game Card Creation: Once pairs are decided, allow the organizer to create a 'Game Card' by selecting:
The debate topic/theme (from the list created in Prompt 7).
The paired teams.
Date/Time slot (potentially linking to schedule items).
Location/Room.
Assigned Judge(s).
Display a list of created game cards."
Phase 4: Judge Features

Prompt 9: Judge Registration & Profile Setup
"Create the registration process and profile page for Judges.
Registration Form: Judges must provide: Name, Phone Number, Email, Experience (text area), Club Affiliation, Profile Photo (upload), Other Profile Info (text area). Implement validation for required fields (Name, Phone, Email).
Profile Page: Create a viewable profile page for judges displaying all the registered information, plus placeholders for 'Rank' and 'Awards'."
Prompt 10: Judge Invitation & Acceptance Flow
"Implement the flow for judges receiving and responding to tournament invitations.
When an organizer invites a judge (assume an invite mechanism exists), the judge should see the invitation message.
Below the message, display two mandatory checkboxes/statements (provide placeholder text like 'I agree to judge impartially' and 'I agree to focus on the debate content'). The judge must check both.
Provide 'Accept Invitation' and 'Decline Invitation' buttons. Acceptance is only possible if both checkboxes are checked.
Add a section/option on the judge's profile or settings page where they can select their preferred judging style: 'Judge with prior preparation' or 'Judge using clear paper (no prep)'. Store this preference."
Prompt 11: Judge - Game Interface (Audio & Photo Upload)
"Implement the interface for a judge actively judging a game. When a judge navigates to an assigned game, they should see:
Game details (Topic, Teams, Time, Location).
An Audio Recorder component: Button to 'Start Recording', which changes to 'Stop Recording'. When stopped, the audio file should be saved and associated with this specific game instance.
A Photo Upload component: Allow the judge to upload a photo (presumably of their paper ballot/notes). The uploaded photo should be saved and associated with this specific game instance."
(Note: The evaluation/feedback form is separate, see Participant Feedback prompt).
Prompt 12: Judge Feedback, Ranking & Leaderboard
"Implement features related to judge evaluation and ranking:
Feedback Display: On a judge's profile or a dedicated 'Feedback' section, display feedback received from participants (we'll define the participant input mechanism later).
Rank Calculation (Placeholder): Note that rank is determined by organizers and participant feedback. For now, ensure the 'Rank' field on the judge profile can be displayed (assume organizers set it elsewhere or it's calculated later).
Judge Leaderboard: Create a page accessible to judges showing a list of judges participating in the current tournament, ranked according to their 'Rank' field."
Awards Section: Ensure the Judge Profile page (from Prompt 9) has a dedicated section to display 'Awards' (assume this data is manually added by organizers or determined later)."
Phase 5: Participant Features

Prompt 13: Participant Registration & Profile/Team Update
"Implement the participant flow for joining a tournament and managing their details:
Allow registered users (assume a basic user system exists) to browse/find and register for an open tournament.
Once registered for a tournament, allow participants to access their own profile page.
On their profile page, allow participants to edit their own Name, Phone Number, and Email.
If a participant is part of a team, allow them to view their team members. Optional/Clarify: Can they change team members, or only organizers? (For now, focus on viewing team members and editing personal info)."
Prompt 14: Participant - Information Access
"Provide participants with read-only access to essential tournament information. Once logged in and associated with a tournament, participants should be able to navigate to and view:
The 'Announcements' section (Schedule, Map, Other Announcements) created by organizers.
The overall 'Tabulation/Leaderboard' section (Team and Participant rankings - defined below)."
Prompt 15: Participant - Feedback System (Viewing & Giving)
"Implement the feedback system from the participant's perspective:
View Feedback: Create a section where participants can view the feedback/results submitted by judges for their completed games.
Give Feedback on Judge: After a game is completed, provide an interface for participants to assess the judge for that specific game. This should include specific criteria (use placeholders like 'Clarity', 'Fairness', 'Knowledge'). Store this assessment data, linking it to the judge, the game, and the participant giving feedback."
Awards Section: Ensure the Participant Profile page has a dedicated section to display 'Awards' (assume this data is manually added by organizers or determined later)."
Phase 6: Tabulation & Final Touches

Prompt 16: Tabulation / Leaderboard Implementation
"Implement the 'Tabulation/Leaderboard' section, viewable by Organizers and Participants.
This section should calculate and display rankings based on game results (judge scores/feedback).
Display a leaderboard for Teams.
Display a leaderboard for individual Participants.
(Assume the scoring logic based on judge feedback needs to be defined - for now, focus on displaying ranked lists based on a sortable score field associated with teams/participants ). "
Prompt 17: Profile Page Structure (Consolidated)
"Define the structure and display components for user Profile Pages (Participants and Judges).
Common Elements: Name, Email, Phone Number, Club Affiliation, Profile Picture.
Participant Specific: Team affiliation. Link to edit personal info. Section for viewing game feedback received. Awards section.
Judge Specific: Experience, Judging Style Preference (Prep/Clear Paper), Rank, Link to view feedback received. Awards section.
Ensure navigation links from management lists (Prompts 4 & 5) correctly lead to these profiles."
Prompt 18: Data Models & Relationships
"Based on all the previous prompts, define the necessary database models (e.g., Tournament, User, Participant, Judge, Team, Announcement, Game, Topic, Feedback, Recording, PhotoUpload, etc.) and their relationships (e.g., one-to-many, many-to-many). Specify key fields for each model."