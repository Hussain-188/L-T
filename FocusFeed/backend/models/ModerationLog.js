const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['post-approved', 'post-removed', 'post-flagged', 'user-warned', 'user-banned', 'user-unbanned', 'report-reviewed', 'report-dismissed', 'appeal-accepted', 'appeal-rejected', 'ai-flagged', 'bot-flagged'],
    required: true,
  },
  targetType: { type: String, enum: ['post', 'user', 'report'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

moderationLogSchema.index({ createdAt: -1 });
moderationLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
