const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');

class JudgeService {
  // Get all judges for a tournament
  async getJudgesForTournament(tournamentId) {
    const debate = await Debate.findById(tournamentId)
      .populate({
        path: 'participants',
        match: { tournamentRole: 'Judge' },
        populate: {
          path: 'userId',
          select: 'username _id email club phoneNumber experience judgingStyle'
        }
      })
      .populate('participants.checkedInBy', 'username _id')
      .lean();

    if (!debate) throw new Error('Tournament not found');

    // Filter and transform the participants to get only judges
    const judges = debate.participants
      .filter(p => p.tournamentRole === 'Judge')
      .map(p => {
        // Add check for missing/unpopulated userId
        if (!p.userId) {
          console.error(`[JudgeService] Data inconsistency: Participant ${p._id} with role 'Judge' is missing populated user data (userId is null or undefined) for tournament ${tournamentId}. Skipping this judge.`);
          return null; // Skip this entry
        }
        // If userId exists, proceed with mapping
        return {
          id: p._id, // This is the participant subdocument ID
          userId: p.userId._id, // This is the User document ID
          name: p.userId.username,
          email: p.userId.email,
          club: p.club || p.userId.club || '',
          judgeStatus: p.judgeStatus || p.userId.experience || '',
          judgeRank: p.judgeRank || 'Novice', // Include the judge rank
          yearsExperience: p.yearsExperience || 0, // Include years of experience
          courseLevel: p.courseLevel || '', // Include course level
          phoneNumber: p.userId.phoneNumber || '',
          isPresent: p.isPresent || false,
          checkedInAt: p.checkedInAt,
          checkedInBy: p.checkedInBy // This might be null if not checked in
        };
      })
      .filter(judge => judge !== null); // Filter out any null entries caused by missing userId

    return judges;
  }

  // Add a new judge to the tournament
  async addJudge(tournamentId, judgeData, creatorId) {
    const { name, email, club, judgeStatus, judgeRank, yearsExperience, courseLevel } = judgeData;
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');

    // Check if there's an existing user with this email
    let user = await User.findOne({ email });

    // If no user exists, create a new one
    if (!user) {
      // Generate a random password (they can reset it later)
      const randomPassword = Math.random().toString(36).slice(-8);

      user = await User.create({
        username: name,
        email,
        password: randomPassword, // This will be hashed by the User model pre-save hook
        role: 'participant',
        club: club || '',
        experience: judgeStatus || ''
      });
    }

    // Check if this user is already a judge in this tournament
    const existingParticipant = debate.participants.find(
      p => p.userId.toString() === user._id.toString() && p.tournamentRole === 'Judge'
    );

    if (existingParticipant) {
      throw new Error('This person is already a judge in this tournament');
    }

    // Add the user as a judge participant
    debate.participants.push({
      userId: user._id,
      tournamentRole: 'Judge',
      club: club || '',
      judgeStatus: judgeStatus || '',
      judgeRank: judgeRank || 'Novice', // Add judge rank
      yearsExperience: yearsExperience || 0, // Add years of experience
      courseLevel: courseLevel || '', // Add course level
      isPresent: false,
      status: 'registered'
    });

    // Update judge count
    if (debate.tournamentSettings) {
      debate.tournamentSettings.currentJudges = (debate.tournamentSettings.currentJudges || 0) + 1;
    }

    await debate.save();

    // Return the newly added judge
    return {
      id: debate.participants[debate.participants.length - 1]._id,
      userId: user._id,
      name: user.username,
      email: user.email,
      club: club || '',
      judgeStatus: judgeStatus || '',
      judgeRank: judgeRank || 'Novice', // Include judge rank
      yearsExperience: yearsExperience || 0, // Include years of experience
      courseLevel: courseLevel || '', // Include course level
      isPresent: false
    };
  }

  // Update a judge's information
  async updateJudge(tournamentId, judgeId, judgeData) {
    const { club, judgeStatus, judgeRank, yearsExperience, courseLevel, isPresent } = judgeData;
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');

    // Find the judge participant
    const judgeIndex = debate.participants.findIndex(
      p => p._id.toString() === judgeId && p.tournamentRole === 'Judge'
    );

    if (judgeIndex === -1) {
      throw new Error('Judge not found in this tournament');
    }

    // Update judge information
    if (club !== undefined) {
      debate.participants[judgeIndex].club = club;
    }

    if (judgeStatus !== undefined) {
      debate.participants[judgeIndex].judgeStatus = judgeStatus;
    }

    if (judgeRank !== undefined) {
      debate.participants[judgeIndex].judgeRank = judgeRank;
    }

    if (yearsExperience !== undefined) {
      debate.participants[judgeIndex].yearsExperience = yearsExperience;
    }

    if (courseLevel !== undefined) {
      debate.participants[judgeIndex].courseLevel = courseLevel;
    }

    if (isPresent !== undefined) {
      debate.participants[judgeIndex].isPresent = isPresent;

      // If marking as present and wasn't before, add timestamp
      if (isPresent && !debate.participants[judgeIndex].isPresent) {
        debate.participants[judgeIndex].checkedInAt = new Date();
      }
    }

    debate.markModified('participants');
    await debate.save();

    // Get the updated judge with populated user info
    const updatedDebate = await Debate.findById(tournamentId)
      .populate({
        path: 'participants',
        match: { _id: debate.participants[judgeIndex]._id },
        populate: { path: 'userId', select: 'username email' }
      })
      .lean();

    const updatedJudge = updatedDebate.participants[0];

    return {
      id: updatedJudge._id,
      userId: updatedJudge.userId._id,
      name: updatedJudge.userId.username,
      email: updatedJudge.userId.email,
      club: updatedJudge.club || '',
      judgeStatus: updatedJudge.judgeStatus || '',
      judgeRank: updatedJudge.judgeRank || 'Novice', // Include judge rank
      yearsExperience: updatedJudge.yearsExperience || 0, // Include years of experience
      courseLevel: updatedJudge.courseLevel || '', // Include course level
      isPresent: updatedJudge.isPresent || false,
      checkedInAt: updatedJudge.checkedInAt
    };
  }

  // Remove a judge from the tournament
  async removeJudge(tournamentId, judgeId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');

    // Find the judge participant
    const judgeIndex = debate.participants.findIndex(
      p => p._id.toString() === judgeId && p.tournamentRole === 'Judge'
    );

    if (judgeIndex === -1) {
      throw new Error('Judge not found in this tournament');
    }

    // Remove the judge
    debate.participants.splice(judgeIndex, 1);

    // Update judge count
    if (debate.tournamentSettings) {
      debate.tournamentSettings.currentJudges = Math.max(0, (debate.tournamentSettings.currentJudges || 0) - 1);
    }

    debate.markModified('participants');
    await debate.save();

    return { success: true, message: 'Judge removed successfully' };
  }

  // Check in a judge (mark as present)
  async checkInJudge(tournamentId, judgeId, userId) {
    return await this.updateJudge(tournamentId, judgeId, {
      isPresent: true,
      checkedInBy: userId
    });
  }

  // Check out a judge (mark as not present)
  async checkOutJudge(tournamentId, judgeId) {
    return await this.updateJudge(tournamentId, judgeId, {
      isPresent: false,
      checkedInAt: null
    });
  }
}

module.exports = new JudgeService();
