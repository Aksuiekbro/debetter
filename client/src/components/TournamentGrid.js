import React, { useState } from 'react'; // Import useState
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets'; // Import necessary components
import { Box, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'; // Import Dialog components

// --- Data Transformation Function ---
// This function needs to convert the backend's tournamentRounds structure
// into the format expected by react-brackets.
const transformDataForBracket = (backendRounds, entrants = []) => { // Add entrants parameter
  if (!backendRounds || !Array.isArray(backendRounds) || backendRounds.length === 0) {
    return [];
  }
  console.log('[TournamentGrid] Processing backendRounds:', JSON.stringify(backendRounds, null, 2));

  // Assumption: backendRounds is an array of rounds,
  // each round has a 'matches' array.
  // Assumption: each match has team1, team2 (with _id and name), winner (_id), matchNumber.
  // Target Format: Array of rounds, each with { title: string, seeds: array }
  // Each seed represents a match and needs { id: string, date?: string, teams: [{ id: string, name: string }] }

  return backendRounds.map((round, roundIndex) => ({
    title: `Round ${round.roundNumber || roundIndex + 1}`,
    seeds: round.matches.map((match) => {
      // --- Find entrant names using the provided entrants list ---
      const team1IdStr = match.team1?.toString();
      const team2IdStr = match.team2?.toString();
      const team1User = entrants.find(e => e.id === team1IdStr);
      const team2User = entrants.find(e => e.id === team2IdStr);
      const team1Name = team1User?.name || 'TBD';
      const team2Name = team2User?.name || 'TBD';
      // --- End name lookup ---

      // Determine winner name (if available) - use the looked-up names
      let winnerName = null;
      if (match.winner) {
          const winnerIdStr = match.winner.toString();
          if (winnerIdStr === team1IdStr) winnerName = team1Name;
          else if (winnerIdStr === team2IdStr) winnerName = team2Name;
      }

      console.log(`[TournamentGrid] Processing Match ID ${match._id}:`,
        `Team1 ID: ${team1IdStr}, Team2 ID: ${team2IdStr}`,
        `Found Name 1: ${team1Name}`,
        `Found Name 2: ${team2Name}`
      );
      return {
        id: match._id || `r${roundIndex}-m${match.matchNumber}`, // Unique ID for the match/seed
        date: match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : undefined, // Optional date
        teams: [
          // Use the looked-up names and original IDs
          { id: team1IdStr || 'tbd1', name: team1Name },
          { id: team2IdStr || 'tbd2', name: team2Name }
        ],
        // Optional: Add score if available in your data model
        // score: [match.team1Score, match.team2Score],
        // Optional: Pass winner info if needed for styling/rendering seeds
        // winner: match.winner ? { id: match.winner, name: winnerName || 'Unknown Winner' } : undefined,
        // Optional: Add nextMatchId if available for linking lines automatically
        // nextMatchId: match.nextMatchId,
      };
    }),
  }));
};


const TournamentGrid = ({ rounds, entrants = [] }) => { // Add entrants prop
  // State for Match Details Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Transform the incoming rounds data
  const formattedRounds = transformDataForBracket(rounds, entrants); // Pass entrants to transformer

  if (formattedRounds.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">Bracket data is not available, is empty, or could not be transformed.</Alert>
      </Box>
    );
  }

  // Handle clicking on a match (seed)
  const handleMatchClick = (match) => {
    console.log('Match clicked (seed data):', match);
    setSelectedMatchId(match.id); // Store the ID of the clicked match
    setDialogOpen(true); // Open the dialog
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMatchId(null);
  };

  // Optional: Custom rendering for a seed (match)
  const RenderSeed = ({ seed, breakpoint, roundIndex, seedIndex }) => {
    // seed object structure: { id: string, date?: string, teams: [{ id: string, name: string }] }
    const match = seed; // Alias for clarity

    // Basic custom rendering example
    return (
      <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem style={{ backgroundColor: '#f0f0f0', padding: '5px' }}>
          <div>
            <SeedTeam style={{ color: match.winner?.id === match.teams[0]?.id ? 'green' : 'black' }}>
              {match.teams[0]?.name || 'TBD'}
            </SeedTeam>
            <SeedTeam style={{ color: match.winner?.id === match.teams[1]?.id ? 'green' : 'black' }}>
              {match.teams[1]?.name || 'TBD'}
            </SeedTeam>
            {match.date && <Typography variant="caption" display="block" sx={{ mt: 1, color: 'grey.600' }}>{match.date}</Typography>}
          </div>
        </SeedItem>
      </Seed>
    );
  };


  return (
    <Box sx={{ py: 2, backgroundColor: 'white', /* Add other container styles */ }}>
      <Bracket
        rounds={formattedRounds}
        // renderSeedComponent={RenderSeed} // Uncomment to use custom seed rendering
        onMatchClick={handleMatchClick} // Enable match click handler
        swipeableProps={{ enableMouseEvents: true, animateHeight: true }} // Enable swipe on mobile/desktop
        bracketClassName="my-bracket-class" // Add custom class for styling
        roundClassName="my-round-class"
        seedClassName="my-seed-class"
      />

      {/* Match Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Match Details</DialogTitle>
        <DialogContent>
          <Typography>
            Displaying details for Match ID: {selectedMatchId || 'N/A'}
          </Typography>
          {/* TODO: Fetch and display actual match details here based on selectedMatchId */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentGrid;