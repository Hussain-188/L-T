require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const InterestProfile = require('./models/InterestProfile');
const CollabWorkspace = require('./models/CollabWorkspace');
const Report = require('./models/Report');
const ModerationLog = require('./models/ModerationLog');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    InterestProfile.deleteMany({}),
    CollabWorkspace.deleteMany({}),
    Report.deleteMany({}),
    ModerationLog.deleteMany({}),
  ]);

  console.log('Creating users...');
  const rawPassword = 'password123';

  const usersData = [
    { username: 'admin', email: 'admin@focusfeed.com', displayName: 'Admin User', role: 'admin', dateOfBirth: new Date('1990-01-15'), bio: 'Platform administrator' },
    { username: 'moderator', email: 'mod@focusfeed.com', displayName: 'Sarah Mod', role: 'moderator', dateOfBirth: new Date('1992-05-20'), bio: 'Content moderator keeping the platform safe' },
    { username: 'alice', email: 'alice@focusfeed.com', displayName: 'Alice Chen', role: 'user', dateOfBirth: new Date('1998-03-10'), bio: 'AI researcher and tech enthusiast. Love sharing science discoveries!' },
    { username: 'bob', email: 'bob@focusfeed.com', displayName: 'Bob Martinez', role: 'user', dateOfBirth: new Date('1995-07-22'), bio: 'Sports writer and gaming streamer. Discovery mode is my jam.' },
    { username: 'charlie', email: 'charlie@focusfeed.com', displayName: 'Charlie Kim', role: 'user', dateOfBirth: new Date('2000-11-05'), bio: 'Digital artist and music producer. Creation mode forever.' },
    { username: 'diana', email: 'diana@focusfeed.com', displayName: 'Diana Patel', role: 'user', dateOfBirth: new Date('1993-08-18'), bio: 'Food blogger and travel photographer' },
    { username: 'evan', email: 'evan@focusfeed.com', displayName: 'Evan Lee', role: 'user', dateOfBirth: new Date('1997-02-28'), bio: 'Environmental activist and educator. Social causes matter.' },
    { username: 'fiona', email: 'fiona@focusfeed.com', displayName: 'Fiona Scott', role: 'user', dateOfBirth: new Date('2001-12-03'), bio: 'Gamer, streamer, and meme connoisseur' },
    { username: 'teen_user', email: 'teen@focusfeed.com', displayName: 'Jordan Rivera', role: 'user', dateOfBirth: new Date('2010-09-15'), bio: 'High school student into science and gaming' },
    { username: 'grace', email: 'grace@focusfeed.com', displayName: 'Grace Wu', role: 'user', dateOfBirth: new Date('1996-04-12'), bio: 'Medical student sharing health education content' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await User.create({ ...u, passwordHash: rawPassword });
    users.push(user);
  }
  console.log(`Created ${users.length} users (all password: password123)`);

  const [admin, moderator, alice, bob, charlie, diana, evan, fiona, teen, grace] = users;

  // Set up follows
  const followPairs = [
    [alice, bob], [alice, charlie], [alice, evan],
    [bob, alice], [bob, fiona], [bob, charlie],
    [charlie, alice], [charlie, diana],
    [diana, alice], [diana, evan], [diana, grace],
    [evan, alice], [evan, diana], [evan, grace],
    [fiona, bob], [fiona, charlie],
    [teen, alice], [teen, fiona], [teen, bob],
    [grace, alice], [grace, evan], [grace, diana],
  ];
  for (const [a, b] of followPairs) {
    await User.findByIdAndUpdate(a._id, { $addToSet: { following: b._id } });
    await User.findByIdAndUpdate(b._id, { $addToSet: { followers: a._id } });
  }
  console.log('Set up follower relationships');

  // Create interest profiles
  console.log('Creating interest profiles...');
  const profiles = [
    { user: alice._id, interests: [{ category: 'Science', weight: 95 }, { category: 'Technology', weight: 90 }, { category: 'Education', weight: 70 }], activeFocusMode: 'learning' },
    { user: bob._id, interests: [{ category: 'Sports', weight: 90 }, { category: 'Gaming', weight: 85 }, { category: 'Entertainment', weight: 60 }], activeFocusMode: 'discovery' },
    { user: charlie._id, interests: [{ category: 'Art', weight: 95 }, { category: 'Music', weight: 90 }, { category: 'Entertainment', weight: 50 }], activeFocusMode: 'creation' },
    { user: diana._id, interests: [{ category: 'Food', weight: 95 }, { category: 'Travel', weight: 90 }, { category: 'Art', weight: 40 }], activeFocusMode: 'learning' },
    { user: evan._id, interests: [{ category: 'Social Causes', weight: 95 }, { category: 'Education', weight: 80 }, { category: 'Science', weight: 60 }], activeFocusMode: 'learning' },
    { user: fiona._id, interests: [{ category: 'Gaming', weight: 95 }, { category: 'Entertainment', weight: 85 }, { category: 'Technology', weight: 50 }], activeFocusMode: 'discovery' },
    { user: teen._id, interests: [{ category: 'Gaming', weight: 80 }, { category: 'Science', weight: 70 }, { category: 'Education', weight: 60 }], activeFocusMode: 'learning' },
    { user: grace._id, interests: [{ category: 'Science', weight: 90 }, { category: 'Education', weight: 85 }, { category: 'Social Causes', weight: 70 }], activeFocusMode: 'learning' },
  ];
  for (const p of profiles) await InterestProfile.create(p);

  // Create posts
  console.log('Creating posts...');
  const postsData = [
    // Science
    { author: alice._id, content: 'New breakthrough in quantum computing! Researchers have achieved a 1000-qubit processor that can solve problems previously thought impossible. This could revolutionize drug discovery and materials science.', category: 'Science', focusType: 'educational' },
    { author: alice._id, content: 'The James Webb Space Telescope just captured images of an exoplanet atmosphere containing water vapor and carbon dioxide. We are one step closer to finding habitable worlds!', category: 'Science', focusType: 'news' },
    { author: grace._id, content: 'Understanding CRISPR gene editing: A thread for beginners.\n\n1. CRISPR is like molecular scissors that can cut DNA at specific locations\n2. It uses a guide RNA to find the exact spot\n3. Once cut, the cell repairs itself, allowing us to add, remove, or alter genes\n\nThis technology could cure genetic diseases!', category: 'Science', focusType: 'educational' },
    { author: grace._id, content: 'A new study shows that regular exercise can literally grow new brain cells through a process called neurogenesis. Just 30 minutes of moderate exercise 3x per week showed significant improvements in memory and cognitive function.', category: 'Science', focusType: 'educational' },

    // Technology
    { author: alice._id, content: 'Built my first AI agent this weekend using Claude API! It can research topics, write code, and even debug itself. The future of software development is going to be wild. Here\'s what I learned...', category: 'Technology', focusType: 'story' },
    { author: fiona._id, content: 'The new AR glasses are finally practical for daily use. Battery lasts 8 hours, display is crystal clear in sunlight, and they look like normal glasses. Tried them for a week — here\'s my honest review.', category: 'Technology', focusType: 'discussion' },

    // Sports
    { author: bob._id, content: 'What a match last night! The underdog team pulled off an incredible comeback from 3-0 down to win 4-3 in extra time. Sports moments like these remind us why we love the game.', category: 'Sports', focusType: 'story' },
    { author: bob._id, content: 'Breaking down the science of a perfect free kick: spin rate, launch angle, and the Magnus effect. Physics makes sports even more fascinating when you understand what\'s happening.', category: 'Sports', focusType: 'educational' },

    // Art
    { author: charlie._id, content: 'Just finished a digital painting series exploring the intersection of nature and technology. Each piece took 20+ hours. Art is a labor of love, and I\'m so proud of how these turned out.', category: 'Art', focusType: 'creative' },
    { author: charlie._id, content: 'Hot take: AI-generated art and human-made art serve different purposes. AI art is great for ideation and exploration. Human art carries intention, emotion, and lived experience. Both have value.', category: 'Art', focusType: 'discussion' },

    // Music
    { author: charlie._id, content: 'Released my first EP today! Three months of producing, mixing, and mastering. Made entirely with open-source tools. Music production has never been more accessible.', category: 'Music', focusType: 'creative' },

    // Entertainment
    { author: fiona._id, content: 'Top 5 indie games that deserve more attention:\n1. Hollow Knight: Silksong\n2. Hades II\n3. Outer Wilds\n4. Celeste\n5. Disco Elysium\n\nAll of these are masterpieces that big studios should learn from.', category: 'Entertainment', focusType: 'discussion' },
    { author: bob._id, content: 'The new season of that sci-fi show everyone\'s talking about... no spoilers, but episode 7 had me in tears. Television storytelling has reached new heights.', category: 'Entertainment', focusType: 'story' },

    // Personal Stories
    { author: evan._id, content: 'Today I volunteered at a local food bank for the first time. Served 200+ meals and heard incredible stories of resilience. Small acts of kindness ripple outward in ways we can\'t imagine.', category: 'Personal Stories', focusType: 'story' },
    { author: diana._id, content: 'Overcoming my fear of public speaking: I gave my first conference talk today to 500 people. My hands were shaking, my voice cracked twice, but I did it. Growth happens outside your comfort zone.', category: 'Personal Stories', focusType: 'story' },

    // Social Causes
    { author: evan._id, content: 'Ocean cleanup update: Our local initiative removed 2 tons of plastic from coastal waters this month. We need systemic change, but community action proves we can make a difference when we work together.', category: 'Social Causes', focusType: 'news' },
    { author: evan._id, content: 'Digital literacy should be taught in every school. Understanding how algorithms work, how data is collected, and how to verify information online is as essential as reading and math in 2026.', category: 'Social Causes', focusType: 'educational' },
    { author: grace._id, content: 'Mental health awareness: It\'s okay to not be okay. As a medical student, I\'ve seen how stigma prevents people from seeking help. Let\'s normalize therapy and mental wellness check-ins.', category: 'Social Causes', focusType: 'educational' },

    // Education
    { author: grace._id, content: 'Free resources for learning data science in 2026:\n- Khan Academy (statistics foundations)\n- fast.ai (practical deep learning)\n- Kaggle (competitions + datasets)\n- Papers With Code (stay current)\n\nYou don\'t need an expensive bootcamp!', category: 'Education', focusType: 'educational' },
    { author: alice._id, content: 'The Feynman Technique: The best way to learn anything.\n1. Choose a concept\n2. Teach it to a 12-year-old\n3. Identify gaps in your explanation\n4. Go back and learn those gaps\n5. Simplify and use analogies\n\nIf you can\'t explain it simply, you don\'t understand it well enough.', category: 'Education', focusType: 'educational' },

    // Gaming
    { author: fiona._id, content: 'Just hit Diamond rank in competitive! Took me 6 months of practice, watching replays, and learning from losses. Key lesson: improving your game sense matters more than mechanical skill at high levels.', category: 'Gaming', focusType: 'story' },
    { author: bob._id, content: 'The speedrunning community is incredible. Someone just beat a 20-year-old record by 0.3 seconds using a newly discovered glitch. The dedication and creativity in this community is unmatched.', category: 'Gaming', focusType: 'news' },

    // Food
    { author: diana._id, content: 'Street food tour in Bangkok: Pad Thai, mango sticky rice, som tum, and the best coconut ice cream I\'ve ever had. Total cost: $8. Food is the universal language of culture.', category: 'Food', focusType: 'story' },
    { author: diana._id, content: '5-minute weeknight dinner: garlic butter shrimp with lemon.\n\nIngredients: shrimp, butter, garlic, lemon, parsley\n1. Melt butter, sauté garlic 30 sec\n2. Add shrimp, cook 2 min per side\n3. Squeeze lemon, top with parsley\n\nDone! Serve with rice or crusty bread.', category: 'Food', focusType: 'educational' },

    // Travel
    { author: diana._id, content: 'Hidden gem alert: A tiny village in Portugal called Monsanto, where houses are built between and under giant boulders. It feels like stepping into a fairy tale. Not in any guidebook I\'ve read!', category: 'Travel', focusType: 'story' },
    { author: evan._id, content: 'Sustainable travel tips:\n- Take trains instead of flights for short distances\n- Stay in locally-owned accommodations\n- Carry a reusable water bottle and bags\n- Eat at local restaurants, not chains\n- Leave places better than you found them', category: 'Travel', focusType: 'educational' },

    // Mature content (adults only)
    { author: bob._id, content: 'In-depth analysis of combat mechanics and realistic violence portrayal in mature-rated games. This discusses graphic content themes that some viewers may find disturbing.', category: 'Gaming', focusType: 'discussion', isMature: true },

    // AI-generated looking post
    { author: alice._id, content: 'Furthermore, it is worth noting that the landscape of artificial intelligence has undergone a remarkable transformation in recent years. Moreover, the implications of these advancements cannot be overstated. In the context of modern computing, it is important to consider the ethical ramifications of such developments. Nevertheless, the overall trajectory of progress in this domain continues to accelerate. In conclusion, the tapestry of technological innovation suggests an unprecedented era of advancement.', category: 'Technology', focusType: 'educational' },
  ];

  const posts = [];
  for (const p of postsData) {
    const post = await Post.create({ ...p, moderationStatus: 'approved' });
    posts.push(post);
  }
  console.log(`Created ${posts.length} posts`);

  // Add likes and comments
  console.log('Adding engagement...');
  const likeActions = [
    [0, [bob, charlie, diana, evan, grace, fiona]],
    [1, [bob, evan, grace, teen]],
    [2, [alice, evan, diana, teen, fiona]],
    [3, [alice, evan, charlie]],
    [4, [bob, charlie, fiona]],
    [6, [alice, charlie, diana, fiona, teen]],
    [7, [alice, grace, evan]],
    [8, [alice, bob, diana, evan, grace]],
    [9, [alice, bob, fiona]],
    [13, [alice, bob, charlie, grace]],
    [14, [alice, bob, charlie, evan]],
    [15, [alice, bob, charlie, diana, grace, fiona, teen]],
    [18, [alice, bob, evan, grace, teen]],
    [19, [bob, charlie, fiona, evan, grace, teen]],
    [20, [alice, bob, charlie]],
    [22, [alice, bob, charlie, evan, fiona]],
    [23, [alice, charlie, evan, grace]],
    [24, [alice, bob, charlie, fiona, grace]],
  ];
  for (const [idx, likers] of likeActions) {
    if (posts[idx]) {
      posts[idx].likes = likers.map((u) => u._id);
      await posts[idx].save();
    }
  }

  const comments = [
    [0, alice._id, 'This is groundbreaking! The error correction alone makes this viable.'],
    [0, grace._id, 'Imagine the implications for protein folding simulations!'],
    [2, alice._id, 'Great explanation! I would add that base editing is even more precise.'],
    [2, teen._id, 'This is super helpful for my biology class, thanks!'],
    [6, alice._id, 'Sports science is so underrated. Great breakdown!'],
    [7, bob._id, 'The Magnus effect visualization was incredible.'],
    [8, diana._id, 'These are absolutely stunning. The color palettes are so vibrant.'],
    [13, alice._id, 'This is so inspiring! How do I find volunteer opportunities near me?'],
    [15, grace._id, 'This is exactly the kind of systemic change we need.'],
    [16, alice._id, 'Could not agree more. Should be mandatory curriculum.'],
    [18, teen._id, 'These resources saved me! Currently learning Python through Kaggle.'],
    [19, grace._id, 'Feynman was brilliant. This technique works for medical studies too.'],
    [22, evan._id, 'That coconut ice cream sounds amazing. Adding Bangkok to my list!'],
    [24, diana._id, 'Monsanto looks incredible! Is it accessible by public transport?'],
  ];
  for (const [idx, userId, text] of comments) {
    if (posts[idx]) {
      posts[idx].comments.push({ user: userId, text });
      await posts[idx].save();
    }
  }
  console.log('Added likes and comments');

  // Create collaborative workspace
  console.log('Creating collaborative workspace...');
  const workspace = await CollabWorkspace.create({
    title: 'Climate Action Ideas 2026',
    description: 'A collaborative collection of practical climate action ideas that individuals and communities can implement today.',
    creator: evan._id,
    category: 'Social Causes',
    guidelines: 'Focus on actionable, practical ideas. Be specific about impact. Cite sources when possible.',
    contributors: [
      { user: evan._id, status: 'accepted', consent: true, joinedAt: new Date() },
      { user: alice._id, status: 'accepted', consent: true, joinedAt: new Date() },
      { user: diana._id, status: 'accepted', consent: true, joinedAt: new Date() },
      { user: grace._id, status: 'invited' },
    ],
    submissions: [
      { contributor: evan._id, content: 'Community solar gardens: neighborhoods pool resources to install shared solar panels. Reduces cost by 40% compared to individual installations. Already successful in 200+ US cities.', status: 'approved', reviewedBy: evan._id, reviewedAt: new Date() },
      { contributor: alice._id, content: 'AI-optimized building energy management: Smart systems that learn occupancy patterns and weather forecasts to reduce HVAC energy consumption by 30-50%. The technology exists today — we just need adoption.', status: 'approved', reviewedBy: evan._id, reviewedAt: new Date() },
      { contributor: diana._id, content: 'Zero-waste restaurant model: Partner with local farms for composting, eliminate single-use plastics, and use nose-to-tail / root-to-leaf cooking. I\'ve seen restaurants cut waste by 80% with these practices.', status: 'pending' },
    ],
    status: 'open',
  });
  console.log('Created workspace: Climate Action Ideas 2026');

  // Create some reports in the moderation queue
  console.log('Creating moderation reports...');
  const aiPost = posts[posts.length - 1]; // the AI-sounding post
  await Report.create({
    reporter: bob._id,
    post: aiPost._id,
    reason: 'ai-unlabeled',
    description: 'This post reads like it was generated by AI but isn\'t labeled as such.',
    status: 'pending',
  });

  await Report.create({
    reporter: fiona._id,
    post: posts[posts.length - 2]._id,
    reason: 'other',
    description: 'Mature content tag might be needed for this gaming discussion.',
    status: 'pending',
  });

  // Add moderation log entries
  await ModerationLog.create([
    { action: 'ai-flagged', targetType: 'post', targetId: aiPost._id, reason: 'AI content detected (75% confidence)', metadata: { confidence: 75 } },
    { action: 'report-reviewed', targetType: 'report', targetId: new mongoose.Types.ObjectId(), moderator: moderator._id, reason: 'Spam report dismissed — content is legitimate' },
    { action: 'user-warned', targetType: 'user', targetId: new mongoose.Types.ObjectId(), moderator: moderator._id, reason: 'Reminded about community guidelines' },
  ]);
  console.log('Created 2 pending reports and 3 audit log entries');

  // AI detection on the suspicious post
  aiPost.isAIGenerated = true;
  aiPost.aiConfidenceScore = 75;
  await aiPost.save();

  console.log('\n=== SEED COMPLETE ===');
  console.log(`Users:       ${users.length} (password for all: password123)`);
  console.log(`Posts:       ${posts.length} (1 mature, 1 AI-flagged)`);
  console.log(`Workspaces:  1 (with 3 submissions)`);
  console.log(`Reports:     2 pending`);
  console.log(`Audit Logs:  3`);
  console.log('\nDemo accounts:');
  console.log('  admin@focusfeed.com     — Admin (full access)');
  console.log('  mod@focusfeed.com       — Moderator (mod dashboard)');
  console.log('  alice@focusfeed.com     — Power user (Science/Tech, Learning mode)');
  console.log('  bob@focusfeed.com       — Sports/Gaming fan (Discovery mode)');
  console.log('  charlie@focusfeed.com   — Artist/Creator (Creation mode)');
  console.log('  diana@focusfeed.com     — Food/Travel blogger');
  console.log('  evan@focusfeed.com      — Activist/Educator');
  console.log('  fiona@focusfeed.com     — Gamer/Streamer');
  console.log('  teen@focusfeed.com      — Teen user (restricted content)');
  console.log('  grace@focusfeed.com     — Medical student/Educator');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
