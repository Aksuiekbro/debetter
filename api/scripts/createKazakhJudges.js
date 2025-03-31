require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Kazakh judges
const kazakhJudges = [
  { username: 'aibek_judge', email: 'aibek.judge@example.kz', name: 'Aibek', surname: 'Nurlanov' },
  { username: 'nurlybek_judge', email: 'nurlybek.judge@example.kz', name: 'Nurlybek', surname: 'Tastanov' },
  { username: 'daulet_judge', email: 'daulet.judge@example.kz', name: 'Daulet', surname: 'Kenzhebayev' },
  { username: 'askar_judge', email: 'askar.judge@example.kz', name: 'Askar', surname: 'Tuleuov' },
  { username: 'mukhtar_judge', email: 'mukhtar.judge@example.kz', name: 'Mukhtar', surname: 'Әlіmov' },
  { username: 'zhanar_judge', email: 'zhanar.judge@example.kz', name: 'Zhanar', surname: 'Қасымова' },
  { username: 'aizhan_judge', email: 'aizhan.judge@example.kz', name: 'Aizhan', surname: 'Нұрлыбекова' },
  { username: 'dana_judge', email: 'dana.judge@example.kz', name: 'Dana', surname: 'Сәрсенбаева' }
];

async function createJudges() {
  try {
    // Hash the password outside the loop to avoid unnecessary processing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const createdJudges = [];
    
    // Check for existing judges to avoid duplicates
    for (const judge of kazakhJudges) {
      const existingUser = await User.findOne({ email: judge.email });
      
      if (existingUser) {
        console.log(`Judge ${judge.name} ${judge.surname} already exists`);
        createdJudges.push(existingUser);
        continue;
      }
      
      const newJudge = new User({
        ...judge,
        password: hashedPassword,
        role: 'judge',
        createdAt: new Date(),
        isVerified: true
      });
      
      await newJudge.save();
      createdJudges.push(newJudge);
      console.log(`Created judge: ${newJudge.name} ${newJudge.surname}`);
    }
    
    console.log(`Created ${createdJudges.length} judges successfully`);
    
  } catch (error) {
    console.error('Error creating judges:', error);
  } finally {
    mongoose.disconnect();
  }
}

createJudges(); 