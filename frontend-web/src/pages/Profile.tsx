import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUserStats } from '../hooks/useUserStats';
import { api } from '../services/api';
import { reviewService, Review } from '../services/reviewService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const { stats } = useUserStats();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
    });

    useEffect(() => {
        if (user?.id) {
            reviewService.getUserReviews(user.id, { limit: 5 })
                .then((res) => setRecentReviews(res.data?.reviews || []))
                .catch(() => { });
        }
    }, [user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage('');
        try {
            await api.put('/users/me', { name: formData.name, bio: formData.bio });
            setSaveMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (err: any) {
            setSaveMessage(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const settingsItems = [
        { icon: '🔐', title: 'Password', description: 'Change your password', action: 'Change' },
        { icon: '📧', title: 'Email Notifications', description: 'Manage your email preferences', action: 'Manage' },
        { icon: '🔒', title: 'Privacy Settings', description: 'Control who can see your profile', action: 'Configure' },
        { icon: '🔗', title: 'Connected Accounts', description: 'Link your gaming platforms', action: 'Connect' },
    ];

    return (
        <motion.div
            className="max-w-4xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-bold mb-2 gradient-text">Profile</h1>
                <p className="text-gray-400">Manage your account and preferences</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div variants={itemVariants} className="glass-card p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* Avatar */}
                    <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-pink rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary-500/20">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{user?.name || 'User'}</h2>
                                <p className="text-gray-400">{user?.email}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                variant={isEditing ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancel' : '✏️ Edit Profile'}
                            </Button>
                        </div>

                        {saveMessage && (
                            <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${saveMessage.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {saveMessage}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-300">
                            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.collection || 0}</div>
                                <div className="text-sm text-gray-500">Games</div>
                            </motion.div>
                            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stats.completed || 0}</div>
                                <div className="text-sm text-gray-500">Completed</div>
                            </motion.div>
                            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                                <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{stats.wishlist || 0}</div>
                                <div className="text-sm text-gray-500">Wishlist</div>
                            </motion.div>
                            <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.reviews || 0}</div>
                                <div className="text-sm text-gray-500">Reviews</div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Edit Form */}
            {isEditing && (
                <motion.div
                    className="glass-card p-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <h3 className="text-xl font-bold mb-6 text-white">Edit Profile Information</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" loading={saving}>Save Changes</Button>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Account Settings */}
            <motion.div variants={itemVariants} className="glass-card p-6">
                <h3 className="text-xl font-bold mb-6 text-white">Account Settings</h3>
                <div className="space-y-2">
                    {settingsItems.map((item, index) => (
                        <motion.div
                            key={item.title}
                            className="flex justify-between items-center p-4 rounded-xl hover:bg-dark-300/50 transition-colors group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <div className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                        {item.title}
                                    </div>
                                    <div className="text-sm text-gray-500">{item.description}</div>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm">{item.action}</Button>
                        </motion.div>
                    ))}

                    <motion.div
                        className="flex justify-between items-center p-4 rounded-xl hover:bg-red-500/10 transition-colors group mt-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <div className="font-medium text-red-400">Delete Account</div>
                                <div className="text-sm text-gray-500">Permanently delete your account</div>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm">Delete</Button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Logout */}
            <motion.div variants={itemVariants} className="glass-card p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">🚪</span>
                        <div>
                            <h3 className="font-medium text-white">Sign Out</h3>
                            <p className="text-sm text-gray-500">Sign out from your account</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </motion.div>

            {/* Recent Reviews */}
            {recentReviews.length > 0 && (
                <motion.div variants={itemVariants} className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">My Recent Reviews</h3>
                    <div className="space-y-3">
                        {recentReviews.map((review) => (
                            <div key={review.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-300/50">
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">Game #{review.game_id}</p>
                                    <p className="text-xs text-gray-500 line-clamp-1">{review.review_text || 'No text'}</p>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
