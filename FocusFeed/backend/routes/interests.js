const express = require('express');
const InterestProfile = require('../models/InterestProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = [
  'Science', 'Technology', 'Sports', 'Art', 'Music',
  'Entertainment', 'Personal Stories', 'Social Causes',
  'Education', 'Gaming', 'Food', 'Travel',
];

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get('/my', auth, async (req, res) => {
  try {
    let profile = await InterestProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await InterestProfile.create({
        user: req.user._id,
        interests: [],
        presets: [],
        activeFocusMode: 'learning',
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/my', auth, async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }

    for (const i of interests) {
      if (!CATEGORIES.includes(i.category)) {
        return res.status(400).json({ message: `Invalid category: ${i.category}` });
      }
      if (typeof i.weight !== 'number' || i.weight < 0 || i.weight > 100) {
        return res.status(400).json({ message: 'Weight must be a number between 0 and 100' });
      }
    }

    const profile = await InterestProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { interests } },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/focus-mode', auth, async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['learning', 'discovery', 'creation'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid focus mode' });
    }

    const profile = await InterestProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { activeFocusMode: mode } },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/presets', auth, async (req, res) => {
  try {
    const { name, interests } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Preset name is required' });
    }

    const profile = await InterestProfile.findOneAndUpdate(
      { user: req.user._id },
      { $push: { presets: { name: name.trim(), interests: interests || [] } } },
      { new: true, upsert: true }
    );

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/presets/:presetId/activate', auth, async (req, res) => {
  try {
    const profile = await InterestProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const preset = profile.presets.id(req.params.presetId);
    if (!preset) {
      return res.status(404).json({ message: 'Preset not found' });
    }

    profile.interests = preset.interests;
    profile.activePresetId = preset._id;
    await profile.save();

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/presets/:presetId', auth, async (req, res) => {
  try {
    const profile = await InterestProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { presets: { _id: req.params.presetId } } },
      { new: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
