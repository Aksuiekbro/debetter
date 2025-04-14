const mongoose = require('mongoose');
require('dotenv').config();
require('../models/User');
require('../models/Debate');

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await mongoose.model('User').deleteMany({});

    await mongoose.model('Debate').deleteMany({});

    console.log('All data cleared');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main(); 