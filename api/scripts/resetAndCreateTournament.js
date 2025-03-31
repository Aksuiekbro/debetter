require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

// Fixed dates to use
const JAN_15_2025 = new Date('2025-01-15T12:00:00Z');
const FEB_14_2025 = new Date('2025-02-14T12:00:00Z'); 
const FEB_15_2025 = new Date('2025-02-15T12:00:00Z');
const FEB_16_2025 = new Date('2025-02-16T12:00:00Z');

// Generate a random date between Jan 15 and Feb 14, 2025
const getRandomEnrollDate = () => {
  return new Date(JAN_15_2025.getTime() + Math.random() * (FEB_14_2025.getTime() - JAN_15_2025.getTime()));
};

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(); // Get default database from connection string
    
    // Clear existing collections
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('debates').deleteMany({});
    console.log('Data cleared');

    // Create Kazakh judges
    console.log('Creating judges...');
    const judgeIDs = [];
    const judges = [
      { username: 'judge_aibek', name: 'Aibek', email: 'aibek@turan.edu.kz', role: 'judge', judgeRole: 'Head Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_nurlybek', name: 'Nurlybek', email: 'nurlybek@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_daulet', name: 'Daulet', email: 'daulet@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_askar', name: 'Askar', email: 'askar@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_mukhtar', name: 'Mukhtar', email: 'mukhtar@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_zhanar', name: 'Zhanar', email: 'zhanar@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_aizhan', name: 'Aizhan', email: 'aizhan@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() },
      { username: 'judge_dana', name: 'Dana', email: 'dana@turan.edu.kz', role: 'judge', judgeRole: 'Judge', password: 'password123', isTestAccount: true, createdAt: getRandomEnrollDate() }
    ];

    for (const judge of judges) {
      const result = await db.collection('users').insertOne(judge);
      judgeIDs.push(result.insertedId);
    }
    console.log(`Created ${judges.length} judges`);

    // Create Kazakh debaters
    console.log('Creating debaters...');
    const debaterIDs = [];
    const debaterNames = [
      'Alibek', 'Nursultan', 'Daulet', 'Askar', 'Mukhtar', 'Zhanar', 'Aizhan', 'Dana',
      'Bekzhan', 'Nurlybek', 'Aibek', 'Talgat', 'Zhandos', 'Nurzhan', 'Madi', 'Almas',
      'Nursaule', 'Aigerim', 'Dilnaz', 'Gulnaz', 'Madina', 'Nazgul', 'Aisha', 'Dina',
      'Gulmira', 'Nurana', 'Aizere', 'Diana', 'Gulzhan', 'Nurly', 'Aizhan', 'Dina'
    ];

    for (let i = 0; i < debaterNames.length; i++) {
      const name = debaterNames[i];
      // Use prefixed username for backend uniqueness
      const username = `debater_${name.toLowerCase()}${i+1}`;
      const email = `${name.toLowerCase()}${i+1}@turan.edu.kz`;
      const debater = {
        username, // Backend unique username 
        name, // Set to just the name for display
        email,
        role: 'user',
        password: 'password123',
        isTestAccount: true,
        createdAt: getRandomEnrollDate() // Explicit enrollment date before Feb 15
      };
      
      const result = await db.collection('users').insertOne(debater);
      debaterIDs.push(result.insertedId);
    }
    console.log(`Created ${debaterNames.length} debaters`);

    // Create the tournament with participants
    console.log('Creating tournament...');
    const participants = [];
    for (const judgeId of judgeIDs) {
      participants.push(judgeId);
    }
    for (const debaterId of debaterIDs) {
      participants.push(debaterId);
    }

    const tournament = {
      title: 'Qamqor Cup',
      description: 'Annual debate tournament at Turan University',
      category: 'politics',
      status: 'completed',
      difficulty: 'advanced',
      startDate: FEB_15_2025,
      participants: participants,
      creator: judgeIDs[0], // Head judge as creator
      format: 'tournament',
      mode: 'duo',
      registrationDeadline: FEB_14_2025,
      requiredJudges: 8,
      maxJudges: 8,
      tournamentSettings: {
        maxDebaters: 32,
        maxJudges: 8,
        currentDebaters: 32,
        currentJudges: 8
      },
      createdAt: JAN_15_2025, // Explicit creation date
      startedAt: FEB_15_2025, // Explicit start date
      endedAt: FEB_16_2025, // Explicit end date
      updatedAt: new Date() // Current timestamp for updatedAt
    };

    const result = await db.collection('debates').insertOne(tournament);
    console.log(`Created tournament: ${result.insertedId}`);

    console.log('All data created successfully');
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 