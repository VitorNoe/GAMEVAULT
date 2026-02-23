import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../providers/games_provider.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';
import '../../widgets/games/game_card.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  String? _selectedFilter;

  static const _filters = <String, String>{
    'All': '',
    'Released': 'released',
    'Coming Soon': 'coming_soon',
    'Early Access': 'early_access',
    'In Dev': 'in_development',
  };

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    final games = context.read<GamesProvider>();
    if (games.games.isEmpty) {
      games.fetchGames();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<GamesProvider>().loadMore();
    }
  }

  void _onFilterChanged(String? filter) {
    setState(() => _selectedFilter = filter);
    context.read<GamesProvider>().fetchGames(
          releaseStatus: filter,
          search: _searchController.text.isNotEmpty
              ? _searchController.text
              : null,
          refresh: true,
        );
  }

  void _onSearch(String query) {
    context.read<GamesProvider>().fetchGames(
          search: query.isNotEmpty ? query : null,
          releaseStatus: _selectedFilter,
          refresh: true,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Browse Games',
                      style: TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Consumer<GamesProvider>(
                    builder: (context, games, _) {
                      return Text(
                        '${games.totalGames} games',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Search
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SearchField(
                controller: _searchController,
                hint: 'Search games...',
                onSubmitted: _onSearch,
                onClear: () => _onSearch(''),
              ),
            ),
            const SizedBox(height: 12),

            // Filters
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: _filters.entries.map((entry) {
                  final isActive = _selectedFilter == (entry.value.isEmpty ? null : entry.value);
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(entry.key),
                      selected: isActive,
                      onSelected: (_) => _onFilterChanged(
                        entry.value.isEmpty ? null : entry.value,
                      ),
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
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      showCheckmark: false,
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),

            // Games grid
            Expanded(
              child: Consumer<GamesProvider>(
                builder: (context, games, _) {
                  if (games.isLoading && games.games.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: LoadingGrid(),
                    );
                  }

                  if (games.error != null && games.games.isEmpty) {
                    return ErrorDisplay(
                      message: games.error!,
                      onRetry: () => games.fetchGames(refresh: true),
                    );
                  }

                  if (games.games.isEmpty) {
                    return const EmptyState(
                      title: 'No games found',
                      subtitle: 'Try adjusting your search or filters.',
                      icon: Icons.search_off,
                    );
                  }

                  return GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.58,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: games.games.length + (games.isLoadingMore ? 2 : 0),
                    itemBuilder: (context, index) {
                      if (index >= games.games.length) {
                        return const ShimmerCard(
                          borderRadius:
                              BorderRadius.all(Radius.circular(14)),
                        );
                      }
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
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
