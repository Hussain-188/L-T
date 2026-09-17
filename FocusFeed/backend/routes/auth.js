const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const formatUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  ageTier: user.ageTier,
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, dateOfBirth, displayName } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!dateOfBirth) {
      return res.status(400).json({ message: 'Date of birth is required' });
    }

    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 13) {
      return res.status(403).json({ message: 'Users under 13 years of age are not allowed to register' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ message: `${field} already exists` });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      dateOfBirth: dob,
      displayName: (displayName || username).trim(),
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, bio, avatar, interests, privacySettings } = req.body;
    const updates = {};

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (interests !== undefined) updates.interests = interests;
    if (privacySettings !== undefined) updates.privacySettings = privacySettings;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = req.user.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isFollowing) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      res.json({ following: false });
    } else {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
      res.json({ following: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
