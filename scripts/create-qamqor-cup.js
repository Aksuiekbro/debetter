const axios = require('axios');

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if your API runs elsewhere

// Get token from command line argument
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
    console.error('Error: No API authentication token provided.');
    console.log('Usage: node scripts/create-qamqor-cup.js <your_jwt_token>');
    process.exit(1);
}

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
    }
});

// --- Data Generation ---
function generateKazakhUsers(debaterCount = 32, organizerCount = 1) {
    const users = [];
    const firstNames = ["Aibek", "Nurlan", "Kairat", "Sanzhar", "Azamat", "Timur", "Ruslan", "Marat", "Damir", "Olzhas", "Galymzhan", "Yerlan", "Serik", "Berik", "Kanat", "Askhat", "Gulnaz", "Aruzhan", "Madina", "Aigerim", "Aliya", "Dinara", "Zhanar", "Saule", "Anara", "Aisulu", "Dana", "Asem", "Kamila", "Leila", "Zarina", "Symbat"];
    const lastNames = ["Nazarbayev", "Tokayev", "Akhmetov", "Smagulov", "Sultanov", "Omarov", "Ismailov", "Aliyev", "Serikov", "Bolatov", "Kuanyshev", "Zhumagulov", "Tulegenov", "Bekturov", "Saparov", "Mukanov"];

    // Generate Debaters
    for (let i = 0; i < debaterCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const username = `${firstName}${lastName}${i}`;
        users.push({
            username: username,
            email: `${username.toLowerCase()}@qamqor.test.com`,
            password: 'password123', // Standard password for test users
            role: 'user',
            isTestAccount: true
        });
    }

    // Generate Organizer(s)
    for (let i = 0; i < organizerCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const username = `${firstName}${lastName}Org${i}`;
        users.push({
            username: username,
            email: `${username.toLowerCase()}@qamqor.test.com`,
            password: 'password123',
            role: 'organizer',
            isTestAccount: true
        });
    }
    return users;
}

// --- Main Execution Logic ---
async function createQamqorCup() {
    console.log('Starting Qamqor Cup creation script...');

    try {
        // 1. Generate User Data
        console.log('Generating user data...');
        const usersToCreate = generateKazakhUsers(32, 1);
        const organizerData = usersToCreate.find(u => u.role === 'organizer');
        const debaterData = usersToCreate.filter(u => u.role === 'user');
        console.log(`Generated ${debaterData.length} debaters and ${organizerData ? 1 : 0} organizer.`);

        // 2. Create Users via API
        console.log('Registering test users via API...');
        const registerResponse = await axiosInstance.post('/users/register-test-users', { users: usersToCreate });
        const createdUsers = registerResponse.data.users; // Assuming API returns created users with IDs
        console.log(`Successfully registered ${createdUsers.length} users.`);

        if (!createdUsers || createdUsers.length !== usersToCreate.length) {
             console.warn(`Warning: Expected ${usersToCreate.length} users, but API reported ${createdUsers?.length || 0} created.`);
             // Potentially filter out nulls if API returns them for duplicates
        }

        const organizer = createdUsers.find(u => u.email === organizerData.email);
        const debaters = createdUsers.filter(u => u.role === 'user');

        if (!organizer) {
            throw new Error('Failed to find the created organizer user.');
        }
        if (debaters.length !== 32) {
             console.warn(`Warning: Expected 32 debaters, but found ${debaters.length} created debaters.`);
             // Decide if script should continue or stop
             if (debaters.length === 0) throw new Error('Failed to find any created debater users.');
        }
        const debaterIds = debaters.map(d => d._id);
        console.log(`Organizer ID: ${organizer._id}`);
        console.log(`Debater IDs captured: ${debaterIds.length}`);


        // 3. Create Tournament via API
        console.log('Creating tournament via API...');
        const tournamentData = {
            title: "Qamqor Cup",
            description: "Tournament hosted by Turan University (Historical Record)",
            difficulty: 'advanced',
            category: 'society',
            format: 'tournament', // Ensure format is set
            creator: organizer._id, // Use the ID of the created organizer
            // Using temporary future dates to pass validation
            startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            // Add other necessary fields based on the Debate model defaults/requirements if any
             tournamentSettings: { // Explicitly set tournament settings
                 maxDebaters: 32,
                 maxJudges: 8, // Even if we add 0 judges now, set the max
             }
        };

        // We need the creator object for prepareTournamentData, but the API likely handles this.
        // The createDebate controller might just need the creator ID. Let's assume it does.
        // If it fails, we might need to fetch the creator user details first.
        const tournamentResponse = await axiosInstance.post('/debates', tournamentData);
        const tournament = tournamentResponse.data; // Assuming API returns the created tournament
        const tournamentId = tournament._id;
        console.log(`Successfully created tournament "${tournament.title}" with ID: ${tournamentId}`);

        // 4. Add Participants via API
        console.log(`Adding ${debaterIds.length} debaters to tournament ${tournamentId}...`);
        const participantsData = {
            judges: [], // No judges to add in this step
            debaters: debaterIds
        };
        await axiosInstance.post(`/debates/${tournamentId}/register-participants`, participantsData);
        console.log('Successfully added debaters as participants.');

        console.log('\n--- Script Finished Successfully ---');
        console.log(`Created Organizer: ${organizer.username} (${organizer._id})`);
        console.log(`Created Tournament: Qamqor Cup (${tournamentId})`);
        console.log(`Added ${debaterIds.length} Debaters.`);
        console.log('\nIMPORTANT REMINDER:');
        console.log('You MUST now manually update the tournament record in the database:');
        console.log(`- Find tournament with ID: ${tournamentId}`);
        console.log('- Set startDate to "2025-02-15T..."');
        console.log('- Set registrationDeadline to before Feb 15th');
        console.log('- Set status to "completed"');
        console.log('------------------------------------');

    } catch (error) {
        console.error('\n--- Script Failed ---');
        if (error.response) {
            // API error
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Network error
            console.error('Network Error:', error.message);
        } else {
            // Other errors
            console.error('Error:', error.message);
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
createQamqorCup();