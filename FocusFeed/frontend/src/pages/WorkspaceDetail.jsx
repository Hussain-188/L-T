import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiUsers, HiDocumentText, HiCheckCircle, HiXCircle,
  HiClock, HiPlus, HiCheck, HiX, HiUpload, HiArrowLeft,
} from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TAB_STYLES = (active) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
    active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
  }`;

const STATUS_ICON = {
  pending: <HiClock className="w-4 h-4 text-yellow-500" />,
  approved: <HiCheckCircle className="w-4 h-4 text-green-500" />,
  rejected: <HiXCircle className="w-4 h-4 text-red-500" />,
};

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('submissions');
  const [inviteUsername, setInviteUsername] = useState('');
  const [submitContent, setSubmitContent] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get(`/collab/${id}`);
      setWorkspace(res.data);
    } catch {
      toast.error('Failed to load workspace');
      navigate('/workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspace(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!workspace) return null;

  const userId = user?.id || user?._id;
  const isCreator = workspace.creator?._id === userId;
  const myContrib = workspace.contributors?.find((c) => (c.user?._id || c.user) === userId);
  const isAccepted = myContrib?.status === 'accepted';
  const isInvited = myContrib?.status === 'invited';
  const acceptedContributors = workspace.contributors?.filter((c) => c.status === 'accepted') || [];
  const pendingSubmissions = workspace.submissions?.filter((s) => s.status === 'pending') || [];
  const approvedSubmissions = workspace.submissions?.filter((s) => s.status === 'approved') || [];
  const rejectedSubmissions = workspace.submissions?.filter((s) => s.status === 'rejected') || [];

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    try {
      await api.post(`/collab/${id}/invite`, { username: inviteUsername.trim() });
      toast.success(`Invited ${inviteUsername}`);
      setInviteUsername('');
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite');
    }
  };

  const handleAccept = async () => {
    try {
      await api.put(`/collab/${id}/accept`, { consent: true });
      toast.success('Joined workspace! You gave consent to contribute.');
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDecline = async () => {
    try {
      await api.put(`/collab/${id}/decline`);
      toast.success('Invitation declined');
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitContent.trim()) return toast.error('Content is required');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', submitContent.trim());
      if (submitFile) formData.append('media', submitFile);
      await api.post(`/collab/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submission added!');
      setSubmitContent('');
      setSubmitFile(null);
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (subId, action) => {
    try {
      await api.put(`/collab/${id}/submissions/${subId}/review`, { action });
      toast.success(`Submission ${action}`);
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review');
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.post(`/collab/${id}/publish`);
      toast.success('Published as a post!');
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back nav */}
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4 cursor-pointer"
        >
          <HiArrowLeft className="w-4 h-4" /> Back to Workspaces
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created by {workspace.creator?.displayName || workspace.creator?.username}
              </p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${
              workspace.status === 'open' ? 'bg-green-100 text-green-700' :
              workspace.status === 'published' ? 'bg-indigo-100 text-indigo-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {workspace.status}
            </span>
          </div>
          {workspace.description && (
            <p className="text-gray-700 text-sm mb-3">{workspace.description}</p>
          )}
          {workspace.guidelines && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Guidelines:</strong> {workspace.guidelines}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <HiUsers className="w-4 h-4 text-indigo-500" />
              {acceptedContributors.length} contributors
            </span>
            <span className="flex items-center gap-1.5">
              <HiDocumentText className="w-4 h-4 text-indigo-500" />
              {workspace.submissions?.length || 0} submissions
            </span>
            <span className="flex items-center gap-1.5">
              <HiCheckCircle className="w-4 h-4 text-green-500" />
              {approvedSubmissions.length} approved
            </span>
          </div>

          {/* Invitation banner */}
          {isInvited && (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-800">You've been invited to contribute!</p>
                <p className="text-xs text-indigo-600 mt-1">By accepting, you consent to your contributions being used in the published result.</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={handleAccept} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer">
                  <HiCheck className="w-4 h-4" /> Accept & Consent
                </button>
                <button onClick={handleDecline} className="flex items-center gap-1 bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <HiX className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          )}

          {/* Creator controls */}
          {isCreator && workspace.status === 'open' && (
            <div className="mt-4 flex gap-3">
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Invite by username..."
                  className="flex-1 text-sm px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <button
                  onClick={handleInvite}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
                >
                  <HiPlus className="w-4 h-4" />
                </button>
              </div>
              {approvedSubmissions.length > 0 && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'submissions', label: `Submissions (${workspace.submissions?.length || 0})` },
            { key: 'contributors', label: `Contributors (${acceptedContributors.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={TAB_STYLES(tab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'submissions' && (
          <div className="space-y-4">
            {/* Submit form */}
            {isAccepted && workspace.status === 'open' && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Add Your Contribution</h3>
                <textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  placeholder="Share your content for this collaboration..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 cursor-pointer">
                    <HiUpload className="w-4 h-4" />
                    {submitFile ? submitFile.name : 'Attach image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSubmitFile(e.target.files[0])}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {/* Submission groups */}
            {[
              { label: 'Pending Review', items: pendingSubmissions, color: 'yellow' },
              { label: 'Approved', items: approvedSubmissions, color: 'green' },
              { label: 'Rejected', items: rejectedSubmissions, color: 'red' },
            ].map(({ label, items, color }) =>
              items.length > 0 && (
                <div key={label}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-${color}-500`} /> {label} ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((sub) => (
                      <div key={sub._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(sub.contributor?.displayName || sub.contributor?.username || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-800">
                                {sub.contributor?.displayName || sub.contributor?.username}
                              </span>
                              {STATUS_ICON[sub.status]}
                              <span className="text-xs text-gray-400">
                                {new Date(sub.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.content}</p>
                            {sub.mediaUrl && (
                              <img
                                src={`http://localhost:5000/${sub.mediaUrl}`}
                                alt=""
                                className="mt-2 rounded-lg max-h-48 object-cover"
                              />
                            )}
                          </div>
                          {/* Review buttons for creator */}
                          {isCreator && sub.status === 'pending' && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => handleReview(sub._id, 'approved')}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer"
                                title="Approve"
                              >
                                <HiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReview(sub._id, 'rejected')}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"
                                title="Reject"
                              >
                                <HiX className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {workspace.submissions?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <HiDocumentText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No submissions yet. Be the first to contribute!</p>
              </div>
            )}
          </div>
        )}

        {tab === 'contributors' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {workspace.contributors?.map((c) => {
              const u = c.user || {};
              return (
                <div key={c._id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {(u.displayName || u.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {u.displayName || u.username}
                      {workspace.creator?._id === (u._id || u) && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Creator</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                    c.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    c.status === 'invited' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {c.status}
                  </span>
                  {c.consent && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <HiCheckCircle className="w-3.5 h-3.5" /> Consent
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
