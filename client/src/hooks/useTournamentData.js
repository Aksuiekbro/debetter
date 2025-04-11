import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

// Helper function to format debater names
const formatDebaterName = (username) => {
  if (!username) return 'Unknown';
  
  // If username has the format "debater_name123", extract just "Name"
  if (username.startsWith('debater_')) {
    // Extract the name part without prefix and digits
    const namePart = username.replace('debater_', '');
    // Capitalize first letter and remove any trailing numbers
    return namePart.replace(/[0-9]+$/, '')
                  .charAt(0).toUpperCase() + 
                  namePart.replace(/[0-9]+$/, '').slice(1);
  }
  return username; // Return original if not matching pattern
};

export const useTournamentData = () => {
  const { id: tournamentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [entrants, setEntrants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [judges, setJudges] = useState([]);
  const [postings, setPostings] = useState([]); // Renamed from apfPostings for consistency
  const [standings, setStandings] = useState([]);
  const [error, setError] = useState(null);
  const [initializingBracket, setInitializingBracket] = useState(false); // Add state for bracket initialization

  const processFetchedData = useCallback((data) => {
    setTournament(data);

    console.log('[useTournamentData] Raw data.participants:', JSON.stringify(data.participants, null, 2));

    // Extract participants based on tournamentRole
    const tournamentEntrants = data.participants?.filter(p => p.tournamentRole !== 'Judge') || []; // Use tournamentRole
    const tournamentJudges = data.participants?.filter(p => p.tournamentRole === 'Judge') || []; // Use tournamentRole

    console.log('[useTournamentData] Processing entrants (new structure):', JSON.stringify(tournamentEntrants, null, 2)); // Updated logging
    setEntrants(tournamentEntrants.map(p => {
      console.log(`[useTournamentData] Processing participant p (Type: ${typeof p}):`, JSON.stringify(p, null, 2));
      if (typeof p === 'object' && p !== null) {
          console.log(`[useTournamentData] p.userId (Type: ${typeof p.userId}):`, JSON.stringify(p.userId, null, 2));
          if (!p.userId) {
              console.error('[useTournamentData] ERROR: p.userId is missing or falsy for participant object (entrant):', JSON.stringify(p, null, 2));
          }
      } else {
          console.error('[useTournamentData] ERROR: Participant p is not an object (entrant):', p);
      }
      // Inside the .map(p => { ... }) for entrants
      console.log('[useTournamentData] Mapping participant:', JSON.stringify(p, null, 2));
      const userIdData = p.userId;
      const extractedName = userIdData?.username || userIdData?.name || 'Unknown Participant';
      console.log('[useTournamentData] Extracted Name:', extractedName);
      console.log('[useTournamentData] Participant teamId:', p.teamId);
      return {
          id: userIdData?._id, // Use populated ID
          name: extractedName,
          email: userIdData?.email || 'N/A',
          phoneNumber: userIdData?.phoneNumber || 'N/A',
          club: userIdData?.club || 'N/A',
          tournamentRole: p.tournamentRole,
          teamId: p.teamId
      };
    }));

    console.log('[useTournamentData] Processing judges (new structure):', JSON.stringify(tournamentJudges, null, 2)); // Added logging
    setJudges(tournamentJudges.map(p => {
      console.log(`[useTournamentData] Processing participant p (Type: ${typeof p}):`, JSON.stringify(p, null, 2));
      if (typeof p === 'object' && p !== null) {
          console.log(`[useTournamentData] p.userId (Type: ${typeof p.userId}):`, JSON.stringify(p.userId, null, 2));
          if (!p.userId) {
              console.error('[useTournamentData] ERROR: p.userId is missing or falsy for participant object (judge):', JSON.stringify(p, null, 2));
          }
      } else {
          console.error('[useTournamentData] ERROR: Participant p is not an object (judge):', p);
      }
      // Return the mapped object
      return {
        userId: p.userId?._id, // Safe navigation
        id: p.userId?._id, // Safe navigation
        name: p.userId?.username, // Safe navigation
        email: p.userId?.email || 'N/A', // Safe navigation
        phoneNumber: p.userId?.phoneNumber || 'N/A', // Safe navigation
        club: p.userId?.club || 'N/A', // Safe navigation
        tournamentRole: p.tournamentRole // Should be 'Judge'
        // No teamId needed for judges
      };
    }));

    // Process teams
    if (data.teams && data.teams.length > 0) {
      setTeams(data.teams.map(team => {
        const leaderMember = team.members.find(m => m.role === 'leader');
        const speakerMember = team.members.find(m => m.role === 'speaker');
        
        // Extract all member names
        console.log('[useTournamentData] Processing team:', team.name, 'Raw members:', JSON.stringify(team.members, null, 2));
        const memberNames = team.members?.map(m => {
            console.log('[useTournamentData] Processing team member - m.userId:', JSON.stringify(m.userId, null, 2)); // Log the populated object
            const user = m.userId; // Keep this line for clarity if needed, or combine below
            const userName = user?.username || user?.name || 'Unknown Member'; // Use userName for clarity
            console.log('[useTournamentData] Extracted member name:', userName); // Log extracted name
            return userName ? formatDebaterName(userName) : 'Unknown Member'; // Apply format OR fallback per member, using userName
        }).join(', ') || 'N/A'; // Fallback if no members or all unknown

        console.log('[useTournamentData] Processed memberNames string:', memberNames);
        return {
          id: team._id,
          name: team.name,
          leader: formatDebaterName(leaderMember?.userId?.username),
          speaker: formatDebaterName(speakerMember?.userId?.username),
          leaderId: leaderMember?.userId?._id || leaderMember?.userId,
          speakerId: speakerMember?.userId?._id || speakerMember?.userId,
          members: memberNames, // Add the array of member names
          wins: team.wins || 0,
          losses: team.losses || 0,
          points: team.points || 0
        };
      }));
    } else {
      setTeams([]);
    }

    // Process postings
    const fetchedPostings = data.postings?.map(posting => {
      const team1 = data.teams?.find(t => t._id === posting.team1);
      const team2 = data.teams?.find(t => t._id === posting.team2);
      const judgeNames = posting.judges.map(judgeId => {
        const judge = data.participants?.find(p => p._id === judgeId);
        return judge?.username || 'Unknown Judge';
      }).join(', ');

      return {
        id: posting._id,
        team1: { id: posting.team1, name: team1?.name || 'Unknown Team' },
        team2: { id: posting.team2, name: team2?.name || 'Unknown Team' },
        team1Name: team1?.name || 'Unknown Team',
        team2Name: team2?.name || 'Unknown Team',
        location: posting.location,
        virtualLink: posting.virtualLink,
        judges: posting.judges, // Keep judge IDs here, map to objects in UI if needed
        judgeNames,
        theme: posting.theme,
        themeLabel: posting.theme, // Simplified for now
        useCustomModel: posting.useCustomModel,
        customModel: posting.useCustomModel ? posting.theme : '',
        scheduledTime: posting.scheduledTime,
        status: posting.status || 'scheduled',
        batchName: posting.batchName || '',
        notifications: posting.notifications
      };
    }) || [];
    setPostings(fetchedPostings);

  }, []); // Dependencies for processFetchedData

  const fetchTournament = useCallback(async () => {
    console.log(`[useTournamentData] Fetching data for tournament ID: ${tournamentId}`);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch tournament (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log('[useTournamentData] Fetched data:', data);
      processFetchedData(data);

    } catch (err) {
      console.error('[useTournamentData] Error fetching tournament:', err);
      setError(err.message || 'Failed to load tournament data');
      // Reset states on error
      setTournament(null);
      setEntrants([]);
      setTeams([]);
      setJudges([]);
      setPostings([]);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, processFetchedData]);

  const fetchStandings = useCallback(async () => {
    console.log(`[useTournamentData] Fetching standings for tournament ID: ${tournamentId}`);
    // Consider adding a separate loading state for standings if needed
    try {
      const response = await fetch(`${api.baseUrl}/api/apf/tabulation/${tournamentId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status}`);
      }

      const standingsData = await response.json();
      console.log('[useTournamentData] Fetched standings data:', standingsData);
      setStandings(standingsData);

      // Optionally update team stats based on standings
      if (standingsData.length > 0) {
        setTeams(prevTeams => {
          return prevTeams.map(team => {
            const teamStanding = standingsData.find(s => s.id === team.id);
            if (teamStanding) {
              return {
                ...team,
                wins: teamStanding.wins || 0,
                points: teamStanding.score || 0,
                // Losses might need calculation based on total games played
                losses: teamStanding.losses !== undefined ? teamStanding.losses : team.losses,
              };
            }
            return team;
          });
        });
      }

    } catch (err) {
      console.error('[useTournamentData] Error fetching standings:', err);
      // Decide if standings fetch failure should be a visible error
      // setError(err.message || 'Failed to load standings');
    }
  }, [tournamentId]);

  // Initial fetch
  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchStandings(); // Fetch standings initially as well
    } else {
      setError("Tournament ID is missing.");
      setLoading(false);
    }
  }, [tournamentId, fetchTournament, fetchStandings]);

  // Function to manually refresh all data
  const refreshData = useCallback(async () => {
    await fetchTournament();
    await fetchStandings();
  }, [fetchTournament, fetchStandings]);

  // Function to refresh only postings (example)
  const refreshPostings = useCallback(async () => {
     // This would ideally fetch only postings, but current API fetches everything
     // For now, just refetch all tournament data which includes postings
     await fetchTournament();
  }, [fetchTournament]);

  const generateTestData = useCallback(async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/generate-test-data`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate test data: ${errorText}`);
      }

      const result = await response.json();
      await fetchTournament(); // Refresh tournament data to get new participants
      return result;
    } catch (error) {
      console.error('Error generating test data:', error);
      throw error;
    }
  }, [tournamentId, fetchTournament]);

  // Function to initialize or regenerate the tournament bracket
  const initializeBracket = useCallback(async () => {
    console.log(`[useTournamentData] Initializing tournament bracket for ID: ${tournamentId}`);
    setInitializingBracket(true);
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/initialize-bracket`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initialize bracket: ${errorText}`);
      }

      const result = await response.json();
      await fetchTournament(); // Refresh tournament data to get the new bracket
      return result;
    } catch (error) {
      console.error('Error initializing tournament bracket:', error);
      throw error;
    } finally {
      setInitializingBracket(false);
    }
  }, [tournamentId, fetchTournament]);

  return {
    tournamentId,
    loading,
    error,
    tournament,
    entrants,
    teams,
    judges,
    postings,
    standings,
    initializingBracket,
    setTournament, // Expose setters if needed for optimistic updates elsewhere
    setEntrants,
    setTeams,
    setJudges,
    setPostings,
    setStandings,
    refreshData,
    refreshStandings: fetchStandings, // Renamed for clarity
    refreshPostings,
    generateTestData, // Add the new function to the return object
    initializeBracket, // Add the bracket initialization function to the return object
  };
};