const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const ModerationLog = require('../models/ModerationLog');
const CollabWorkspace = require('../models/CollabWorkspace');
const { detectBot, logModeration } = require('../services/moderationService');

router.use(auth);
router.use(requireRole('admin'));

// Platform stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalPosts, totalReports, pendingReports,
      flaggedPosts, bannedUsers, totalWorkspaces,
      postsToday, usersToday, postsThisWeek,
      teenUsers, adultUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Post.countDocuments({ moderationStatus: 'flagged' }),
      User.countDocuments({ isBanned: true }),
      CollabWorkspace.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      Post.countDocuments({ createdAt: { $gte: thisWeek } }),
      User.countDocuments({
        dateOfBirth: {
          $gt: new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()),
          $lte: new Date(now.getFullYear() - 13, now.getMonth(), now.getDate()),
        },
      }),
      User.countDocuments({
        dateOfBirth: { $lte: new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()) },
      }),
    ]);

    const moderationActions = await ModerationLog.countDocuments();

    const categoryBreakdown = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalReports,
      pendingReports,
      flaggedPosts,
      bannedUsers,
      totalWorkspaces,
      moderationActions,
      postsToday,
      usersToday,
      postsThisWeek,
      teenUsers,
      adultUsers,
      categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List users with search/filter
router.get('/users', async (req, res) => {
  try {
    const { search, role, banned, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (banned === 'true') filter.isBanned = true;
    if (banned === 'false') filter.isBanned = { $ne: true };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    target.role = role;
    await target.save();

    await logModeration(
      role === 'admin' ? 'user-warned' : 'report-reviewed',
      'user', target._id, req.user._id, `Role changed to ${role}`
    );

    res.json({ message: `Role updated to ${role}`, user: { id: target._id, username: target.username, role: target.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ban/unban user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot ban yourself' });
    }
    if (target.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban another admin' });
    }

    const wasBanned = target.isBanned;
    target.isBanned = !wasBanned;
    await target.save();

    await logModeration(
      wasBanned ? 'user-unbanned' : 'user-banned',
      'user', target._id, req.user._id,
      req.body.reason || (wasBanned ? 'Unbanned by admin' : 'Banned by admin')
    );

    res.json({
      message: wasBanned ? 'User unbanned' : 'User banned',
      isBanned: target.isBanned,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bot detection flags
router.get('/bot-flags', async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isBanned: { $ne: true } })
      .select('_id username displayName createdAt')
      .limit(200);

    const results = [];
    for (const u of users) {
      const analysis = await detectBot(u._id);
      if (analysis.score > 15) {
        results.push(analysis);
      }
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user detail
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const postCount = await Post.countDocuments({ author: user._id });
    const reportCount = await Report.countDocuments({ 'post': { $in: await Post.find({ author: user._id }).distinct('_id') } });

    res.json({ user, postCount, reportCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
