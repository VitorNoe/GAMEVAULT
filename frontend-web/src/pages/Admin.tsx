import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService, DashboardReport } from '../services/adminService';

import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Pagination } from '../components/common/Pagination';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

type Tab = 'dashboard' | 'users' | 'moderation' | 'logs';

/** Trigger a file download from a blob response */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

// ---- Dashboard Tab ----
const DashboardTab: React.FC = () => {
    const [report, setReport] = useState<DashboardReport | null>(null);
    const [topGames, setTopGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [dash, top] = await Promise.all([
                    adminService.getDashboard(),
                    adminService.getTopGames(10),
                ]);
                setReport(dash);
                setTopGames(top.data || []);
            } catch { } finally { setLoading(false); }
        };
        load();
    }, []);

    const handleExport = async (reportType: string, format: 'csv' | 'pdf') => {
        try {
            setExporting(true);
            let response;
            if (reportType === 'dashboard') {
                response = await adminService.exportDashboard(format);
            } else {
                response = await adminService.exportReport(reportType, format);
            }
            const ext = format === 'pdf' ? 'pdf' : 'csv';
            downloadBlob(response.data, `gamevault_${reportType}.${ext}`);
        } catch { } finally { setExporting(false); }
    };

    if (loading) return <Loading />;
    if (!report) return <ErrorMessage message="Failed to load dashboard" />;

    const cards = [
        { label: 'Total Users', value: report.total_users, icon: '👥', color: 'from-blue-500 to-cyan-400' },
        { label: 'Total Games', value: report.total_games, icon: '🎮', color: 'from-purple-500 to-pink-400' },
        { label: 'Total Reviews', value: report.total_reviews, icon: '📝', color: 'from-green-500 to-emerald-400' },
        { label: 'Collections', value: report.total_collections, icon: '📚', color: 'from-orange-500 to-yellow-400' },
        { label: 'New Users Today', value: report.new_users_today, icon: '🆕', color: 'from-teal-500 to-cyan-400' },
        { label: 'Reviews Today', value: report.new_reviews_today, icon: '✍️', color: 'from-indigo-500 to-purple-400' },
        { label: 'Flagged Reviews', value: report.flagged_reviews, icon: '🚩', color: 'from-red-500 to-orange-400' },
        { label: 'Banned Users', value: report.banned_users, icon: '🔨', color: 'from-red-600 to-red-400' },
    ];

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <motion.div key={card.label} variants={itemVariants} className="glass-card p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{card.icon}</span>
                            <span className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                                {card.value?.toLocaleString() || 0}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {topGames.length > 0 && (
                <motion.div variants={itemVariants} className="glass-card p-5 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Top Games by Collection</h3>
                    <div className="space-y-2">
                        {topGames.map((g: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                                    <span className="text-white font-medium">{g.title || g.game_title || `Game #${g.game_id}`}</span>
                                </div>
                                <span className="text-sm text-gray-400">{g.count || g.collection_count || 0} owners</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Export Reports Section */}
            <motion.div variants={itemVariants} className="glass-card p-5 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4">📥 Export Reports</h3>
                <p className="text-sm text-gray-400 mb-4">Download platform reports as CSV or PDF files.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { key: 'dashboard', label: 'Dashboard Overview', icon: '📊' },
                        { key: 'top-games', label: 'Top Rated Games', icon: '🏆' },
                        { key: 'most-reviewed', label: 'Most Reviewed Games', icon: '📝' },
                        { key: 'active-users', label: 'Most Active Users', icon: '👥' },
                        { key: 'rereleases', label: 'Re-release Requests', icon: '🔄' },
                        { key: 'registration-trend', label: 'Registration Trend', icon: '📈' },
                        { key: 'review-trend', label: 'Review Trend', icon: '⭐' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                                <span>{item.icon}</span>
                                <span className="text-sm text-white font-medium">{item.label}</span>
                            </div>
                            <div className="flex gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    disabled={exporting}
                                    onClick={() => handleExport(item.key, 'csv')}
                                    className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                    title="Download CSV"
                                >
                                    CSV
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    disabled={exporting}
                                    onClick={() => handleExport(item.key, 'pdf')}
                                    className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                    title="Download PDF"
                                >
                                    PDF
                                </motion.button>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ---- Users Tab ----
const UsersTab: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params: Record<string, any> = { page, limit: 20 };
            if (search) params.search = search;
            const response = await adminService.getUsers(params);
            const data = response.data || response;
            setUsers(data.users || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleBan = async (userId: number, isBanned: boolean) => {
        setActionLoading(userId);
        try {
            if (isBanned) {
                await adminService.unbanUser(userId);
            } else {
                const reason = prompt('Reason for ban (optional):');
                await adminService.banUser(userId, reason || undefined);
            }
            fetchUsers();
        } catch { } finally { setActionLoading(null); }
    };

    const handleRoleChange = async (userId: number, currentRole: string) => {
        setActionLoading(userId);
        try {
            const newRole = currentRole === 'admin' ? 'regular' : 'admin';
            await adminService.updateUserRole(userId, newRole);
            fetchUsers();
        } catch { } finally { setActionLoading(null); }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search users by name or email..."
                    className="input flex-1"
                />
            </div>

            {error && <ErrorMessage message={error} onRetry={fetchUsers} />}

            {loading ? <Loading /> : (
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-pink flex items-center justify-center font-bold text-xs text-white">
                                                    {u.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <span className="text-white font-medium">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.type === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {u.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {u.is_banned ? 'Banned' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={actionLoading === u.id}
                                                    onClick={() => handleRoleChange(u.id, u.type)}
                                                    className="px-2 py-1 rounded text-xs font-medium bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                                                >
                                                    {u.type === 'admin' ? 'Demote' : 'Promote'}
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={actionLoading === u.id}
                                                    onClick={() => handleBan(u.id, u.is_banned)}
                                                    className={`px-2 py-1 rounded text-xs font-medium ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} transition-colors`}
                                                >
                                                    {u.is_banned ? 'Unban' : 'Ban'}
                                                </motion.button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No users found</div>
                    )}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};

// ---- Moderation Tab ----
const ModerationTab: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params: Record<string, any> = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const response = await adminService.getModerationReviews(params);
            const data = response.data || response;
            setReviews(data.reviews || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleModerate = async (reviewId: number, action: 'approve' | 'flag' | 'remove') => {
        try {
            const reason = action !== 'approve' ? prompt('Reason (optional):') || undefined : undefined;
            await adminService.moderateReview(reviewId, action, reason);
            fetchReviews();
        } catch { }
    };

    const statusFilters = [
        { value: '', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'flagged', label: 'Flagged' },
        { value: 'removed', label: 'Removed' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {statusFilters.map((f) => (
                    <motion.button
                        key={f.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setStatusFilter(f.value); setPage(1); }}
                        className={`filter-btn ${statusFilter === f.value ? 'active' : ''}`}
                    >
                        {f.label}
                    </motion.button>
                ))}
            </div>

            {error && <ErrorMessage message={error} onRetry={fetchReviews} />}

            {loading ? <Loading /> : (
                <div className="space-y-3">
                    {reviews.map((review: any) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-4 rounded-xl"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="text-white font-medium">{review.User?.name || `User #${review.user_id}`}</span>
                                    <span className="text-gray-500 text-sm ml-2">on Game #{review.game_id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${review.moderation_status === 'flagged' ? 'bg-red-500/20 text-red-400' :
                                        review.moderation_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                            review.moderation_status === 'removed' ? 'bg-gray-500/20 text-gray-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {review.moderation_status || 'pending'}
                                    </span>
                                </div>
                            </div>
                            {review.review_text && (
                                <p className="text-sm text-gray-400 mb-3 line-clamp-3">{review.review_text}</p>
                            )}
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleModerate(review.id, 'approve')}
                                    className="px-3 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                >
                                    ✓ Approve
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleModerate(review.id, 'flag')}
                                    className="px-3 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                >
                                    🚩 Flag
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleModerate(review.id, 'remove')}
                                    className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                    ✕ Remove
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                    {reviews.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No reviews to moderate</div>
                    )}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};

// ---- Activity Logs Tab ----
const LogsTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getActivityLogs({ page, limit: 30 });
            const data = response.data || response;
            setLogs(data.logs || data.activities || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch { } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="space-y-4">
            {loading ? <Loading /> : (
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Activity</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Entity</th>
                                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: any, idx: number) => (
                                    <tr key={log.id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-white">{log.User?.name || `User #${log.user_id}`}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-500/20 text-primary-400">
                                                {log.activity_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">{log.entity_type} #{log.entity_id}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {logs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No activity logs found</div>
                    )}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};

// ---- Main Admin Page ----
export const Admin: React.FC = () => {
    const { isAdmin, isAuthenticated, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    if (loading) return <Loading />;
    if (!isAuthenticated || !isAdmin) return <Navigate to={ROUTES.HOME} replace />;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'moderation', label: 'Moderation', icon: '🛡️' },
        { id: 'logs', label: 'Activity Logs', icon: '📋' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Manage users, moderate content, and monitor platform activity</p>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 flex-wrap border-b border-white/10 pb-4"
            >
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </motion.button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'moderation' && <ModerationTab />}
                    {activeTab === 'logs' && <LogsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
