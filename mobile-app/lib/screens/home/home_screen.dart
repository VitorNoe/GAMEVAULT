import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';
import '../../widgets/common/inputs.dart';

/// Home screen with featured games and quick access
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamesProvider>().fetchGames(refresh: true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await context.read<GamesProvider>().fetchGames(refresh: true);
          },
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'GameVault',
                                style: Theme.of(context)
                                    .textTheme
                                    .displaySmall
                                    ?.copyWith(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Discover & Preserve Games',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                          Consumer<AuthProvider>(
                            builder: (context, auth, _) {
                              if (auth.isAuthenticated) {
                                return CircleAvatar(
                                  backgroundColor: AppTheme.primaryColor,
                                  child: Text(
                                    auth.user?.name.substring(0, 1).toUpperCase() ?? 'U',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Search
                      SearchField(
                        controller: _searchController,
                        hint: 'Search games...',
                        onChanged: (query) {
                          if (query.isNotEmpty) {
                            context.read<GamesProvider>().searchGames(query);
                          } else {
                            context.read<GamesProvider>().clearSearch();
                          }
                        },
                        onClear: () {
                          context.read<GamesProvider>().clearSearch();
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // Search Results or Games Grid
              Consumer<GamesProvider>(
                builder: (context, gamesProvider, _) {
                  // Show search results
                  if (_searchController.text.isNotEmpty) {
                    if (gamesProvider.isSearching) {
                      return const SliverFillRemaining(
                        child: LoadingIndicator(message: 'Searching...'),
                      );
                    }

                    if (gamesProvider.searchResults.isEmpty) {
                      return const SliverFillRemaining(
                        child: EmptyState(
                          title: 'No games found',
                          subtitle: 'Try a different search term',
                          icon: Icons.search_off,
                        ),
                      );
                    }

                    return SliverPadding(
                      padding: const EdgeInsets.all(16),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: 0.65,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final game = gamesProvider.searchResults[index];
                            return GameCard(
                              game: game,
                              onTap: () {
                                Navigator.pushNamed(
                                  context,
                                  '/game/${game.id}',
                                );
                              },
                            );
                          },
                          childCount: gamesProvider.searchResults.length,
                        ),
                      ),
                    );
                  }

                  // Show games
                  if (gamesProvider.isLoading && gamesProvider.games.isEmpty) {
                    return const SliverFillRemaining(
                      child: LoadingIndicator(message: 'Loading games...'),
                    );
                  }

                  if (gamesProvider.error != null &&
                      gamesProvider.games.isEmpty) {
                    return SliverFillRemaining(
                      child: ErrorDisplay(
                        message: gamesProvider.error!,
                        onRetry: () {
                          gamesProvider.fetchGames(refresh: true);
                        },
                      ),
                    );
                  }

                  if (gamesProvider.games.isEmpty) {
                    return const SliverFillRemaining(
                      child: EmptyState(
                        title: 'No games yet',
                        subtitle: 'Games will appear here',
                        icon: Icons.games_outlined,
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 0.65,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final game = gamesProvider.games[index];
                          return GameCard(
                            game: game,
                            onTap: () {
                              Navigator.pushNamed(
                                context,
                                '/game/${game.id}',
                              );
                            },
                          );
                        },
                        childCount: gamesProvider.games.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
