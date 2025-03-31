const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');
const { analyzeDebateSpeech, analyzeDebateSummary, analyzeInterimTranscript } = require('./aiService'); // Assuming aiService is in the same dir

class TranscriptService {

    // Saves a single transcript segment to the active room
    async saveTranscriptSegment(debateId, roomId, segmentData) {
        const { text, timestamp, speaker } = segmentData; // speaker should be speakerId
        if (!text || !speaker) {
            throw new Error('Missing text or speaker ID for transcript segment');
        }

        const debate = await Debate.findById(debateId);
        if (!debate) throw new Error('Debate not found');

        let room;
        if (roomId) {
            room = debate.rooms?.id(roomId);
        } else {
            // Find the currently active room if no specific room ID is given
            room = debate.rooms?.find(r => r.isActive);
        }

        if (!room) throw new Error('Target room not found or no active room');

        // Validate speaker is a participant (optional but good practice)
        // const speakerUser = await User.findById(speaker);
        // if (!speakerUser) throw new Error('Speaker user not found');
        // if (!debate.participants.some(p => p._id.equals(speakerUser._id))) {
        //     throw new Error('Speaker is not a participant in this debate');
        // }

        const transcriptEntry = {
            _id: new mongoose.Types.ObjectId(), // Generate ID
            text: text,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            speaker: speaker // Store the speaker's User ID
        };

        if (!room.transcription) room.transcription = [];
        room.transcription.push(transcriptEntry);

        await debate.save();

        // Return the saved entry (or the whole transcript array)
        // Need to fetch again to populate speaker if needed by caller
        const updatedDebate = await Debate.findById(debateId)
                                          .populate('rooms.transcription.speaker', 'username'); // Populate speaker username
        const updatedRoom = updatedDebate.rooms.id(room._id);
        const savedEntry = updatedRoom.transcription.id(transcriptEntry._id); // Find the newly added entry

        return savedEntry; // Return the saved entry with populated speaker
    }

    // Formats transcriptions from a room for AI analysis
    formatTranscript(transcription = []) {
        // Sort by timestamp first
        const sortedTranscription = [...transcription].sort((a, b) =>
            (a.timestamp ? new Date(a.timestamp) : 0) - (b.timestamp ? new Date(b.timestamp) : 0)
        );

        // Format into "Speaker: Text" lines
        return sortedTranscription
            .map(t => `${t.speaker?.username || 'Unknown Speaker'}: ${t.text}`) // Use populated username
            .join('\n\n'); // Separate entries with double newline
    }

    // Performs interim analysis on the current transcript of a room
    async performInterimAnalysis(debateId, roomId) {
        const debate = await Debate.findById(debateId)
                                   .populate('rooms.transcription.speaker', 'username'); // Populate speaker
        if (!debate) throw new Error('Debate not found');

        const room = debate.rooms?.id(roomId);
        if (!room) throw new Error('Room not found');
        if (!room.transcription || room.transcription.length === 0) {
            throw new Error('No transcript available for interim analysis');
        }

        const formattedTranscript = this.formatTranscript(room.transcription);
        const analysis = await analyzeInterimTranscript(formattedTranscript); // Call AI service

        // Save the analysis to the room
        room.currentAnalysis = analysis;
        await debate.save();

        return analysis;
    }

    // Performs final analysis on the active room's transcript and updates debate status
    async performFinalAnalysis(debateId) {
        const debate = await Debate.findById(debateId)
                                   .populate('rooms.transcription.speaker', 'username'); // Populate speaker
        if (!debate) throw new Error('Debate not found');

        const activeRoom = debate.rooms?.find(r => r.isActive);
        if (!activeRoom) throw new Error('No active room found for final analysis');
        if (!activeRoom.transcription || activeRoom.transcription.length === 0) {
            // Decide how to handle - maybe just complete without analysis?
             console.warn(`No transcript found in active room ${activeRoom._id} for debate ${debateId}. Completing without analysis.`);
             activeRoom.isActive = false;
             debate.status = 'completed';
             debate.endedAt = new Date();
             await debate.save();
             return { message: "Debate completed, but no transcript was available for analysis." };
            // OR: throw new Error('No transcript available for final analysis');
        }

        const formattedTranscript = this.formatTranscript(activeRoom.transcription);
        const analysis = await analyzeDebateSummary(formattedTranscript); // Call AI service

        // Update debate status and save analysis
        debate.status = 'completed';
        debate.analysis = analysis; // Store final analysis at the debate level
        debate.endedAt = new Date();
        activeRoom.isActive = false; // Mark room as inactive

        await debate.save();

        return analysis; // Return the final analysis result
    }

     // Analyzes a single speech text using the AI service
     async analyzeSingleSpeech(speechText) {
        if (!speechText) {
            throw new Error("Speech text cannot be empty");
        }
        // Directly call the AI service function
        const analysisResult = await analyzeDebateSpeech(speechText);
        return analysisResult;
    }

}

module.exports = new TranscriptService();