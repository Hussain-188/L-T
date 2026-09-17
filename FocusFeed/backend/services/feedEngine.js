const Post = require('../models/Post');

const CATEGORIES = [
  'Science', 'Technology', 'Sports', 'Art', 'Music',
  'Entertainment', 'Personal Stories', 'Social Causes',
  'Education', 'Gaming', 'Food', 'Travel', 'Other',
];

function recencyScore(createdAt) {
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) return 5;
  if (hoursAgo < 6) return 4;
  if (hoursAgo < 24) return 3;
  if (hoursAgo < 72) return 2;
  if (hoursAgo < 168) return 1;
  return 0;
}

function focusModeBoost(post, mode) {
  if (!mode) return 0;

  if (mode === 'learning') {
    if (['educational', 'news'].includes(post.focusType)) return 5;
    if (post.focusType === 'discussion') return 2;
    if (post.focusType === 'meme') return -3;
    if (post.focusType === 'creative') return 0;
    return 0;
  }

  if (mode === 'discovery') {
    return 0;
  }

  if (mode === 'creation') {
    if (post.workspace) return 10;
    if (post.focusType === 'creative') return 3;
    return -2;
  }

  return 0;
}

function scorePost(post, interestMap, focusMode) {
  let score = 0;
  const breakdown = {};

  const weight = interestMap.get(post.category) ?? 0;
  const categoryScore = (weight / 100) * 10;
  score += categoryScore;
  breakdown.interest = { category: post.category, weight, score: +categoryScore.toFixed(2) };

  const fmBoost = focusModeBoost(post, focusMode);
  score += fmBoost;
  breakdown.focusMode = { mode: focusMode || 'none', boost: fmBoost };

  if (focusMode === 'discovery' && weight === 0) {
    score += 3;
    breakdown.discovery = { boost: 3, reason: 'Outside your interests' };
  }

  const recency = recencyScore(post.createdAt);
  score += recency;
  breakdown.recency = { hoursAgo: +((Date.now() - new Date(post.createdAt).getTime()) / 3600000).toFixed(1), score: recency };

  const engagementBoost = Math.min((post.likes?.length || 0) * 0.1, 2);
  score += engagementBoost;
  breakdown.engagement = { likes: post.likes?.length || 0, boost: +engagementBoost.toFixed(2) };

  breakdown.total = +score.toFixed(2);
  return { score, breakdown };
}

async function getPersonalizedFeed({ userId, interests, focusMode, page = 1, limit = 20, category, ageTier }) {
  const filter = {
    visibility: 'public',
    moderationStatus: 'approved',
  };

  if (ageTier === 'teen') {
    filter.isMature = { $ne: true };
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  const posts = await Post.find(filter)
    .populate('author', 'username displayName avatar')
    .populate('comments.user', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const interestMap = new Map();
  if (interests && interests.length > 0) {
    interests.forEach((i) => interestMap.set(i.category, i.weight));
  }

  const scored = posts.map((post) => {
    const { score, breakdown } = scorePost(post, interestMap, focusMode);
    return { ...post, _score: score, _breakdown: breakdown };
  });

  scored.sort((a, b) => b._score - a._score);

  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  return {
    posts: paginated,
    totalPages: Math.ceil(scored.length / limit),
    currentPage: page,
    totalPosts: scored.length,
  };
}

async function explainPost(postId, interests, focusMode) {
  const post = await Post.findById(postId)
    .populate('author', 'username displayName avatar')
    .lean();

  if (!post) return null;

  const interestMap = new Map();
  if (interests && interests.length > 0) {
    interests.forEach((i) => interestMap.set(i.category, i.weight));
  }

  const { score, breakdown } = scorePost(post, interestMap, focusMode);
  return { post, score, breakdown };
}

module.exports = { getPersonalizedFeed, explainPost };
