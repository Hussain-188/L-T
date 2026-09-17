import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus } from 'react-icons/hi';
import api from '../api/axios';
import PostCard from '../components/PostCard';
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

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeCategory !== 'All') params.category = activeCategory;
      const res = await api.get('/posts', { params });
      if (page === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      setTotalPages(res.data.totalPages);
    } catch {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    setPage(1);
    setPosts([]);
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
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
                  onUpdate={fetchPosts}
                />
              ))}
            </div>

            {page < totalPages && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setPage(p => p + 1)}
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
