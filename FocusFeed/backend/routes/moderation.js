const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');
const { checkContent, detectAIContent, detectBot, logModeration } = require('../services/moderationService');

router.use(auth);

// Submit a report
router.post('/reports', async (req, res) => {
  try {
    const { postId, reason, description } = req.body;
    if (!postId || !reason) {
      return res.status(400).json({ message: 'Post ID and reason are required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await Report.findOne({
      reporter: req.user._id,
      post: postId,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already reported this post' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      post: postId,
      reason,
      description: description?.trim(),
    });

    post.reportCount = (post.reportCount || 0) + 1;
    if (post.reportCount >= 3 && post.moderationStatus === 'approved') {
      post.moderationStatus = 'flagged';
      await logModeration('post-flagged', 'post', post._id, null, 'Auto-flagged: 3+ reports');
    }
    await post.save();

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get moderation queue (moderator/admin only)
router.get('/queue', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find({ status })
      .populate('reporter', 'username displayName')
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username displayName' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ status });

    res.json({
      reports,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resolve a report (moderator/admin)
router.put('/reports/:id', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const { action, reviewNote } = req.body;
    if (!['dismissed', 'warned', 'post-removed', 'user-banned'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const report = await Report.findById(req.params.id).populate('post');
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = action === 'dismissed' ? 'dismissed' : 'reviewed';
    report.action = action === 'dismissed' ? 'none' : action;
    report.reviewedBy = req.user._id;
    report.reviewNote = reviewNote;
    report.reviewedAt = new Date();
    await report.save();

    if (action === 'post-removed' && report.post) {
      report.post.moderationStatus = 'rejected';
      await report.post.save();
      await logModeration('post-removed', 'post', report.post._id, req.user._id, reviewNote);
    }

    if (action === 'user-banned' && report.post?.author) {
      const targetUser = await User.findById(report.post.author);
      if (targetUser) {
        targetUser.isBanned = true;
        await targetUser.save();
        await logModeration('user-banned', 'user', targetUser._id, req.user._id, reviewNote);
      }
    }

    if (action === 'warned') {
      await logModeration('user-warned', 'user', report.post?.author, req.user._id, reviewNote);
    }

    await logModeration('report-reviewed', 'report', report._id, req.user._id, `Action: ${action}`);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Appeal a report decision
router.post('/appeal/:reportId', async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId).populate('post');
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.post?.author?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the post author can appeal' });
    }
    if (report.status !== 'reviewed') {
      return res.status(400).json({ message: 'Can only appeal reviewed reports' });
    }
    if (report.appeal?.status) {
      return res.status(400).json({ message: 'Appeal already submitted' });
    }

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Appeal text is required' });

    report.status = 'appealed';
    report.appeal = { text: text.trim(), status: 'pending' };
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get audit log (moderator/admin)
router.get('/logs', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ModerationLog = require('../models/ModerationLog');
    const logs = await ModerationLog.find()
      .populate('moderator', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ModerationLog.countDocuments();

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analyze text for AI content (any authenticated user)
router.post('/detect-ai', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const result = detectAIContent(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check text for harmful content
router.post('/check-content', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const result = checkContent(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bot detection flags (admin only)
router.get('/bot-flags', requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('_id username displayName createdAt').limit(100);
    const results = [];

    for (const u of users) {
      const analysis = await detectBot(u._id);
      if (analysis.score > 20) {
        results.push(analysis);
      }
    }

    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Moderation stats (moderator/admin)
router.get('/stats', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const ModerationLog = require('../models/ModerationLog');
    const [pendingReports, totalReports, totalActions, flaggedPosts, totalUsers, totalPosts] = await Promise.all([
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      ModerationLog.countDocuments(),
      Post.countDocuments({ moderationStatus: 'flagged' }),
      User.countDocuments(),
      Post.countDocuments(),
    ]);

    res.json({
      pendingReports,
      totalReports,
      totalActions,
      flaggedPosts,
      totalUsers,
      totalPosts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
