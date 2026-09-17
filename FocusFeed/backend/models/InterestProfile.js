const mongoose = require('mongoose');

const interestEntrySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'Science', 'Technology', 'Sports', 'Art', 'Music',
      'Entertainment', 'Personal Stories', 'Social Causes',
      'Education', 'Gaming', 'Food', 'Travel',
    ],
  },
  weight: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
}, { _id: false });

const presetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  interests: [interestEntrySchema],
});

const interestProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    interests: [interestEntrySchema],
    presets: [presetSchema],
    activeFocusMode: {
      type: String,
      enum: ['learning', 'discovery', 'creation'],
      default: 'learning',
    },
    activePresetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterestProfile', interestProfileSchema);
