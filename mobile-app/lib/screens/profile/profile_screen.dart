import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../services/user_service.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/common/error_display.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      context.read<UserDataProvider>().fetchUserStats();
      context.read<UserDataProvider>().fetchStats();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        body: EmptyState(
          title: 'Sign in to view your profile',
          subtitle: 'Manage your account and see your gaming stats.',
          icon: Icons.person_outline,
          actionLabel: 'Sign In',
          onAction: () => Navigator.pushNamed(context, '/login'),
        ),
      );
    }

    final user = auth.user!;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 20),

              // Avatar
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  gradient: AppTheme.accentGradient,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Center(
                  child: Text(
                    user.initials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Name
              Text(
                user.name,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user.email,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 14,
                ),
              ),
              if (user.bio != null && user.bio!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  user.bio!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Stats
              _buildStatsGrid(),
              const SizedBox(height: 24),

              // Menu items
              GlassContainer(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _menuItem(
                      icon: Icons.library_books_outlined,
                      label: 'My Collection',
                      trailing: Consumer<UserDataProvider>(
                        builder: (context, userData, _) => Text(
                          '${userData.stats.total}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      onTap: () => Navigator.pushNamed(context, '/collection'),
                    ),
                    _divider(),
                    _menuItem(
                      icon: Icons.favorite_border,
                      label: 'Wishlist',
                      trailing: Consumer<UserDataProvider>(
                        builder: (context, userData, _) => Text(
                          '${userData.stats.wishlist}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      onTap: () => Navigator.pushNamed(context, '/wishlist'),
                    ),
                    _divider(),
                    _menuItem(
                      icon: Icons.play_circle_outline,
                      label: 'Playing Now',
                      trailing: Consumer<UserDataProvider>(
                        builder: (context, userData, _) => Text(
                          '${userData.stats.playing}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      onTap: () => Navigator.pushNamed(context, '/playing-now'),
                    ),
                    _divider(),
                    _menuItem(
                      icon: Icons.check_circle_outline,
                      label: 'Completed Games',
                      trailing: Consumer<UserDataProvider>(
                        builder: (context, userData, _) => Text(
                          '${userData.stats.completed}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      onTap: () => Navigator.pushNamed(context, '/completed'),
                    ),
                    _divider(),
                    _menuItem(
                      icon: Icons.edit_outlined,
                      label: 'Edit Profile',
                      onTap: () => _showEditProfileSheet(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              GlassContainer(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _menuItem(
                      icon: Icons.info_outline,
                      label: 'About GameVault',
                      onTap: () => _showAboutDialog(),
                    ),
                    _divider(),
                    _menuItem(
                      icon: Icons.logout,
                      label: 'Sign Out',
                      color: AppTheme.errorColor,
                      onTap: () => _confirmLogout(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return Consumer<UserDataProvider>(
      builder: (context, userData, _) {
        final stats = userData.stats;
        return Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    icon: Icons.videogame_asset,
                    value: stats.total.toString(),
                    label: 'Games',
                    iconColor: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    icon: Icons.check_circle,
                    value: stats.completed.toString(),
                    label: 'Completed',
                    iconColor: AppTheme.successColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    icon: Icons.play_circle,
                    value: stats.playing.toString(),
                    label: 'Playing',
                    iconColor: AppTheme.accentCyan,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    icon: Icons.favorite,
                    value: stats.wishlist.toString(),
                    label: 'Wishlist',
                    iconColor: AppTheme.accentPink,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Widget? trailing,
    Color? color,
  }) {
    final itemColor = color ?? AppTheme.textPrimary;
    return ListTile(
      leading: Icon(icon, color: itemColor, size: 22),
      title: Text(
        label,
        style: TextStyle(
          color: itemColor,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: trailing ??
          const Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 20),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    );
  }

  Widget _divider() {
    return Divider(
      height: 1,
      indent: 54,
      color: AppTheme.borderColor.withValues(alpha: 0.3),
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final auth = context.read<AuthProvider>();
              final userData = context.read<UserDataProvider>();
              userData.clearData();
              await auth.logout();
              if (mounted) {
                Navigator.of(context)
                    .pushNamedAndRemoveUntil('/login', (_) => false);
              }
            },
            child: const Text('Sign Out',
                style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  void _showEditProfileSheet() {
    final auth = context.read<AuthProvider>();
    final user = auth.user!;
    final nameController = TextEditingController(text: user.name);
    final bioController = TextEditingController(text: user.bio ?? '');
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          16,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textMuted.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Edit Profile',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Name',
                prefixIcon: Icon(Icons.person_outline,
                    color: AppTheme.textMuted, size: 20),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: bioController,
              style: const TextStyle(color: AppTheme.textPrimary),
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Bio',
                hintText: 'Tell us about yourself...',
                prefixIcon: Padding(
                  padding: EdgeInsets.only(bottom: 48),
                  child: Icon(Icons.edit_note,
                      color: AppTheme.textMuted, size: 20),
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    final userService = UserService();
                    await userService.updateProfile(
                      name: nameController.text.trim(),
                      bio: bioController.text.trim(),
                    );
                    await auth.refreshUser();
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(content: Text('Profile updated!')),
                    );
                  } catch (e) {
                    scaffoldMessenger.showSnackBar(
                      SnackBar(content: Text('Failed to update profile: $e')),
                    );
                  }
                },
                child: const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: Row(
          children: [
            const Icon(Icons.gamepad, color: AppTheme.primaryColor),
            const SizedBox(width: 10),
            ShaderMask(
              shaderCallback: (bounds) =>
                  AppTheme.accentGradient.createShader(bounds),
              child: const Text(
                'GameVault',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version 1.0.0',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            SizedBox(height: 12),
            Text(
              'Game Management & Preservation Platform',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
