import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/games/game_card.dart';

class CompletedGamesScreen extends StatefulWidget {
  const CompletedGamesScreen({super.key});

  @override
  State<CompletedGamesScreen> createState() => _CompletedGamesScreenState();
}

class _CompletedGamesScreenState extends State<CompletedGamesScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCompleted();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadCompleted() {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      context.read<UserDataProvider>().fetchCompletedGames();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Completed Games')),
        body: EmptyState(
          title: 'Sign in to view completed games',
          subtitle: 'Track all the games you\'ve beaten.',
          icon: Icons.check_circle_outline,
          actionLabel: 'Sign In',
          onAction: () => Navigator.pushNamed(context, '/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Completed Games'),
        actions: [
          Consumer<UserDataProvider>(
            builder: (context, userData, _) {
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(
                  child: Text(
                    '${userData.completedGames.length} games',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryColor,
        backgroundColor: AppTheme.cardColor,
        onRefresh: () async => _loadCompleted(),
        child: Consumer<UserDataProvider>(
          builder: (context, userData, _) {
            if (userData.isLoadingCompleted && userData.completedGames.isEmpty) {
              return const LoadingIndicator(message: 'Loading completed games...');
            }

            if (userData.error != null && userData.completedGames.isEmpty) {
              return ErrorDisplay(
                message: userData.error!,
                onRetry: _loadCompleted,
              );
            }

            if (userData.completedGames.isEmpty) {
              return const EmptyState(
                title: 'No completed games yet',
                subtitle: 'Browse games and mark them as completed!',
                icon: Icons.check_circle_outline,
              );
            }

            final filteredItems = userData.completedGames.where((item) {
              if (_searchQuery.isEmpty) return true;
              final game = item.game;
              if (game == null) return false;
              return game.title.toLowerCase().contains(_searchQuery.toLowerCase());
            }).toList();

            return Column(
              children: [
                // Search bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _searchQuery = value),
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Search completed games...',
                      prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted, size: 22),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, color: AppTheme.textMuted, size: 20),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppTheme.cardColor,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.borderColor),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.borderColor),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
                      ),
                    ),
                  ),
                ),

                // Stats summary
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _statItem(
                          icon: Icons.check_circle,
                          value: '${userData.completedGames.length}',
                          label: 'Completed',
                          color: AppTheme.successColor,
                        ),
                        Container(
                          width: 1,
                          height: 30,
                          color: AppTheme.borderColor.withValues(alpha: 0.3),
                        ),
                        _statItem(
                          icon: Icons.emoji_events,
                          value: '${userData.completedGames.where((i) => i.game?.metacriticScore != null && i.game!.metacriticScore! >= 90).length}',
                          label: 'Top Rated',
                          color: AppTheme.warningColor,
                        ),
                      ],
                    ),
                  ),
                ),

                // Games list
                Expanded(
                  child: filteredItems.isEmpty
                      ? const EmptyState(
                          title: 'No games found',
                          subtitle: 'Try a different search term.',
                          icon: Icons.search_off,
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: filteredItems.length,
                          itemBuilder: (context, index) {
                            final item = filteredItems[index];
                            final game = item.game;
                            if (game == null) return const SizedBox.shrink();

                            return Dismissible(
                              key: Key('completed_${item.id}'),
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
                                        'Remove "${game.title}" from completed?'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx, false),
                                        child: const Text('Cancel'),
                                      ),
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx, true),
                                        child: const Text('Remove',
                                            style: TextStyle(color: AppTheme.errorColor)),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              onDismissed: (_) {
                                userData.removeFromCollection(item.gameId);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Removed "${game.title}"'),
                                    action: SnackBarAction(
                                      label: 'Undo',
                                      onPressed: () => userData.setAsCompleted(game.id),
                                    ),
                                  ),
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: GameListTile(
                                  game: game,
                                  subtitle: item.rating != null
                                      ? '${item.hoursPlayed}h played • Rating: ${item.rating}/10'
                                      : '${item.hoursPlayed}h played',
                                  trailing: game.metacriticScore != null
                                      ? Container(
                                          width: 32,
                                          height: 32,
                                          alignment: Alignment.center,
                                          decoration: BoxDecoration(
                                            color: AppTheme.metacriticColor(game.metacriticScore)
                                                .withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(
                                              color: AppTheme.metacriticColor(game.metacriticScore)
                                                  .withValues(alpha: 0.5),
                                            ),
                                          ),
                                          child: Text(
                                            '${game.metacriticScore}',
                                            style: TextStyle(
                                              color: AppTheme.metacriticColor(game.metacriticScore),
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        )
                                      : const Icon(Icons.check_circle,
                                          color: AppTheme.successColor, size: 22),
                                  onTap: () => Navigator.pushNamed(
                                    context,
                                    '/game-detail',
                                    arguments: game.id,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _statItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.textMuted,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
