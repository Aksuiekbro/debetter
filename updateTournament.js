require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Tournament ID from the URL
const TOURNAMENT_ID = '67e9100f4510e481c2667079';

// Read the tournament data from JSON file
const tournamentData = JSON.parse(fs.readFileSync('./qamqorCupData.json', 'utf8'));

// Function to update the tournament
const updateTournament = async () => {
  try {
    
    // Get admin token from .env file or set a default one for testing
    const token = process.env.ADMIN_TOKEN || 'your-admin-token';
    
    // Make PUT request to update the tournament
    const response = await axios.put(`http://localhost:5001/api/tournaments/${TOURNAMENT_ID}`, tournamentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
  } catch (error) {
    console.error('Error updating tournament:', error.response ? error.response.data : error.message);
  }
};

// Run the script
updateTournament(); 