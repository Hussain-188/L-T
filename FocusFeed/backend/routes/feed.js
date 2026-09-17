const express = require('express');
const { auth } = require('../middleware/auth');
const InterestProfile = require('../models/InterestProfile');
const { getPersonalizedFeed, explainPost } = require('../services/feedEngine');
const { getAgeTier } = require('../middleware/childSafety');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;

    let profile = await InterestProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = { interests: [], activeFocusMode: 'learning' };
    }

    const result = await getPersonalizedFeed({
      userId: req.user._id,
      interests: profile.interests,
      focusMode: profile.activeFocusMode,
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      ageTier: getAgeTier(req.user.dateOfBirth),
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/explain/:postId', auth, async (req, res) => {
  try {
    let profile = await InterestProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = { interests: [], activeFocusMode: 'learning' };
    }

    const result = await explainPost(
      req.params.postId,
      profile.interests,
      profile.activeFocusMode
    );

    if (!result) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
