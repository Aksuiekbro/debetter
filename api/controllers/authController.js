const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    // Direct access to raw request data
    // console.log('RAW REQUEST BODY:', req.body); // Removed debug log
    // console.log('RAW ROLE VALUE FROM CLIENT:', req.body.role); // Removed debug log
    
    // Capture exactly what's in the request
    const rawRole = req.body.role;
    // console.log('Raw role captured:', rawRole); // Removed debug log
    
    const { username, email, password, judgeRole, experience, club, phoneNumber, otherProfileInfo } = req.body; // Destructure new fields
    
    if (!username || !email || !password) {
      // console.log('Missing required fields'); // Removed debug log
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      // console.log('User already exists with email:', email); // Removed debug log
      return res.status(400).json({ message: 'User already exists' });
    }

    // Force the role to be exactly what was received
    const userRole = rawRole;
    // console.log('Using direct role value:', userRole); // Removed debug log
    
    // Create user with exactly the role that was received
    // Prepare data for user creation
    // Prepare data for user creation, including new fields
    const userData = {
      username,
      email,
      password,
      role: userRole, // Use the exact role from the request
      experience,     // Add new fields
      club,
      phoneNumber,
      otherProfileInfo
    };

    // Conditionally add judgeRole if the role is 'judge'
    if (userRole === 'judge') {
      userData.judgeRole = judgeRole;
    }

    const user = await User.create(userData);

    console.log('FINAL USER OBJECT:', {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Return the user object with the role
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration error:', error); // Log the detailed error regardless of environment
    
    // Determine the message to send back based on the environment
    const message = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred during registration.'
      : error.message;
      
    const responsePayload = { message };
    // Only include stack trace in development environment
    if (process.env.NODE_ENV === 'development') {
      responsePayload.stack = error.stack;
    }
    
    res.status(500).json(responsePayload);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // console.log('[Login Controller] Password matched successfully for:', user.email); // Removed debug log
      // console.log('[Login Controller] Attempting to generate token...'); // Removed debug log
      const token = generateToken(user._id); // Generate token explicitly
      // console.log('[Login Controller] Token generated successfully.'); // Removed debug log
      // console.log('[Login Controller] Attempting to send success response...'); // Removed debug log
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // Include the role in the response
        token: token // Use the generated token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[Login Controller] Error during login:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return all relevant user details, including new judge-specific fields
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      judgeRole: user.judgeRole || '', // Include judgeRole
      bio: user.bio || '',
      interests: user.interests || [],
      metrics: user.metrics || {
        debates: 0,
        wins: 0,
        ongoing: 0,
        judged: 0
      },
      // Add new fields with defaults
      experience: user.experience || '',
      club: user.club || '',
      phoneNumber: user.phoneNumber || '',
      otherProfileInfo: user.otherProfileInfo || '',
      profilePhotoUrl: user.profilePhotoUrl || '',
      awards: user.awards || [],
      judgingStyle: user.judgingStyle || '' // Add judgingStyle
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // Destructure all potential fields from the request body
    const { username, email, phoneNumber, bio, interests, judgingStyle } = req.body; // Destructure judgingStyle
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided in the request
    if (username !== undefined) {
      // TODO: Add validation if username needs to be unique
      user.username = username;
    }
    if (email !== undefined) {
      // TODO: Add validation if email needs to be unique and format is correct
      // const existingUser = await User.findOne({ email: email });
      // if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      //   return res.status(400).json({ message: 'Email already in use' });
      // }
      user.email = email;
    }
    if (phoneNumber !== undefined) {
      // TODO: Add validation for phone number format if needed
      user.phoneNumber = phoneNumber;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (interests !== undefined) {
      user.interests = interests;
    }
    if (judgingStyle !== undefined) { // Add judgingStyle update logic
      user.judgingStyle = judgingStyle;
    }

    const updatedUser = await user.save();
    // Respond with the updated user profile, including the new fields
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber, // Add phoneNumber to response
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      metrics: updatedUser.metrics, // Keep existing fields
      judgingStyle: updatedUser.judgingStyle // Add judgingStyle to response
      // Consider adding other relevant fields like role, club etc. if needed
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requesterId = req.user._id;

    // Check if users exist
    const [targetUser, requester] = await Promise.all([
      User.findById(targetUserId),
      User.findById(requesterId)
    ]);

    if (!targetUser || !requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if friend request already exists
    if (targetUser.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push(requesterId);
    await targetUser.save();

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk register test users
exports.registerTestUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    // Validate request
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: 'Users must be provided as an array' });
    }

    // Register each user
    const registeredUsers = await Promise.all(users.map(async (userData) => {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          return null;
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || 'user',
          judgeRole: userData.judgeRole
        });

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          judgeRole: user.judgeRole,
          createdAt: user.createdAt
        };
      } catch (error) {
        console.error('Error registering test user:', error);
        return null;
      }
    }));

    // Filter out failed registrations
    const successfulUsers = registeredUsers.filter(user => user !== null);

    res.status(201).json({
      message: `Successfully registered ${successfulUsers.length} test users`,
      users: successfulUsers
    });
  } catch (error) {
    console.error('Error in bulk test user registration:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile photo
// @route   POST /api/users/profile/photo
// @access  Private
exports.updateProfilePhoto = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // --- Placeholder Cloud Upload Logic ---
    // In a real implementation, you would upload req.file.buffer to cloud storage
    // and get the public URL back.
    // Example: const photoUrl = await cloudStorageService.uploadProfilePhoto(req.file.buffer, req.user._id);
    const placeholderUrl = `/uploads/profile-photos/placeholder-${req.user._id}-${Date.now()}.jpg`; // Dummy URL
    const photoUrl = placeholderUrl;
    // --- End Placeholder ---

    // Find the user
    const user = await User.findById(req.user._id);

    if (!user) {
      // This case should ideally not happen if protect middleware is working
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's profile photo URL
    user.profilePhotoUrl = photoUrl;
    const updatedUser = await user.save();

    // Respond with success and the new URL
    res.status(200).json({
      message: 'Profile photo updated successfully.',
      profilePhotoUrl: updatedUser.profilePhotoUrl,
      // Optionally return other user details if needed
      // _id: updatedUser._id,
      // username: updatedUser.username,
    });

  } catch (error) {
    console.error('Profile photo update error:', error);
    // Check if the error is from multer (e.g., file size limit)
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: `File upload error: ${error.message}` });
    }
    // Check for custom file filter errors
    if (error.message.startsWith('Invalid file type')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating profile photo.' });
  }
};