import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/games/game_card.dart';

class PlayingNowScreen extends StatefulWidget {
  const PlayingNowScreen({super.key});

  @override
  State<PlayingNowScreen> createState() => _PlayingNowScreenState();
}

class _PlayingNowScreenState extends State<PlayingNowScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadPlaying();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadPlaying() {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      context.read<UserDataProvider>().fetchPlayingNow();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Playing Now')),
        body: EmptyState(
          title: 'Sign in to view your games',
          subtitle: 'Track the games you\'re currently playing.',
          icon: Icons.play_circle_outline,
          actionLabel: 'Sign In',
          onAction: () => Navigator.pushNamed(context, '/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Playing Now'),
        actions: [
          Consumer<UserDataProvider>(
            builder: (context, userData, _) {
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(
                  child: Text(
                    '${userData.playingNow.length} games',
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
        onRefresh: () async => _loadPlaying(),
        child: Consumer<UserDataProvider>(
          builder: (context, userData, _) {
            if (userData.isLoadingPlaying && userData.playingNow.isEmpty) {
              return const LoadingIndicator(message: 'Loading playing games...');
            }

            if (userData.error != null && userData.playingNow.isEmpty) {
              return ErrorDisplay(
                message: userData.error!,
                onRetry: _loadPlaying,
              );
            }

            if (userData.playingNow.isEmpty) {
              return const EmptyState(
                title: 'No games currently playing',
                subtitle: 'Browse games and mark them as "Playing Now"!',
                icon: Icons.play_circle_outline,
              );
            }

            final filteredItems = userData.playingNow.where((item) {
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
                      hintText: 'Search playing games...',
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
                              key: Key('playing_${item.id}'),
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
                                        'Remove "${game.title}" from Playing Now?'),
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
                                      onPressed: () => userData.setAsPlaying(game.id),
                                    ),
                                  ),
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: GameListTile(
                                  game: game,
                                  subtitle: '${item.hoursPlayed}h played',
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.check_circle_outline,
                                            color: AppTheme.successColor, size: 22),
                                        tooltip: 'Mark as Completed',
                                        onPressed: () async {
                                          final success = await userData.setAsCompleted(game.id);
                                          if (success && context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text('"${game.title}" marked as completed!'),
                                              ),
                                            );
                                            _loadPlaying();
                                          }
                                        },
                                      ),
                                    ],
                                  ),
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
}
