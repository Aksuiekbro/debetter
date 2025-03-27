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
    console.log('RAW REQUEST BODY:', req.body);
    console.log('RAW ROLE VALUE FROM CLIENT:', req.body.role);
    
    // Capture exactly what's in the request
    const rawRole = req.body.role;
    console.log('Raw role captured:', rawRole);
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Force the role to be exactly what was received
    const userRole = rawRole;
    console.log('Using direct role value:', userRole);
    
    // Create user with exactly the role that was received
    const user = await User.create({
      username,
      email,
      password,
      role: userRole // Use the exact role from the request
    });

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
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // Include the role in the response
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
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

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role, // Include the role in the response
      bio: user.bio || '',
      interests: user.interests || [],
      metrics: user.metrics || {
        debates: 0,
        wins: 0,
        ongoing: 0,
        judged: 0
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, interests } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (bio !== undefined) {
      user.bio = bio;
    }
    if (interests !== undefined) {
      user.interests = interests;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      metrics: updatedUser.metrics
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