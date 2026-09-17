import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiAdjustments } from 'react-icons/hi';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import FocusModeToggle from '../components/FocusModeToggle';
import InterestSelector from '../components/InterestSelector';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All', 'Science', 'Technology', 'Sports', 'Art', 'Music',
  'Entertainment', 'Personal Stories', 'Social Causes',
  'Education', 'Gaming', 'Food', 'Travel',
];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [profile, setProfile] = useState(null);
  const [showInterests, setShowInterests] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/interests/my');
      setProfile(res.data);
    } catch {
      // Profile will be created on first access
    }
  }, []);

  const fetchFeed = useCallback(async (resetPosts = false) => {
    setLoading(true);
    try {
      const params = { page: resetPosts ? 1 : page, limit: 20 };
      if (activeCategory !== 'All') params.category = activeCategory;

      const res = await api.get('/feed', { params });

      if (resetPosts || page === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts((prev) => [...prev, ...res.data.posts]);
      }
      setTotalPages(res.data.totalPages);
    } catch {
      // Fallback to basic posts endpoint
      try {
        const params = { page: resetPosts ? 1 : page, limit: 20 };
        if (activeCategory !== 'All') params.category = activeCategory;
        const res = await api.get('/posts', { params });
        setPosts(resetPosts || page === 1 ? res.data.posts : (prev) => [...prev, ...res.data.posts]);
        setTotalPages(res.data.totalPages);
      } catch {
        console.error('Failed to fetch feed');
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setPage(1);
    setPosts([]);
  }, [activeCategory]);

  useEffect(() => {
    fetchFeed(page === 1);
  }, [fetchFeed]);

  const handleModeChange = (mode) => {
    setProfile((prev) => prev ? { ...prev, activeFocusMode: mode } : prev);
    setPage(1);
    setPosts([]);
    setTimeout(() => fetchFeed(true), 100);
  };

  const handleInterestUpdate = () => {
    fetchProfile();
    setPage(1);
    setPosts([]);
    setTimeout(() => fetchFeed(true), 100);
  };

  const hasSetInterests = profile?.interests?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Focus Mode + Interest Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <FocusModeToggle
              activeMode={profile?.activeFocusMode || 'learning'}
              onModeChange={handleModeChange}
            />
            <button
              onClick={() => setShowInterests(!showInterests)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                showInterests
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              <HiAdjustments className="w-4 h-4" />
              Interests
            </button>
          </div>

          {/* First-time setup prompt */}
          {!hasSetInterests && !showInterests && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm text-indigo-800 font-medium mb-2">
                Welcome to FocusFeed! Set up your interests to personalize your feed.
              </p>
              <button
                onClick={() => setShowInterests(true)}
                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Set Up Interests
              </button>
            </div>
          )}

          {showInterests && (
            <InterestSelector
              profile={profile}
              onUpdate={handleInterestUpdate}
              onClose={() => setShowInterests(false)}
            />
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Active Mode Banner */}
        <div className="mb-4 text-xs text-gray-500 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium capitalize">
            {profile?.activeFocusMode || 'learning'} mode
          </span>
          {activeCategory !== 'All' && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {activeCategory}
            </span>
          )}
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-2 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to share something!</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <HiPlus className="w-4 h-4" /> Create Post
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?.id || user?._id}
                  onUpdate={() => fetchFeed(true)}
                  showExplain
                />
              ))}
            </div>

            {page < totalPages && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="bg-white text-indigo-600 border border-indigo-200 px-6 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm cursor-pointer"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Link
        to="/create"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <HiPlus className="w-6 h-6" />
      </Link>
    </div>
  );
}
