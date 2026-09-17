const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    images: [String],
    category: {
      type: String,
      required: true,
      enum: [
        'Science',
        'Technology',
        'Sports',
        'Art',
        'Music',
        'Entertainment',
        'Personal Stories',
        'Social Causes',
        'Education',
        'Gaming',
        'Food',
        'Travel',
        'Other',
      ],
    },
    focusType: {
      type: String,
      enum: ['educational', 'story', 'discussion', 'creative', 'meme', 'news', 'collaborative'],
      default: 'discussion',
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    aiConfidenceScore: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected', 'flagged'],
      default: 'approved',
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    isMature: {
      type: Boolean,
      default: false,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollabWorkspace',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
