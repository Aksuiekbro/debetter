const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Analyze a single speech segment
exports.analyzeDebateSpeech = async (transcript) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this debate speech segment and provide:
    1. Key arguments (max 3)
    2. Statistical claims made (if any)
    3. Logical connections and transitions used

    Speech: "${transcript}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response into structured data
    const analysis = parseAIResponse(text);

    return analysis;
  } catch (error) {
    console.error('Error in speech analysis:', error);
    return {
      keyArguments: [],
      statisticalClaims: [],
      logicalConnections: []
    };
  }
};

// Modify the analyzeDebateSummary function to better handle team-based analysis
exports.analyzeDebateSummary = async (fullTranscript, teams) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a professional debate judge. Analyze this debate transcript and provide a comprehensive analysis.
    
    Format of the debate:
    - Proposition team members: ${teams.propositionTeam.join(', ')}
    - Opposition team members: ${teams.oppositionTeam.join(', ')}

    Full Debate Transcript:
    ${fullTranscript}

    Please provide a structured analysis with the following sections:

    1. Proposition Team's Arguments:
    - List each major argument
    - Include any supporting evidence provided
    - Note if and how each argument was countered by the opposition

    2. Opposition Team's Arguments:
    - List each major argument
    - Include any supporting evidence provided
    - Note if and how each argument was countered by the proposition

    3. Statistical Claims Analysis:
    - List all statistical claims made by either side
    - Assess the credibility and context of each claim
    - Flag any potentially misleading or unverified statistics

    4. Unaddressed Arguments:
    - Identify any significant arguments that weren't properly addressed by the opposing team

    5. Overall Debate Flow:
    - Assess the logical progression of arguments
    - Identify strong rhetorical techniques used
    - Note any significant gaps in reasoning

    Please format your response in a way that can be easily parsed into sections.`;

    const result = await model.generateContent(prompt);
    const analysisText = await result.response.text();
    console.log('AI Analysis:', analysisText); // Debug log

    const analysis = {
      propositionArguments: extractArgumentsFromSection(findSection(analysisText, "Proposition Team's Arguments")),
      oppositionArguments: extractArgumentsFromSection(findSection(analysisText, "Opposition Team's Arguments")),
      factCheck: extractFactCheckFromSection(findSection(analysisText, "Statistical Claims Analysis")),
      unaddressedArguments: extractUnaddressedFromSection(findSection(analysisText, "Unaddressed Arguments")),
      overallFlow: findSection(analysisText, "Overall Debate Flow")
    };

    return analysis;
  } catch (error) {
    console.error('Error in debate analysis:', error);
    return {
      propositionArguments: [],
      oppositionArguments: [],
      factCheck: [],
      unaddressedArguments: [],
      overallFlow: "Analysis failed due to an error"
    };
  }
};

exports.analyzeInterimTranscript = async (transcript, teams) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are a real-time debate analyst. Analyze this ongoing debate transcript and provide immediate insights.
    
    Teams:
    - Proposition: ${teams.propositionTeam.join(', ')}
    - Opposition: ${teams.oppositionTeam.join(', ')}

    Current Transcript:
    ${transcript}

    Please provide:
    1. Key arguments from the Proposition team (list the 3 strongest with evidence)
    2. Key arguments from the Opposition team (list the 3 strongest with evidence)
    3. Point-by-point rebuttal status (which arguments have been addressed)
    4. Suggestions for areas that need more focus

    Format your analysis to be clear and concise, focusing on the most recent developments.`;

    const result = await model.generateContent(prompt);
    const analysisText = await result.response.text();

    // Parse the interim analysis into a structured format
    const analysis = {
      propositionArguments: extractArgumentsFromSection(findSection(analysisText, "Key arguments from the Proposition")),
      oppositionArguments: extractArgumentsFromSection(findSection(analysisText, "Key arguments from the Opposition")),
      rebuttalStatus: extractRebuttalStatus(findSection(analysisText, "Point-by-point rebuttal status")),
      suggestedFocus: findSection(analysisText, "Suggestions").split('\n').filter(line => line.trim())
    };

    return analysis;
  } catch (error) {
    console.error('Error in interim analysis:', error);
    return {
      propositionArguments: [],
      oppositionArguments: [],
      rebuttalStatus: [],
      suggestedFocus: []
    };
  }
};

// Helper function to parse AI response for speech analysis
function parseAIResponse(aiText) {
  // Simple parsing logic - can be made more sophisticated
  const sections = aiText.split('\n\n');
  return {
    keyArguments: extractListItems(sections[0]),
    statisticalClaims: extractListItems(sections[1]),
    logicalConnections: extractListItems(sections[2])
  };
}

// Helper function to parse the AI analysis into structured format
function parseDebateAnalysis(analysisText, teams) {
  const sections = analysisText.split('\n\n');
  
  return {
    propositionArguments: extractArguments(
      findSection(sections, 'Proposition Arguments')
    ),
    oppositionArguments: extractArguments(
      findSection(sections, 'Opposition Arguments')
    ),
    factCheck: extractFactCheck(
      findSection(sections, 'Statistical Claims')
    ),
    unaddressedArguments: extractUnaddressedArguments(
      findSection(sections, 'Overall Flow Analysis')
    )
  };
}

