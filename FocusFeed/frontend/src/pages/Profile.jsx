import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

const ALL_INTERESTS = [
  'Science', 'Technology', 'Sports', 'Art', 'Music',
  'Entertainment', 'Personal Stories', 'Social Causes',
  'Education', 'Gaming', 'Food', 'Travel',
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '', bio: '', interests: [],
    privacySettings: { profileVisibility: 'public', postDefault: 'public', allowDMs: true },
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        interests: user.interests || [],
        privacySettings: user.privacySettings || { profileVisibility: 'public', postDefault: 'public', allowDMs: true },
      });
      fetchMyPosts();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    try {
      const res = await api.get('/posts', { params: { limit: 50 } });
      const myPosts = res.data.posts.filter(
        (p) => (p.author?._id || p.author) === (user?.id || user?._id)
      );
      setPosts(myPosts);
    } catch {
      // ignore
    }
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initial = (user.displayName || user.username || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.displayName || user.username}</h1>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              {user.bio && <p className="text-gray-600 text-sm mt-1">{user.bio}</p>}
            </div>
          </div>

          <div className="flex gap-6 mb-6 text-sm">
            <div className="text-center">
              <p className="font-bold text-gray-900">{user.followers?.length || 0}</p>
              <p className="text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{user.following?.length || 0}</p>
              <p className="text-gray-500">Following</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{posts.length}</p>
              <p className="text-gray-500">Posts</p>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm cursor-pointer"
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                        form.interests.includes(interest)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Privacy Settings</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile Visibility</span>
                    <select
                      value={form.privacySettings.profileVisibility}
                      onChange={(e) => setForm({
                        ...form,
                        privacySettings: { ...form.privacySettings, profileVisibility: e.target.value },
                      })}
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="public">Public</option>
                      <option value="followers">Followers Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Default Post Audience</span>
                    <select
                      value={form.privacySettings.postDefault}
                      onChange={(e) => setForm({
                        ...form,
                        privacySettings: { ...form.privacySettings, postDefault: e.target.value },
                      })}
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="public">Public</option>
                      <option value="followers">Followers Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Allow Direct Messages</span>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        privacySettings: { ...form.privacySettings, allowDMs: !form.privacySettings.allowDMs },
                      })}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        form.privacySettings.allowDMs ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.privacySettings.allowDMs ? 'left-5.5 translate-x-0' : 'left-0.5'
                      }`} style={{ left: form.privacySettings.allowDMs ? '22px' : '2px' }} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Posts</h2>
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">You haven&apos;t posted anything yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUserId={user?.id || user?._id} onUpdate={fetchMyPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
