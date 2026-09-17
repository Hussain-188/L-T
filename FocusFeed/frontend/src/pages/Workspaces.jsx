import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiUsers, HiDocumentText, HiCheckCircle, HiClock } from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  published: 'bg-indigo-100 text-indigo-700',
};

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', guidelines: '' });
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const params = filter === 'mine' ? { mine: 'true' } : {};
      const res = await api.get('/collab', { params });
      setWorkspaces(res.data);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setCreating(true);
    try {
      await api.post('/collab', form);
      toast.success('Workspace created!');
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'Other', guidelines: '' });
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const CATEGORIES = [
    'Science', 'Technology', 'Sports', 'Art', 'Music', 'Entertainment',
    'Personal Stories', 'Social Causes', 'Education', 'Gaming', 'Food', 'Travel', 'Other',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collaborative Workspaces</h1>
            <p className="text-sm text-gray-500 mt-1">Create and contribute to shared projects</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium text-sm cursor-pointer"
          >
            <HiPlus className="w-4 h-4" /> New Workspace
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Workspace</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Best Tech Moments 2026"
                  maxLength={120}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this collaboration about?"
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guidelines</label>
                  <input
                    type="text"
                    value={form.guidelines}
                    onChange={(e) => setForm({ ...form, guidelines: e.target.value })}
                    placeholder="Optional rules for contributors"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All Workspaces' },
            { key: 'mine', label: 'My Workspaces' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Workspace list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
                <div className="h-3 w-full bg-gray-200 rounded mb-2" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No workspaces yet</h3>
            <p className="text-gray-500 mb-4">Be the first to start a collaboration!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <HiPlus className="w-4 h-4" /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <Link
                key={ws._id}
                to={`/workspace/${ws._id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{ws.title}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[ws.status]}`}>
                    {ws.status}
                  </span>
                </div>
                {ws.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ws.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <HiUsers className="w-3.5 h-3.5" />
                    {ws.contributors?.filter((c) => c.status === 'accepted').length || 0} contributors
                  </span>
                  <span className="flex items-center gap-1">
                    <HiDocumentText className="w-3.5 h-3.5" />
                    {ws.submissions?.length || 0} submissions
                  </span>
                  <span className="flex items-center gap-1">
                    {ws.status === 'published' ? (
                      <><HiCheckCircle className="w-3.5 h-3.5 text-green-500" /> Published</>
                    ) : (
                      <><HiClock className="w-3.5 h-3.5" /> {new Date(ws.updatedAt).toLocaleDateString()}</>
                    )}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    by {ws.creator?.displayName || ws.creator?.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
