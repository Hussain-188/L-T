function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function getAgeTier(dateOfBirth) {
  const age = getAge(dateOfBirth);
  if (age === null) return 'unknown';
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  return 'adult';
}

const restrictTeen = (req, res, next) => {
  if (!req.user) return next();
  const tier = getAgeTier(req.user.dateOfBirth);
  req.ageTier = tier;
  next();
};

const blockMatureContent = (req, res, next) => {
  if (!req.user) return next();
  const tier = getAgeTier(req.user.dateOfBirth);
  if (tier === 'teen' && req.body?.isMature) {
    return res.status(403).json({ message: 'Users under 18 cannot post mature content' });
  }
  next();
};

const filterMaturePosts = (query, user) => {
  if (!user) return query;
  const tier = getAgeTier(user.dateOfBirth);
  if (tier === 'teen') {
    query.isMature = { $ne: true };
  }
  return query;
};

module.exports = { getAge, getAgeTier, restrictTeen, blockMatureContent, filterMaturePosts };
