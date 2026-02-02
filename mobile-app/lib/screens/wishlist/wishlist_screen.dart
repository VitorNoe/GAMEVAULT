import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';

/// Wishlist screen
class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserDataProvider>().fetchWishlist(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wishlist'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.favorite_border,
                    size: 80,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sign in to view your wishlist',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    text: 'Sign In',
                    isFullWidth: false,
                    onPressed: () => Navigator.pushNamed(context, '/login'),
                  ),
                ],
              ),
            );
          }

          return Consumer<UserDataProvider>(
            builder: (context, userData, _) {
              if (userData.isLoadingWishlist) {
                return const LoadingIndicator(
                  message: 'Loading wishlist...',
                );
              }

              if (userData.error != null && userData.wishlist.isEmpty) {
                return ErrorDisplay(
                  message: userData.error!,
                  onRetry: () => userData.fetchWishlist(refresh: true),
                );
              }

              if (userData.wishlist.isEmpty) {
                return EmptyState(
                  title: 'Wishlist is empty',
                  subtitle: 'Save games you want to play later',
                  icon: Icons.favorite_border,
                  action: PrimaryButton(
                    text: 'Browse Games',
                    isFullWidth: false,
                    onPressed: () => Navigator.pushNamed(context, '/games'),
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  await userData.fetchWishlist(refresh: true);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: userData.wishlist.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final game = userData.wishlist[index];
                    return Dismissible(
                      key: Key('wishlist_${game.id}'),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: AppTheme.errorColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.delete,
                          color: Colors.white,
                        ),
                      ),
                      confirmDismiss: (direction) async {
                        return await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            backgroundColor: AppTheme.cardColor,
                            title: const Text('Remove from Wishlist'),
                            content: Text(
                              'Remove "${game.title}" from your wishlist?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text(
                                  'Remove',
                                  style: TextStyle(color: AppTheme.errorColor),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                      onDismissed: (_) {
                        userData.removeFromWishlist(game.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${game.title} removed'),
                          ),
                        );
                      },
                      child: GameListTile(
                        game: game,
                        onTap: () {
                          Navigator.pushNamed(context, '/game/${game.id}');
                        },
                        trailing: IconButton(
                          icon: const Icon(
                            Icons.add,
                            color: AppTheme.primaryColor,
                          ),
                          onPressed: () async {
                            final success =
                                await userData.addToCollection(game.id);
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '${game.title} added to collection',
                                  ),
                                ),
                              );
                            }
                          },
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
