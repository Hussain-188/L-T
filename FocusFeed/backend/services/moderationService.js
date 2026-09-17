const ModerationLog = require('../models/ModerationLog');
const Post = require('../models/Post');
const User = require('../models/User');

const BLOCKED_PATTERNS = [
  /\b(buy now|click here|free money|act now|limited offer)\b/i,
  /\b(nigger|faggot|retard)\b/i,
  /https?:\/\/bit\.ly|tinyurl/i,
];

const FLAGGED_PATTERNS = [
  /\b(kill|murder|attack|bomb|shoot)\b/i,
  /\b(scam|fake|hoax)\b/i,
  /\b(drugs|pills|steroids)\b/i,
];

function checkContent(text) {
  if (!text) return { safe: true, blocked: false, flags: [] };

  const flags = [];
  let blocked = false;

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      blocked = true;
      flags.push({ type: 'blocked', pattern: pattern.source, severity: 'high' });
    }
  }

  for (const pattern of FLAGGED_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ type: 'flagged', pattern: pattern.source, severity: 'medium' });
    }
  }

  return {
    safe: flags.length === 0,
    blocked,
    flags,
  };
}

function detectAIContent(text) {
  if (!text || text.length < 50) return { isAI: false, confidence: 0, signals: [] };

  const signals = [];
  let score = 0;

  const sentences = text.split(/[.!?]+/).filter(Boolean);
  if (sentences.length > 2) {
    const lengths = sentences.map((s) => s.trim().length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, l) => a + Math.pow(l - avg, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / (avg || 1);
    if (cv < 0.3) {
      score += 20;
      signals.push('uniform-sentence-length');
    }
  }

  const formalPhrases = [
    /\bfurthermore\b/i, /\bmoreover\b/i, /\bin conclusion\b/i,
    /\bit is worth noting\b/i, /\bit is important to\b/i,
    /\bin the context of\b/i, /\bthis suggests that\b/i,
    /\boverall\b/i, /\bhowever\b/i, /\bnevertheless\b/i,
    /\bdelve\b/i, /\blandscape\b/i, /\btapestry\b/i,
  ];
  let formalCount = 0;
  for (const phrase of formalPhrases) {
    if (phrase.test(text)) formalCount++;
  }
  if (formalCount >= 3) {
    score += 25;
    signals.push('high-formality');
  } else if (formalCount >= 1) {
    score += 10;
    signals.push('moderate-formality');
  }

  const words = text.split(/\s+/);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / words.length;
  if (lexicalDiversity > 0.75 && words.length > 30) {
    score += 15;
    signals.push('high-lexical-diversity');
  }

  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length >= 3) {
    const allHaveSimilarLength = paragraphs.every(
      (p) => Math.abs(p.length - paragraphs[0].length) < paragraphs[0].length * 0.4
    );
    if (allHaveSimilarLength) {
      score += 15;
      signals.push('structured-paragraphs');
    }
  }

  if (/\b(firstly|secondly|thirdly|in summary|to summarize|in essence)\b/i.test(text)) {
    score += 10;
    signals.push('listing-markers');
  }

  const contractions = (text.match(/\b(don't|won't|can't|I'm|you're|they're|it's|we're|isn't|aren't)\b/gi) || []).length;
  if (contractions === 0 && words.length > 50) {
    score += 15;
    signals.push('no-contractions');
  }

  const confidence = Math.min(score, 100);
  return {
    isAI: confidence >= 40,
    confidence,
    signals,
  };
}

async function detectBot(userId) {
  const user = await User.findById(userId);
  if (!user) return { isBot: false, score: 0, signals: [] };

  const signals = [];
  let score = 0;

  const accountAgeHours = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60);
  if (accountAgeHours < 1) {
    score += 15;
    signals.push('very-new-account');
  }

  const recentPosts = await Post.countDocuments({
    author: userId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recentPosts > 10) {
    score += 30;
    signals.push(`high-post-frequency: ${recentPosts}/hour`);
  } else if (recentPosts > 5) {
    score += 15;
    signals.push(`elevated-post-frequency: ${recentPosts}/hour`);
  }

  const posts = await Post.find({ author: userId }).select('category content').limit(50);
  if (posts.length >= 5) {
    const categories = new Set(posts.map((p) => p.category));
    if (categories.size === 1) {
      score += 20;
      signals.push('single-category-only');
    }

    const contents = posts.map((p) => p.content);
    let duplicateCount = 0;
    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        if (contents[i] === contents[j]) duplicateCount++;
      }
    }
    if (duplicateCount > 0) {
      score += 25;
      signals.push(`duplicate-content: ${duplicateCount} pairs`);
    }
  }

  const followerRatio = (user.followers?.length || 0) / Math.max(user.following?.length || 1, 1);
  if (user.following?.length > 50 && followerRatio < 0.1) {
    score += 20;
    signals.push('low-follower-ratio');
  }

  return {
    isBot: score >= 40,
    score: Math.min(score, 100),
    signals,
    userId: user._id,
    username: user.username,
  };
}

async function logModeration(action, targetType, targetId, moderatorId, reason, metadata) {
  return ModerationLog.create({
    action,
    targetType,
    targetId,
    moderator: moderatorId,
    reason,
    metadata,
  });
}

module.exports = { checkContent, detectAIContent, detectBot, logModeration };
