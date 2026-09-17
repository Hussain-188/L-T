const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['invited', 'accepted', 'declined'], default: 'invited' },
  consent: { type: Boolean, default: false },
  joinedAt: Date,
});

const submissionSchema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mediaUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const collabWorkspaceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['Science', 'Technology', 'Sports', 'Art', 'Music', 'Entertainment',
        'Personal Stories', 'Social Causes', 'Education', 'Gaming', 'Food', 'Travel', 'Other'],
      default: 'Other',
    },
    guidelines: { type: String, maxlength: 2000 },
    contributors: [contributorSchema],
    submissions: [submissionSchema],
    publishedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    status: { type: String, enum: ['open', 'closed', 'published'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CollabWorkspace', collabWorkspaceSchema);