function findSection(text, sectionTitle) {
  const sections = text.split(/\d+\./);
  const section = sections.find(s => s.includes(sectionTitle));
  return section ? section.split('\n').slice(1).join('\n').trim() : '';
}

function extractArgumentsFromSection(section) {
  const lines = section.split('\n');
  const debateArguments = [];
  let currentArg = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./)) {
      if (currentArg) debateArguments.push(currentArg);
      currentArg = {
        argument: trimmedLine.replace(/^-|\d+\.\s*/, '').trim(),
        evidence: '',
        counterArgument: ''
      };
    } else if (currentArg && trimmedLine) {
      if (trimmedLine.toLowerCase().includes('evidence:')) {
        currentArg.evidence = trimmedLine.split('evidence:')[1].trim();
      } else if (trimmedLine.toLowerCase().includes('counter:')) {
        currentArg.counterArgument = trimmedLine.split('counter:')[1].trim();
      }
    }
  }
  if (currentArg) debateArguments.push(currentArg);
  return debateArguments;
}

function extractFactCheckFromSection(section) {
  return section.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const trimmedLine = line.trim().replace(/^-|\d+\.\s*/, '');
      const parts = trimmedLine.split(':');
      return {
        statement: parts[0].trim(),
        verification: parts[1] ? parts[1].trim() : 'Unverified'
      };
    });
}

function extractUnaddressedFromSection(section) {
  return section.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const trimmedLine = line.trim().replace(/^-|\d+\.\s*/, '');
      const [speaker, ...rest] = trimmedLine.split(':');
      return {
        speaker: speaker.trim(),
        argument: rest.join(':').trim()
      };
    });
}

function findSectionByTitle(sections, sectionTitle) {
  const section = sections.find(s => s.toLowerCase().includes(sectionTitle.toLowerCase()));
  return section || '';
}

function extractArguments(section) {
  const lines = section.split('\n');
  const debateArguments = [];
  let currentArg = null;
  for (const line of lines) {
    if (line.match(/^\d+\.|^-/)) {
      // New argument
      if (currentArg) debateArguments.push(currentArg);
      currentArg = {
        argument: line.replace(/^\d+\.|-\s*/, '').trim(),
        evidence: '',
        counterArgument: ''
      };
    } else if (currentArg) {
      // Additional information for current argument
      if (line.toLowerCase().includes('evidence:')) {
        currentArg.evidence = line.split('evidence:')[1].trim();
      } else if (line.toLowerCase().includes('counter:')) {
        currentArg.counterArgument = line.split('counter:')[1].trim();
      }
    }
  }
  if (currentArg) debateArguments.push(currentArg);
  return debateArguments;
}

function extractFactCheck(section) {
  return section.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const [statement, ...rest] = line.split(':');
      return {
        statement: statement.replace(/^\d+\.|^-/, '').trim(),
        verification: rest.join(':').trim() || 'Unverified'
      };
    });
}

function extractUnaddressedArguments(section) {
  return section.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const match = line.match(/([^:]+):\s*(.+)/);
      if (match) {
        return {
          speaker: match[1].trim(),
          argument: match[2].trim()
        };
      }
      return {
        speaker: 'Unknown',
        argument: line.trim()
      };
    });
}

function extractRebuttalStatus(section) {
  return section.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const trimmed = line.trim().replace(/^-|\d+\.\s*/, '');
      const [argument, status] = trimmed.split(':').map(s => s.trim());
      return { argument, status };
    });
}

// Helper functions for text extraction
function extractListItems(text) {
  return text.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().substring(1).trim());
}

function extractTime(text) {
  const timeMatch = text.match(/(\d+)\s*minutes?/i);
  return timeMatch ? `${timeMatch[1]} minutes` : 'Unknown';
}

function extractArgumentsWithStatus(text) {
  const argumentLines = text.split('\n')
    .filter(line => line.includes('argument') || line.includes('point'));
  
  return argumentLines.map(line => ({
    text: line.replace(/^[-*]\s*/, '').trim(),
    wasCountered: line.toLowerCase().includes('counter')
  }));
}

function extractThemes(text) {
  const themeSection = text.split('Key themes:')[1] || '';
  return themeSection.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

// Rename this function to avoid duplicate declaration
function parseUnaddressedPoints(text) {
  return text.split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const [speaker, argument] = line.split(':');
      return {
        speaker: speaker.trim(),
        argument: argument.trim()
      };
    });
}

function parseFactChecks(text) {
  return text.split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const [statement, verification] = line.split(':');
      return {
        statement: statement.trim(),
        verification: verification.trim()
      };
    });
}

// Generate realistic test users for tournament testing
exports.generateTestUsers = async (count = 10) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate ${count} realistic test user profiles for a debate tournament platform with:
    - Full names (first and last names)
    - Email addresses (matching the names)
    - Brief bios (1 sentence)
    - Debate experience levels (beginner, intermediate, advanced)
    
    Format as JSON array with fields: name, email, bio, experience`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonStr = text.slice(jsonStart, jsonEnd);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating test users:', error);
    return [];
  }
};