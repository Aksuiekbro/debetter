const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Debate = require('../models/Debate'); // Use Debate model
const User = require('../models/User'); // Require User model

const debateId = '67e9100f4510e481c2667079'; // This ID now refers to a Debate document
const headJudgeId = '67e910074510e481c2667051';

const assignHeadJudge = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const headJudgeObjectId = new mongoose.Types.ObjectId(headJudgeId);

    // Find the Debate document by its ID
    const debate = await Debate.findById(debateId);

    if (!debate) {
      await mongoose.disconnect();
      return;
    }

    // Check if the debate format is 'tournament' (optional, but good practice)
    if (debate.format !== 'tournament') {
        await mongoose.disconnect();
        return;
    }

    if (!debate.postings || debate.postings.length === 0) {
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;
    let postingsFound = debate.postings.length;

    debate.postings.forEach(posting => {
      // Ensure judges array exists and convert existing judge IDs to strings for comparison
      const judgeIdsAsString = (posting.judges || []).map(id => id.toString());

      // Check if headJudgeId (as string) is already in the array
      if (!judgeIdsAsString.includes(headJudgeId)) {
        // If not present, add the ObjectId
        if (!posting.judges) {
          posting.judges = []; // Initialize if it doesn't exist
        }
        posting.judges.push(headJudgeObjectId);
        updatedCount++;
      } else {
      }
    });

    if (updatedCount > 0) {
      // Mark the postings array as modified since we updated it in code
      debate.markModified('postings');
      await debate.save();
    } else {
    }

  } catch (err) {
    console.error('Error assigning head judge:', err.message);
    // Consider more specific error handling if needed
  } finally {
    // Ensure disconnection even if errors occur before the main logic
    if (mongoose.connection.readyState === 1) { // 1 means connected
        await mongoose.disconnect();
    }
  }
};

assignHeadJudge();