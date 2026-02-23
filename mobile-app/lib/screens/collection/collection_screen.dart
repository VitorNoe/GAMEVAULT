import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/badges.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/games/game_card.dart';

class CollectionScreen extends StatefulWidget {
  const CollectionScreen({super.key});

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  String? _statusFilter;

  static const _filters = <String, String?>{
    'All': null,
    'Playing': 'playing',
    'Completed': 'completed',
    'Backlog': 'backlog',
    'Paused': 'paused',
    'Not Started': 'not_started',
  };

  @override
  void initState() {
    super.initState();
    _loadCollection();
  }

  void _loadCollection() {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      final userData = context.read<UserDataProvider>();
      userData.fetchCollection(status: _statusFilter);
      userData.fetchStats();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        body: EmptyState(
          title: 'Sign in to view your collection',
          subtitle: 'Track the games you own and your progress.',
          icon: Icons.lock_outline,
          actionLabel: 'Sign In',
          onAction: () => Navigator.pushNamed(context, '/login'),
        ),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primaryColor,
          backgroundColor: AppTheme.cardColor,
          onRefresh: () async => _loadCollection(),
          child: CustomScrollView(
            slivers: [
              // Header
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text(
                    'My Collection',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              // Stats row
              SliverToBoxAdapter(child: _buildStatsRow()),

              // Filters
              SliverToBoxAdapter(child: _buildFilters()),

              // Collection list
              Consumer<UserDataProvider>(
                builder: (context, userData, _) {
                  if (userData.isLoading && userData.collection.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: LoadingGrid(itemCount: 4),
                      ),
                    );
                  }

                  if (userData.error != null && userData.collection.isEmpty) {
                    return SliverToBoxAdapter(
                      child: ErrorDisplay(
                        message: userData.error!,
                        onRetry: _loadCollection,
                      ),
                    );
                  }

                  final items = userData.collection;
                  if (items.isEmpty) {
                    return SliverToBoxAdapter(
                      child: EmptyState(
                        title: _statusFilter != null
                            ? 'No ${AppTheme.statusLabel(_statusFilter!).toLowerCase()} games'
                            : 'Your collection is empty',
                        subtitle: 'Browse games and add them to your collection.',
                        icon: Icons.library_add_outlined,
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = items[index];
                          final game = item.game;
                          if (game == null) return const SizedBox.shrink();

                          return Dismissible(
                            key: Key('collection_${item.id}'),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              margin: const EdgeInsets.only(bottom: 10),
                              decoration: BoxDecoration(
                                color: AppTheme.errorColor.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.delete_outline,
                                  color: AppTheme.errorColor),
                            ),
                            confirmDismiss: (direction) async {
                              return await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  backgroundColor: AppTheme.surfaceColor,
                                  title: const Text('Remove Game'),
                                  content: Text(
                                      'Remove "${game.title}" from your collection?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(ctx, false),
                                      child: const Text('Cancel'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(ctx, true),
                                      child: const Text('Remove',
                                          style: TextStyle(
                                              color: AppTheme.errorColor)),
                                    ),
                                  ],
                                ),
                              );
                            },
                            onDismissed: (_) {
                              userData.removeFromCollection(item.gameId);
                            },
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: GameListTile(
                                game: game,
                                subtitle:
                                    '${AppTheme.statusLabel(item.status)} • ${item.hoursPlayed}h played',
                                trailing: StatusBadge(status: item.status),
                                onTap: () => Navigator.pushNamed(
                                  context,
                                  '/game-detail',
                                  arguments: game.id,
                                ),
                              ),
                            ),
                          );
                        },
                        childCount: items.length,
                      ),
                    ),
                  );
                },
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return Consumer<UserDataProvider>(
      builder: (context, userData, _) {
        final stats = userData.stats;
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          child: Row(
            children: [
              Expanded(
                child: StatCard(
                  icon: Icons.videogame_asset,
                  value: stats.total.toString(),
                  label: 'Total',
                  iconColor: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatCard(
                  icon: Icons.play_circle,
                  value: stats.playing.toString(),
                  label: 'Playing',
                  iconColor: AppTheme.accentCyan,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: StatCard(
                  icon: Icons.check_circle,
                  value: stats.completed.toString(),
                  label: 'Done',
                  iconColor: AppTheme.successColor,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilters() {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: _filters.entries.map((entry) {
          final isActive = _statusFilter == entry.value;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(entry.key),
              selected: isActive,
              onSelected: (_) {
                setState(() => _statusFilter = entry.value);
                context
                    .read<UserDataProvider>()
                    .fetchCollection(status: entry.value);
              },
              backgroundColor: AppTheme.cardColor,
              selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
              labelStyle: TextStyle(
                color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
                fontSize: 13,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
              side: BorderSide(
                color: isActive
                    ? AppTheme.primaryColor.withValues(alpha: 0.5)
                    : AppTheme.borderColor,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              showCheckmark: false,
              padding: const EdgeInsets.symmetric(horizontal: 4),
            ),
          );
        }).toList(),
      ),
    );
  }
}
