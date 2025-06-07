import React, { useState } from 'react';
import { SingleEliminationBracket, Match, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';
import { Box, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

// --- Data Transformation Function ---
const transformDataForBracket = (backendRounds, teams = []) => {
  if (!backendRounds || !Array.isArray(backendRounds) || backendRounds.length === 0) {
    console.warn('[transformDataForBracket] Invalid or empty backendRounds received.');
    return [];
  }
  console.log('[transformDataForBracket] Processing backendRounds:', JSON.stringify(backendRounds, null, 2));
  console.log('[transformDataForBracket] Using teams:', JSON.stringify(teams, null, 2));

  const matches = [];
  const totalRounds = backendRounds.length;
  const matchMap = new Map(); // To easily find matches by their backend ID

  // First pass: Create all match objects and store them in a map
  backendRounds.forEach((round, roundIndex) => {
    if (!round.matches || !Array.isArray(round.matches)) {
      console.warn(`[transformDataForBracket] Round ${roundIndex} has invalid matches.`);
      return; // Skip this round
    }

    round.matches.forEach((match, matchIndex) => {
      // Use backend match._id if available, otherwise generate one (less ideal)
      const matchId = match._id || `${roundIndex}-${matchIndex}`;
      matchMap.set(matchId, match); // Store original match data by ID

      // Determine match state
      let state = 'SCHEDULED'; // Default state
      if (match.winner) {
        state = 'DONE'; // Match is finished
      }
      // Add more states if your backend provides them (e.g., 'RUNNING', 'PAUSED')

      // Find full team objects using IDs from the teams array if necessary
      const findTeam = (teamRef) => {
        if (!teamRef) return { id: null, name: 'TBD' }; // Handle cases where a team is not yet decided
        const teamId = typeof teamRef === 'string' ? teamRef : teamRef._id; // Handle if teamRef is an ID or object
        if (!teamId) return { id: null, name: 'TBD' }; // If no ID, it's TBD
        const fullTeam = teams.find(t => t._id === teamId);
        return fullTeam ? { id: fullTeam._id, name: fullTeam.name } : { id: teamId, name: teamRef.name || 'Unknown Team' };
      };

      const team1 = findTeam(match.team1);
      const team2 = findTeam(match.team2);

      matches.push({
        id: matchId,
        name: match.matchNumber ? `Match ${match.matchNumber}` : `R${roundIndex+1} M${matchIndex+1}`, // Use matchNumber if available
        nextMatchId: null, // Will be populated in the second pass
        tournamentRoundText: `${roundIndex + 1}`,
        startTime: match.startTime || '', // Use startTime if available
        state: state,
        participants: [
          {
            id: team1.id,
            resultText: match.scores?.team1 !== undefined ? String(match.scores.team1) : null,
            isWinner: !!match.winner && (match.winner === team1.id || (match.winner?._id && match.winner._id === team1.id)),
            name: team1.name,
            // status: null, // Could add 'PLAYED', 'NO_SHOW', 'WALK_OVER' if data available
          },
          {
            id: team2.id,
            resultText: match.scores?.team2 !== undefined ? String(match.scores.team2) : null,
            isWinner: !!match.winner && (match.winner === team2.id || (match.winner?._id && match.winner._id === team2.id)),
            name: team2.name,
            // status: null,
          }
        ],
      });
    });
  });

  // Second pass: Determine nextMatchId based on the winner's progression
  matches.forEach(currentMatch => {
    const originalMatch = matchMap.get(currentMatch.id);
    if (!originalMatch || !originalMatch.nextMatch) return; // Skip if no original match or nextMatch info

    const nextMatchBackendId = typeof originalMatch.nextMatch === 'string' ? originalMatch.nextMatch : originalMatch.nextMatch?._id;

    if (nextMatchBackendId && matchMap.has(nextMatchBackendId)) {
        currentMatch.nextMatchId = nextMatchBackendId;
    } else if (nextMatchBackendId) {
        console.warn(`[transformDataForBracket] nextMatchId ${nextMatchBackendId} referenced by match ${currentMatch.id} not found in matchMap.`);
    }
  });


  console.log('[transformDataForBracket] Transformed matches:', JSON.stringify(matches, null, 2));
  return matches;
};

// --- Component ---
const TournamentGrid = ({ tournamentRounds, teams = [] }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null); // Store the whole match object

  const bracketData = transformDataForBracket(tournamentRounds, teams);

  console.log('[TournamentGrid] Received teams prop:', JSON.stringify(teams, null, 2));
  console.log('[TournamentGrid] Final matches data for bracket:', JSON.stringify(bracketData, null, 2));

  // Handle clicking on a match
  // The library's Match component calls this with the match object
  const handleMatchClick = (match) => {
    console.log('Match clicked:', match);
    // Find the full match details from the original data if needed, or use the transformed data
    const fullMatchData = bracketData.find(m => m.id === match.id);
    setSelectedMatch(fullMatchData || match); // Store the clicked match object
    setDialogOpen(true); // Open the dialog
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMatch(null);
  };

  // Basic theme, can be customized further
  // Using a slightly modified theme for better visibility
  const GlootTheme = createTheme({
    textColor: { main: '#333333', highlighted: '#D9006C', dark: '#1A1C2C' },
    matchBackground: { wonColor: '#D1E7DD', lostColor: '#F8D7DA' },
    score: {
      background: { wonColor: '#A8DADC', lostColor: '#FFB3C1' },
      text: { highlightedWonColor: '#137333', highlightedLostColor: '#A1263B' },
    },
    border: {
      color: '#CED1F2',
      highlightedColor: '#8A2BE2', // Brighter highlight
    },
    roundHeader: { backgroundColor: '#E9ECEF', fontColor: '#495057' },
    connectorColor: '#B0B5DB',
    connectorColorHighlight: '#8A2BE2',
    svgBackground: '#F8F9FA', // Light grey background
  });


  if (!bracketData || bracketData.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">Bracket data is not available or could not be generated.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: GlootTheme.svgBackground || '#FFF', padding: 2, overflowX: 'auto' }}> {/* Add horizontal scroll */}
      {/* Render the bracket using the new library */}
      <SingleEliminationBracket
        matches={bracketData}
        matchComponent={Match} // Use the default Match component or a custom one
        theme={GlootTheme} // Apply the theme
        onMatchClick={handleMatchClick} // Add click handler
        options={{
          style: 'brackets' // Or 'list'
        }}
        svgWrapper={({ children, ...props }) => (
          // Adjust width/height as needed, consider making it responsive
          // Increased width for potentially larger brackets
          <SVGViewer width={1500} height={800} background={GlootTheme.svgBackground || '#FFF'} {...props}>
            {children}
          </SVGViewer>
        )}
      />

      {/* Match Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Match Details</DialogTitle>
        <DialogContent>
          {selectedMatch ? (
            <>
              <Typography variant="h6">{selectedMatch.name || 'Match Details'}</Typography>
              <Typography>ID: {selectedMatch.id}</Typography>
              <Typography>State: {selectedMatch.state}</Typography>
              <Typography>Start Time: {selectedMatch.startTime || 'Not set'}</Typography>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Participants:</Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                {selectedMatch.participants.map((p, index) => (
                  <li key={p.id || `p-${index}`}>
                    <Typography component="span" sx={{ fontWeight: p.isWinner ? 'bold' : 'normal' }}>
                      {p.name || 'TBD'}
                    </Typography>
                    {p.resultText !== null ? ` (${p.resultText})` : ''}
                    {p.isWinner ? <Typography component="span" sx={{ color: 'success.main', ml: 1 }}>(Winner)</Typography> : ''}
                  </li>
                ))}
              </Box>
              {/* TODO: Add more details or actions like 'Report Score' */}
            </>
          ) : (
            <Typography>No match selected.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentGrid;