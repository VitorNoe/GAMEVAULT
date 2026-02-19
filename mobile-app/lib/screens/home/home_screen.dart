import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/games_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/games/game_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final games = context.read<GamesProvider>();
    if (games.games.isEmpty) {
      games.fetchGames(sort: 'release_date');
    }

    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      final userData = context.read<UserDataProvider>();
      userData.fetchStats();
      userData.fetchUserStats();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primaryColor,
          backgroundColor: AppTheme.cardColor,
          onRefresh: () async {
            final gamesProvider = context.read<GamesProvider>();
            final auth = context.read<AuthProvider>();
            final userData = context.read<UserDataProvider>();
            await gamesProvider.fetchGames(
                  sort: 'release_date',
                  refresh: true,
                );
            if (auth.isAuthenticated) {
              await userData.fetchStats();
            }
          },
          child: CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(child: _buildHeader()),

              // Stats (if authenticated)
              Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  if (!auth.isAuthenticated) return const SliverToBoxAdapter();
                  return SliverToBoxAdapter(child: _buildStats());
                },
              ),

              // Quick actions
              SliverToBoxAdapter(child: _buildQuickActions()),

              // Recent games section title
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Text(
                    'Recent Games',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              // Games grid
              Consumer<GamesProvider>(
                builder: (context, games, _) {
                  if (games.isLoading && games.games.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: LoadingGrid(),
                      ),
                    );
                  }

                  if (games.error != null && games.games.isEmpty) {
                    return SliverToBoxAdapter(
                      child: ErrorDisplay(
                        message: games.error!,
                        onRetry: () => games.fetchGames(
                          sort: 'release_date',
                          refresh: true,
                        ),
                      ),
                    );
                  }

                  if (games.games.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: EmptyState(
                        title: 'No games yet',
                        subtitle: 'Games will appear here once added.',
                        icon: Icons.gamepad_outlined,
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.58,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final game = games.games[index];
                          return GameCard(
                            game: game,
                            onTap: () => Navigator.pushNamed(
                              context,
                              '/game-detail',
                              arguments: game.id,
                            ),
                          );
                        },
                        childCount: games.games.length.clamp(0, 10),
                      ),
                    ),
                  );
                },
              ),

              // "See all" button
              SliverToBoxAdapter(
                child: Consumer<GamesProvider>(
                  builder: (context, games, _) {
                    if (games.games.length <= 10) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.all(20),
                      child: Center(
                        child: TextButton(
                          onPressed: () {
                            // Switch to games tab
                          },
                          child: const Text('View all games →'),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    auth.user?.initials ?? 'GV',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.isAuthenticated
                          ? 'Welcome back,'
                          : 'Welcome to',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 13,
                      ),
                    ),
                    if (auth.isAuthenticated)
                      Text(
                        auth.user?.name ?? 'Player',
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    else
                      ShaderMask(
                        shaderCallback: (bounds) =>
                            AppTheme.accentGradient.createShader(bounds),
                        child: const Text(
                          'GameVault',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (!auth.isAuthenticated)
                OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, '/login'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primaryColor),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Sign In', style: TextStyle(fontSize: 13)),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStats() {
    return Consumer<UserDataProvider>(
      builder: (context, userData, _) {
        final stats = userData.stats;
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Row(
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
                  icon: Icons.play_circle,
                  value: stats.playing.toString(),
                  label: 'Playing',
                  iconColor: AppTheme.accentCyan,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(
                  icon: Icons.check_circle,
                  value: stats.completed.toString(),
                  label: 'Done',
                  iconColor: AppTheme.successColor,
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
        );
      },
    );
  }

  Widget _buildQuickActions() {
    final auth = context.watch<AuthProvider>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _quickAction(
            'Browse',
            Icons.explore_outlined,
            () => Navigator.pushNamed(context, '/games'),
          ),
          if (auth.isAuthenticated) ...[
            _quickAction(
              'Wishlist',
              Icons.favorite_border,
              () => Navigator.pushNamed(context, '/wishlist'),
            ),
            _quickAction(
              'Playing',
              Icons.play_circle_outline,
              () => Navigator.pushNamed(context, '/playing-now'),
            ),
            _quickAction(
              'Completed',
              Icons.check_circle_outline,
              () => Navigator.pushNamed(context, '/completed'),
            ),
          ],
          _quickAction(
            'GOTY',
            Icons.emoji_events_outlined,
            () => Navigator.pushNamed(context, '/games'),
          ),
        ],
      ),
    );
  }

  Widget _quickAction(String label, IconData icon, VoidCallback onTap) {
    return Material(
      color: AppTheme.cardColor,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: AppTheme.primaryColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
