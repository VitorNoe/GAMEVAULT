import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: '',
        favoriteGenre: '',
        gamerTag: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Implementar atualização de perfil no futuro
        console.log('Update profile:', formData);
        setIsEditing(false);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-2">Profile</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
            </div>

            {/* Profile Card */}
            <Card>
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
                                <p className="text-gray-600">{user?.email}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Member since {new Date().toLocaleDateString()}
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

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">0</div>
                                <div className="text-sm text-gray-600">Games</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">0</div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">0</div>
                                <div className="text-sm text-gray-600">Achievements</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Edit Form */}
            {isEditing && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">Edit Profile Information</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <Input
                            label="Favorite Genre"
                            value={formData.favoriteGenre}
                            onChange={(e) => setFormData({ ...formData, favoriteGenre: e.target.value })}
                            placeholder="e.g., RPG, Action, Strategy"
                        />

                        <Input
                            label="Gamer Tag"
                            value={formData.gamerTag}
                            onChange={(e) => setFormData({ ...formData, gamerTag: e.target.value })}
                            placeholder="Your gamer tag"
                        />

                        <div className="flex gap-2">
                            <Button type="submit">Save Changes</Button>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Account Settings */}
            <Card>
                <h3 className="text-xl font-bold mb-4">Account Settings</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                        <div>
                            <div className="font-medium">Password</div>
                            <div className="text-sm text-gray-600">Change your password</div>
                        </div>
                        <Button variant="secondary" size="sm">Change</Button>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b">
                        <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-gray-600">Manage your email preferences</div>
                        </div>
                        <Button variant="secondary" size="sm">Manage</Button>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b">
                        <div>
                            <div className="font-medium">Privacy Settings</div>
                            <div className="text-sm text-gray-600">Control who can see your profile</div>
                        </div>
                        <Button variant="secondary" size="sm">Configure</Button>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b">
                        <div>
                            <div className="font-medium">Connected Accounts</div>
                            <div className="text-sm text-gray-600">Link your gaming platforms</div>
                        </div>
                        <Button variant="secondary" size="sm">Connect</Button>
                    </div>

                    <div className="flex justify-between items-center py-3">
                        <div>
                            <div className="font-medium text-red-600">Delete Account</div>
                            <div className="text-sm text-gray-600">Permanently delete your account</div>
                        </div>
                        <Button variant="secondary" size="sm">Delete</Button>
                    </div>
                </div>
            </Card>

            {/* Logout */}
            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium">Sign Out</h3>
                        <p className="text-sm text-gray-600">Sign out from your account</p>
                    </div>
                    <Button variant="secondary" onClick={handleLogout}>
                        🚪 Logout
                    </Button>
                </div>
            </Card>
        </div>
    );
};
