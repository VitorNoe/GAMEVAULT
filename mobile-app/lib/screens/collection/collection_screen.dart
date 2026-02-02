import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';

/// Collection screen
class CollectionScreen extends StatefulWidget {
  const CollectionScreen({super.key});

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserDataProvider>().fetchCollection(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Collection'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.library_books,
                    size: 80,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sign in to view your collection',
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
              if (userData.isLoadingCollection) {
                return const LoadingIndicator(
                  message: 'Loading collection...',
                );
              }

              if (userData.error != null && userData.collection.isEmpty) {
                return ErrorDisplay(
                  message: userData.error!,
                  onRetry: () => userData.fetchCollection(refresh: true),
                );
              }

              if (userData.collection.isEmpty) {
                return EmptyState(
                  title: 'No games in collection',
                  subtitle: 'Start adding games to your collection',
                  icon: Icons.library_books_outlined,
                  action: PrimaryButton(
                    text: 'Browse Games',
                    isFullWidth: false,
                    onPressed: () => Navigator.pushNamed(context, '/games'),
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  await userData.fetchCollection(refresh: true);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: userData.collection.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final game = userData.collection[index];
                    return Dismissible(
                      key: Key('collection_${game.id}'),
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
                            title: const Text('Remove from Collection'),
                            content: Text(
                              'Remove "${game.title}" from your collection?',
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
                        userData.removeFromCollection(game.id);
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
