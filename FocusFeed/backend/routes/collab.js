const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const CollabWorkspace = require('../models/CollabWorkspace');
const Post = require('../models/Post');
const User = require('../models/User');

router.use(auth);

// Create workspace
router.post('/', async (req, res) => {
  try {
    const { title, description, category, guidelines } = req.body;
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters' });
    }

    const workspace = await CollabWorkspace.create({
      title: title.trim(),
      description: description?.trim(),
      category: category || 'Other',
      guidelines: guidelines?.trim(),
      creator: req.user._id,
      contributors: [{ user: req.user._id, status: 'accepted', consent: true, joinedAt: new Date() }],
    });

    const populated = await workspace.populate('creator', 'username displayName');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List workspaces (open ones + ones user belongs to)
router.get('/', async (req, res) => {
  try {
    const { status, mine } = req.query;
    const filter = {};

    if (mine === 'true') {
      filter.$or = [
        { creator: req.user._id },
        { 'contributors.user': req.user._id },
      ];
    } else {
      filter.$or = [
        { status: 'open' },
        { creator: req.user._id },
        { 'contributors.user': req.user._id },
      ];
    }

    if (status) filter.status = status;

    const workspaces = await CollabWorkspace.find(filter)
      .populate('creator', 'username displayName')
      .populate('contributors.user', 'username displayName')
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single workspace
router.get('/:id', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id)
      .populate('creator', 'username displayName')
      .populate('contributors.user', 'username displayName')
      .populate('submissions.contributor', 'username displayName')
      .populate('submissions.reviewedBy', 'username displayName')
      .populate('publishedPost');

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Invite contributor (by username)
router.post('/:id/invite', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can invite contributors' });
    }
    if (workspace.status !== 'open') {
      return res.status(400).json({ message: 'Workspace is not open for new contributors' });
    }

    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const invitee = await User.findOne({ username });
    if (!invitee) return res.status(404).json({ message: 'User not found' });

    const already = workspace.contributors.find(
      (c) => c.user.toString() === invitee._id.toString()
    );
    if (already) return res.status(400).json({ message: 'User already in workspace' });

    workspace.contributors.push({ user: invitee._id, status: 'invited' });
    await workspace.save();

    const populated = await workspace.populate('contributors.user', 'username displayName');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept invitation + give consent
router.put('/:id/accept', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const contributor = workspace.contributors.find(
      (c) => c.user.toString() === req.user._id.toString()
    );
    if (!contributor) return res.status(404).json({ message: 'You are not invited to this workspace' });
    if (contributor.status === 'accepted') return res.status(400).json({ message: 'Already accepted' });

    const { consent } = req.body;
    if (!consent) {
      return res.status(400).json({ message: 'You must give consent to contribute' });
    }

    contributor.status = 'accepted';
    contributor.consent = true;
    contributor.joinedAt = new Date();
    await workspace.save();

    const populated = await workspace.populate('contributors.user', 'username displayName');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Decline invitation
router.put('/:id/decline', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const contributor = workspace.contributors.find(
      (c) => c.user.toString() === req.user._id.toString()
    );
    if (!contributor) return res.status(404).json({ message: 'You are not invited to this workspace' });

    contributor.status = 'declined';
    await workspace.save();

    res.json({ message: 'Invitation declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit content to workspace
router.post('/:id/submit', upload.single('media'), async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.status !== 'open') {
      return res.status(400).json({ message: 'Workspace is not accepting submissions' });
    }

    const contributor = workspace.contributors.find(
      (c) => c.user.toString() === req.user._id.toString() && c.status === 'accepted'
    );
    if (!contributor) {
      return res.status(403).json({ message: 'You must accept the invitation first' });
    }

    const { content } = req.body;
    if (!content || content.trim().length < 1) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const submission = {
      contributor: req.user._id,
      content: content.trim(),
      mediaUrl: req.file ? req.file.path.replace(/\\/g, '/') : undefined,
    };

    workspace.submissions.push(submission);
    await workspace.save();

    const populated = await workspace.populate('submissions.contributor', 'username displayName');
    res.status(201).json(populated.submissions[populated.submissions.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Review submission (approve/reject) — creator only
router.put('/:id/submissions/:subId/review', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can review submissions' });
    }

    const submission = workspace.submissions.id(req.params.subId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const { action } = req.body;
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approved" or "rejected"' });
    }

    submission.status = action;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await workspace.save();

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Publish workspace — combine approved submissions into a post
router.post('/:id/publish', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id)
      .populate('creator', 'username displayName')
      .populate('submissions.contributor', 'username displayName');

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can publish' });
    }
    if (workspace.status === 'published') {
      return res.status(400).json({ message: 'Already published' });
    }

    const approved = workspace.submissions.filter((s) => s.status === 'approved');
    if (approved.length === 0) {
      return res.status(400).json({ message: 'No approved submissions to publish' });
    }

    const credits = [...new Set(approved.map((s) => s.contributor.displayName || s.contributor.username))];

    let combinedContent = `🤝 Collaborative: ${workspace.title}\n\n`;
    combinedContent += `${workspace.description || ''}\n\n`;
    combinedContent += '---\n\n';
    approved.forEach((s) => {
      const name = s.contributor.displayName || s.contributor.username;
      combinedContent += `📝 ${name}:\n${s.content}\n\n`;
    });
    combinedContent += `\n👥 Contributors: ${credits.join(', ')}`;

    const images = approved
      .filter((s) => s.mediaUrl)
      .map((s) => s.mediaUrl)
      .slice(0, 4);

    const post = await Post.create({
      author: req.user._id,
      content: combinedContent,
      images,
      category: workspace.category,
      focusType: 'collaborative',
      visibility: 'public',
      moderationStatus: 'approved',
      workspace: workspace._id,
    });

    workspace.status = 'published';
    workspace.publishedPost = post._id;
    await workspace.save();

    const populatedPost = await post.populate('author', 'username displayName');
    res.status(201).json({ workspace, post: populatedPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Close workspace (stop accepting submissions)
router.put('/:id/close', async (req, res) => {
  try {
    const workspace = await CollabWorkspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can close the workspace' });
    }

    workspace.status = 'closed';
    await workspace.save();
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
