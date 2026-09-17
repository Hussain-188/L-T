import { useState, useEffect } from 'react';
import {
  HiShieldCheck, HiFlag, HiEye, HiCheck, HiX, HiBan,
  HiExclamation, HiClipboardList, HiChartBar,
} from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  dismissed: 'bg-gray-100 text-gray-600',
  warned: 'bg-yellow-100 text-yellow-700',
  'post-removed': 'bg-red-100 text-red-700',
  'user-banned': 'bg-red-200 text-red-800',
};

const REASON_LABELS = {
  harassment: 'Harassment',
  misinformation: 'Misinformation',
  spam: 'Spam',
  'ai-unlabeled': 'Unlabeled AI',
  'undisclosed-ad': 'Undisclosed Ad',
  'hate-speech': 'Hate Speech',
  violence: 'Violence',
  other: 'Other',
};

export default function ModeratorDashboard() {
  const [tab, setTab] = useState('queue');
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [activeReport, setActiveReport] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/moderation/queue');
      setReports(res.data.reports);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/moderation/logs');
      setLogs(res.data.logs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/moderation/stats');
      setStats(res.data);
    } catch {
      // stats are optional
    }
  };

  useEffect(() => {
    fetchStats();
    if (tab === 'queue') fetchQueue();
    else if (tab === 'logs') fetchLogs();
  }, [tab]);

  const handleAction = async (reportId, action) => {
    try {
      await api.put(`/moderation/reports/${reportId}`, { action, reviewNote });
      toast.success(`Report ${action === 'dismissed' ? 'dismissed' : 'resolved'}`);
      setActiveReport(null);
      setReviewNote('');
      fetchQueue();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const TAB = (key, label, icon) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
        tab === key
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <HiShieldCheck className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
            <p className="text-sm text-gray-500">Review reports, manage content, audit actions</p>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Pending Reports', value: stats.pendingReports, icon: <HiFlag className="w-5 h-5 text-red-500" />, color: 'bg-red-50' },
              { label: 'Flagged Posts', value: stats.flaggedPosts, icon: <HiExclamation className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-50' },
              { label: 'Total Users', value: stats.totalUsers, icon: <HiEye className="w-5 h-5 text-indigo-500" />, color: 'bg-indigo-50' },
              { label: 'Total Posts', value: stats.totalPosts, icon: <HiChartBar className="w-5 h-5 text-green-500" />, color: 'bg-green-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-4 border border-white`}>
                <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TAB('queue', `Queue (${stats?.pendingReports || 0})`, <HiFlag className="w-4 h-4" />)}
          {TAB('logs', 'Audit Log', <HiClipboardList className="w-4 h-4" />)}
        </div>

        {/* Queue */}
        {tab === 'queue' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <HiShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <h3 className="text-lg font-semibold text-gray-700">All clear!</h3>
              <p className="text-sm text-gray-500">No pending reports to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    {/* Report header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                        <span className="text-xs text-gray-400">
                          Reported by @{report.reporter?.username} · {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-600 mb-3 italic">"{report.description}"</p>
                    )}

                    {/* Reported post preview */}
                    {report.post && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {(report.post.author?.displayName || report.post.author?.username || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {report.post.author?.displayName || report.post.author?.username}
                          </span>
                          {report.post.isAIGenerated && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">AI ({report.post.aiConfidenceScore}%)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">{report.post.content}</p>
                        {report.post.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {report.post.images.slice(0, 2).map((img, i) => (
                              <img key={i} src={`http://localhost:5000/${img}`} alt="" className="w-20 h-20 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    {activeReport === report._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Review note (optional)..."
                          className="w-full text-sm px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleAction(report._id, 'dismissed')} className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer">
                            <HiX className="w-4 h-4" /> Dismiss
                          </button>
                          <button onClick={() => handleAction(report._id, 'warned')} className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 cursor-pointer">
                            <HiExclamation className="w-4 h-4" /> Warn User
                          </button>
                          <button onClick={() => handleAction(report._id, 'post-removed')} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 cursor-pointer">
                            <HiFlag className="w-4 h-4" /> Remove Post
                          </button>
                          <button onClick={() => handleAction(report._id, 'user-banned')} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer">
                            <HiBan className="w-4 h-4" /> Ban User
                          </button>
                          <button onClick={() => { setActiveReport(null); setReviewNote(''); }} className="px-3 py-2 text-gray-500 text-sm cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReport(report._id)}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer"
                      >
                        <HiEye className="w-4 h-4" /> Review & Take Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Audit Log */}
        {tab === 'logs' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="h-3 w-64 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <HiClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No moderation actions recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log._id} className="p-4 flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-indigo-100 text-indigo-700'}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">
                      {log.targetType} · {log.reason || 'No reason'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {log.moderator?.username ? `by @${log.moderator.username}` : 'system'} · {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
