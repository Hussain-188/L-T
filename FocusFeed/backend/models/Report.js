const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reason: {
      type: String,
      enum: ['harassment', 'misinformation', 'spam', 'ai-unlabeled', 'undisclosed-ad', 'hate-speech', 'violence', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'appealed'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: ['none', 'warned', 'post-removed', 'user-banned'],
    },
    reviewNote: String,
    reviewedAt: Date,
    appeal: {
      text: String,
      status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
  },
  { timestamps: true }
);

reportSchema.index({ post: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
