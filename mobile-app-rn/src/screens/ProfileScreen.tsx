import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { Screen, Card, Button } from '../components/ui';
import { theme } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen: React.FC = () => {
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => logout(),
            },
        ]);
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Avatar section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    {isAdmin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <Card style={styles.infoCard}>
                    <InfoRow label="Name" value={user?.name || '-'} />
                    <InfoRow label="Email" value={user?.email || '-'} />
                    <InfoRow label="Account Type" value={user?.type || 'user'} />
                    <InfoRow
                        label="Joined"
                        value={
                            user?.created_at
                                ? new Date(user.created_at).toLocaleDateString()
                                : '-'
                        }
                    />
                    {user?.bio && <InfoRow label="Bio" value={user.bio} />}
                </Card>

                {/* App Info */}
                <Card style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <InfoRow label="App" value="GameVault Mobile" />
                    <InfoRow label="Version" value="1.0.0 (React Native)" />
                    <InfoRow label="Platform" value="Cross-platform" />
                </Card>

                {/* Logout */}
                <Button
                    title="Sign Out"
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutBtn}
                />
            </ScrollView>
        </Screen>
    );
};

// Helper component for info rows
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingTop: 56,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.white,
    },
    userName: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    userEmail: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    adminBadge: {
        marginTop: theme.spacing.sm,
        backgroundColor: `${theme.colors.warning}25`,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    adminBadgeText: {
        color: theme.colors.warning,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    infoCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    infoLabel: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
        flex: 1,
        textAlign: 'right',
    },
    logoutBtn: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        borderColor: theme.colors.error,
    },
});
