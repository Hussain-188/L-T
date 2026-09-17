const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { checkContent, detectAIContent, logModeration } = require('../services/moderationService');
const { getAgeTier } = require('../middleware/childSafety');

const router = express.Router();

router.post('/', auth, upload.array('images', 4), async (req, res) => {
  try {
    if (req.user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const { content, category, focusType, visibility, isMature } = req.body;
    const images = req.files ? req.files.map((file) => file.path.replace(/\\/g, '/')) : [];

    const ageTier = getAgeTier(req.user.dateOfBirth);
    if (ageTier === 'teen' && isMature === 'true') {
      return res.status(403).json({ message: 'Users under 18 cannot post mature content' });
    }

    const contentCheck = checkContent(content);
    if (contentCheck.blocked) {
      return res.status(400).json({
        message: 'Your post contains content that violates community guidelines',
        flags: contentCheck.flags,
      });
    }

    const aiCheck = detectAIContent(content);

    let moderationStatus = 'approved';
    if (contentCheck.flags.length > 0) {
      moderationStatus = 'flagged';
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      category,
      focusType,
      visibility,
      images,
      isMature: isMature === 'true',
      isAIGenerated: aiCheck.isAI,
      aiConfidenceScore: aiCheck.confidence,
      moderationStatus,
    });

    if (contentCheck.flags.length > 0) {
      await logModeration('post-flagged', 'post', post._id, null, 'Auto-flagged by content filter', { flags: contentCheck.flags });
    }
    if (aiCheck.isAI) {
      await logModeration('ai-flagged', 'post', post._id, null, 'AI content detected', { confidence: aiCheck.confidence, signals: aiCheck.signals });
    }

    await post.populate('author', 'username displayName avatar');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      visibility: 'public',
      moderationStatus: 'approved',
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username displayName avatar'
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const { content, category, focusType, visibility } = req.body;

    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (focusType !== undefined) post.focusType = focusType;
    if (visibility !== undefined) post.visibility = visibility;

    await post.save();
    await post.populate('author', 'username displayName avatar');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    post.comments.push({ user: req.user._id, text });
    await post.save();

    await post.populate('comments.user', 'username displayName avatar');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
