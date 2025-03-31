require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Kazakh team names and individual names
const teamNames = [
  'Astana Arystandary', 'Almaty Barsy', 'Shymkent Samgauy', 
  'Karagandy Karplar', 'Aktobe Akzhayiktar', 'Atyrau Arlandary',
  'Oskemen Onzhortalary', 'Pavlodar Pertsendy', 'Taraz Tulpary',
  'Kostanay Koblany', 'Aktau Arlandary', 'Semey Sunkary',
  'Kyzylorda Kyzgaldaky', 'Turkistan Tulpary', 'Petropavl Peri',
  'Kokshetau Koktemy'
];

const kazakhFirstNames = [
  'Aibek', 'Nurlybek', 'Daulet', 'Askar', 'Mukhtar', 'Zhanar', 'Aizhan', 'Dana',
  'Bekzhan', 'Talgat', 'Zhandos', 'Nurzhan', 'Madi', 'Almas', 'Nursaule', 'Aigerim',
  'Dilnaz', 'Gulnaz', 'Madina', 'Nazgul', 'Aisha', 'Dina', 'Gulmira', 'Nurana',
  'Aizere', 'Diana', 'Gulzhan', 'Nurly', 'Serik', 'Saule'
];

const kazakhLastNames = [
  'Nurlanov', 'Tastanov', 'Kenzhebayev', 'Tuleuov', 'Әлімов', 'Қасымова', 'Нұрлыбекова', 'Сәрсенбаева',
  'Рахимов', 'Жумабаев', 'Оспанов', 'Исмагулов', 'Төлегенов', 'Сүлейменова', 'Жанибекова', 'Ғабитов',
  'Қалиев', 'Ахметова', 'Байқадамов', 'Серікқызы', 'Ерғалиев', 'Мұқанова', 'Нұрсұлтанұлы', 'Бекболат'
];

const generatePassword = () => Math.random().toString(36).slice(-8);

async function createTeams() {
  try {
    // Hash the password outside the loop to avoid unnecessary processing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const createdTeamMembers = [];
    
    // Create 4 members for each team (most programming competitions have teams of 3-4)
    for (const teamName of teamNames) {
      const teamMembers = [];
      
      for (let i = 0; i < 4; i++) {
        const firstName = kazakhFirstNames[Math.floor(Math.random() * kazakhFirstNames.length)];
        const lastName = kazakhLastNames[Math.floor(Math.random() * kazakhLastNames.length)];
        const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Math.floor(Math.random() * 100)}`;
        const email = `${username}@example.kz`;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          console.log(`User ${firstName} ${lastName} already exists`);
          teamMembers.push(existingUser);
          continue;
        }
        
        const newUser = new User({
          username,
          email,
          name: firstName,
          surname: lastName,
          password: hashedPassword,
          role: 'participant',
          createdAt: new Date(),
          isVerified: true,
          team: teamName // Add team name to user
        });
        
        await newUser.save();
        teamMembers.push(newUser);
        console.log(`Created team member: ${firstName} ${lastName} for team ${teamName}`);
      }
      
      createdTeamMembers.push({
        teamName,
        members: teamMembers
      });
    }
    
    console.log(`Created ${createdTeamMembers.length} teams with ${createdTeamMembers.reduce((total, team) => total + team.members.length, 0)} members`);
    
  } catch (error) {
    console.error('Error creating teams:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTeams(); 