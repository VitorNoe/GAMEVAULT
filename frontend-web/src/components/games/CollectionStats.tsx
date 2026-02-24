import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface StatItem {
    label: string;
    value: number;
    icon: string;
    color: string;
}

interface CollectionStatsProps {
    stats: {
        total: number;
        by_status: Record<string, number>;
        by_format: Record<string, number>;
        by_platform: Array<{ platform: string; count: number }>;
        total_spent: number;
        average_rating: number;
    } | null;
    loading?: boolean;
}

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
    owned: { icon: '📚', color: 'from-blue-500 to-blue-400' },
    playing: { icon: '🎮', color: 'from-green-500 to-green-400' },
    completed: { icon: '✅', color: 'from-purple-500 to-purple-400' },
    dropped: { icon: '⛔', color: 'from-red-500 to-red-400' },
    backlog: { icon: '📋', color: 'from-yellow-500 to-yellow-400' },
};

const CollectionStatsComponent: React.FC<CollectionStatsProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                        <div className="h-8 bg-white/5 rounded mb-2" />
                        <div className="h-4 bg-white/5 rounded w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const mainStats: StatItem[] = [
        { label: 'Total Games', value: stats.total || 0, icon: '🎮', color: 'from-primary-500 to-primary-400' },
        { label: 'Avg Rating', value: stats.average_rating ? Number(stats.average_rating.toFixed(1)) : 0, icon: '⭐', color: 'from-yellow-500 to-yellow-400' },
        { label: 'Total Spent', value: stats.total_spent || 0, icon: '💰', color: 'from-green-500 to-green-400' },
        { label: 'Platforms', value: stats.by_platform?.length || 0, icon: '🖥️', color: 'from-blue-500 to-blue-400' },
    ];

    return (
        <div className="space-y-6 mb-6">
            {/* Main stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mainStats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-4 rounded-xl"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{stat.icon}</span>
                            <span className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                {stat.label === 'Total Spent' ? `$${stat.value}` : stat.value}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Status breakdown */}
            {stats.by_status && Object.keys(stats.by_status).length > 0 && (
                <div className="glass-card p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">By Status</h4>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(stats.by_status).map(([status, count]) => {
                            const config = STATUS_ICONS[status] || { icon: '📁', color: 'from-gray-500 to-gray-400' };
                            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            return (
                                <motion.div
                                    key={status}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-300/50"
                                >
                                    <span>{config.icon}</span>
                                    <span className="text-sm text-white font-medium capitalize">{status}</span>
                                    <span className="text-sm text-gray-400">{count}</span>
                                    <span className="text-xs text-gray-600">({pct}%)</span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 rounded-full bg-dark-300 overflow-hidden flex">
                        {Object.entries(stats.by_status).map(([status, count]) => {
                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            const colors: Record<string, string> = {
                                owned: 'bg-blue-500',
                                playing: 'bg-green-500',
                                completed: 'bg-purple-500',
                                dropped: 'bg-red-500',
                                backlog: 'bg-yellow-500',
                            };
                            return (
                                <div
                                    key={status}
                                    className={`h-full ${colors[status] || 'bg-gray-500'} transition-all`}
                                    style={{ width: `${pct}%` }}
                                    title={`${status}: ${count}`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Platform breakdown */}
            {stats.by_platform && stats.by_platform.length > 0 && (
                <div className="glass-card p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">By Platform</h4>
                    <div className="space-y-2">
                        {stats.by_platform.slice(0, 8).map((p) => {
                            const pct = stats.total > 0 ? Math.round((p.count / stats.total) * 100) : 0;
                            return (
                                <div key={p.platform} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-300 w-32 truncate">{p.platform}</span>
                                    <div className="flex-1 h-2 rounded-full bg-dark-300 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.3, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-primary-500 to-accent-pink rounded-full"
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 w-16 text-right">{p.count} ({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const CollectionStats = memo(CollectionStatsComponent);
