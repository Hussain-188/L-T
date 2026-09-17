import { useState, useEffect } from 'react';
import {
  HiCog, HiUsers, HiDocumentText, HiFlag, HiShieldCheck,
  HiSearch, HiBan, HiCheckCircle, HiChartBar, HiExclamation,
} from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLE_STYLES = {
  user: 'bg-gray-100 text-gray-700',
  moderator: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [botFlags, setBotFlags] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load stats');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page: userPage, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setUserTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBotFlags = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bot-flags');
      setBotFlags(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bot flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'bots') fetchBotFlags();
  }, [tab, userPage]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleBan = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to ban/unban');
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <HiCog className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform management and analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TAB('overview', 'Overview', <HiChartBar className="w-4 h-4" />)}
          {TAB('users', 'Users', <HiUsers className="w-4 h-4" />)}
          {TAB('bots', 'Bot Detection', <HiExclamation className="w-4 h-4" />)}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: <HiUsers className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
                { label: 'Total Posts', value: stats.totalPosts, icon: <HiDocumentText className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
                { label: 'Pending Reports', value: stats.pendingReports, icon: <HiFlag className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
                { label: 'Flagged Posts', value: stats.flaggedPosts, icon: <HiExclamation className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
                { label: 'Banned Users', value: stats.bannedUsers, icon: <HiBan className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
                { label: 'Workspaces', value: stats.totalWorkspaces, icon: <HiUsers className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
                { label: 'Mod Actions', value: stats.moderationActions, icon: <HiShieldCheck className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
                { label: 'Posts Today', value: stats.postsToday, icon: <HiDocumentText className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
                  <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Age demographics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Age Demographics</h3>
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">{stats.adultUsers}</p>
                  <p className="text-xs text-gray-500">Adults (18+)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-600">{stats.teenUsers}</p>
                  <p className="text-xs text-gray-500">Teens (13-17)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-600">{stats.usersToday}</p>
                  <p className="text-xs text-gray-500">New Today</p>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            {stats.categoryBreakdown?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Posts by Category</h3>
                <div className="space-y-2">
                  {stats.categoryBreakdown.map((cat) => {
                    const pct = Math.round((cat.count / stats.totalPosts) * 100);
                    return (
                      <div key={cat._id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-32 shrink-0">{cat._id}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{cat.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="Search by username, email, or name..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => { setUserPage(1); fetchUsers(); }}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer"
              >
                Search
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-500 mb-3">{userTotal} users found</div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                  {users.map((u) => (
                    <div key={u._id} className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {(u.displayName || u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{u.displayName || u.username}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                          {u.isBanned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Banned</span>}
                          {u.ageTier === 'teen' && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Teen</span>}
                        </div>
                        <p className="text-xs text-gray-500">@{u.username} · {u.email} · Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleBan(u._id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                            u.isBanned
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {userTotal > 15 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">Page {userPage}</span>
                    <button
                      onClick={() => setUserPage((p) => p + 1)}
                      disabled={users.length < 15}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Bot Detection */}
        {tab === 'bots' && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 w-64 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : botFlags.length === 0 ? (
              <div className="text-center py-20">
                <HiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <h3 className="text-lg font-semibold text-gray-700">No suspicious accounts</h3>
                <p className="text-sm text-gray-500">Bot detection found no flagged accounts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {botFlags.map((bot) => (
                  <div key={bot.userId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-800">@{bot.username}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            bot.score >= 60 ? 'bg-red-100 text-red-700' :
                            bot.score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            Risk: {bot.score}%
                          </span>
                          {bot.isBot && <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">Likely Bot</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {bot.signals.map((signal, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleBan(bot.userId)}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium cursor-pointer"
                      >
                        Ban
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
