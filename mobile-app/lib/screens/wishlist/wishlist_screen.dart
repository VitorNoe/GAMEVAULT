import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/games/game_card.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  void _loadWishlist() {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      context.read<UserDataProvider>().fetchWishlist();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Wishlist')),
        body: EmptyState(
          title: 'Sign in to view your wishlist',
          subtitle: 'Save games you want to play.',
          icon: Icons.favorite_border,
          actionLabel: 'Sign In',
          onAction: () => Navigator.pushNamed(context, '/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wishlist'),
        actions: [
          Consumer<UserDataProvider>(
            builder: (context, userData, _) {
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Center(
                  child: Text(
                    '${userData.wishlist.length} games',
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
        onRefresh: () async => _loadWishlist(),
        child: Consumer<UserDataProvider>(
          builder: (context, userData, _) {
            if (userData.isLoading && userData.wishlist.isEmpty) {
              return const LoadingIndicator(message: 'Loading wishlist...');
            }

            if (userData.error != null && userData.wishlist.isEmpty) {
              return ErrorDisplay(
                message: userData.error!,
                onRetry: _loadWishlist,
              );
            }

            if (userData.wishlist.isEmpty) {
              return const EmptyState(
                title: 'Your wishlist is empty',
                subtitle: 'Browse games and tap the heart icon to add them.',
                icon: Icons.favorite_border,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: userData.wishlist.length,
              itemBuilder: (context, index) {
                final item = userData.wishlist[index];
                final game = item.game;
                if (game == null) return const SizedBox.shrink();

                return Dismissible(
                  key: Key('wishlist_${item.id}'),
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
                  onDismissed: (_) {
                    userData.removeFromCollection(item.gameId);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Removed "${game.title}" from wishlist'),
                        action: SnackBarAction(
                          label: 'Undo',
                          onPressed: () => userData.addToWishlist(game.id),
                        ),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GameListTile(
                      game: game,
                      trailing: IconButton(
                        icon: const Icon(Icons.add_circle_outline,
                            color: AppTheme.successColor, size: 22),
                        tooltip: 'Move to Collection',
                        onPressed: () => _showMoveToCollection(game.id),
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
            );
          },
        ),
      ),
    );
  }

  void _showMoveToCollection(int gameId) {
    final statuses = [
      ('playing', 'Playing Now', Icons.play_circle_outline, AppTheme.accentCyan),
      ('completed', 'Completed', Icons.check_circle_outline, AppTheme.successColor),
      ('not_started', 'Not Started', Icons.radio_button_unchecked, AppTheme.textMuted),
      ('backlog', 'Backlog', Icons.inventory_2_outlined, AppTheme.secondaryColor),
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
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
              'Move to Collection',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...statuses.map((s) {
              return ListTile(
                leading: Icon(s.$3, color: s.$4),
                title: Text(s.$2,
                    style: const TextStyle(color: AppTheme.textPrimary)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                onTap: () async {
                  Navigator.pop(ctx);
                  final userData = context.read<UserDataProvider>();
                  await userData.updateCollectionItem(
                    gameId: gameId,
                    status: s.$1,
                  );
                  await userData.fetchWishlist();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Moved to "${s.$2}"')),
                    );
                  }
                },
              );
            }),
          ],
        ),
      ),
    );
  }
}
