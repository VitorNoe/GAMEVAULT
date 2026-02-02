import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';
import '../../widgets/common/inputs.dart';

/// Games list screen with filters
class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  String? _selectedReleaseStatus;
  String? _selectedAvailabilityStatus;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamesProvider>().fetchGames(refresh: true);
    });
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

  void _applyFilters() {
    context.read<GamesProvider>().fetchGames(
          refresh: true,
          search: _searchController.text.isNotEmpty
              ? _searchController.text
              : null,
          releaseStatus: _selectedReleaseStatus,
          availabilityStatus: _selectedAvailabilityStatus,
        );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _FilterSheet(
        selectedReleaseStatus: _selectedReleaseStatus,
        selectedAvailabilityStatus: _selectedAvailabilityStatus,
        onApply: (releaseStatus, availabilityStatus) {
          setState(() {
            _selectedReleaseStatus = releaseStatus;
            _selectedAvailabilityStatus = availabilityStatus;
          });
          _applyFilters();
          Navigator.pop(context);
        },
        onClear: () {
          setState(() {
            _selectedReleaseStatus = null;
            _selectedAvailabilityStatus = null;
          });
          _applyFilters();
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Games'),
        actions: [
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.filter_list),
                if (_selectedReleaseStatus != null ||
                    _selectedAvailabilityStatus != null)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(
              controller: _searchController,
              hint: 'Search games...',
              onSubmitted: (_) => _applyFilters(),
              onClear: () {
                _searchController.clear();
                _applyFilters();
              },
            ),
          ),

          // Games list
          Expanded(
            child: Consumer<GamesProvider>(
              builder: (context, gamesProvider, _) {
                if (gamesProvider.isLoading && gamesProvider.games.isEmpty) {
                  return const LoadingIndicator(message: 'Loading games...');
                }

                if (gamesProvider.error != null &&
                    gamesProvider.games.isEmpty) {
                  return ErrorDisplay(
                    message: gamesProvider.error!,
                    onRetry: () => gamesProvider.fetchGames(refresh: true),
                  );
                }

                if (gamesProvider.games.isEmpty) {
                  return const EmptyState(
                    title: 'No games found',
                    subtitle: 'Try adjusting your filters',
                    icon: Icons.games_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    await gamesProvider.fetchGames(refresh: true);
                  },
                  child: ListView.separated(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: gamesProvider.games.length +
                        (gamesProvider.hasMore ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      if (index >= gamesProvider.games.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: LoadingIndicator(),
                        );
                      }

                      final game = gamesProvider.games[index];
                      return GameListTile(
                        game: game,
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/game/${game.id}',
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Filter bottom sheet
class _FilterSheet extends StatefulWidget {
  final String? selectedReleaseStatus;
  final String? selectedAvailabilityStatus;
  final Function(String?, String?) onApply;
  final VoidCallback onClear;

  const _FilterSheet({
    this.selectedReleaseStatus,
    this.selectedAvailabilityStatus,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  String? _releaseStatus;
  String? _availabilityStatus;

  final List<Map<String, String>> _releaseStatuses = [
    {'value': 'released', 'label': 'Released'},
    {'value': 'early_access', 'label': 'Early Access'},
    {'value': 'coming_soon', 'label': 'Coming Soon'},
    {'value': 'in_development', 'label': 'In Development'},
    {'value': 'cancelled', 'label': 'Cancelled'},
  ];

  final List<Map<String, String>> _availabilityStatuses = [
    {'value': 'available', 'label': 'Available'},
    {'value': 'out_of_catalog', 'label': 'Out of Catalog'},
    {'value': 'abandonware', 'label': 'Abandonware'},
    {'value': 'discontinued', 'label': 'Discontinued'},
  ];

  @override
  void initState() {
    super.initState();
    _releaseStatus = widget.selectedReleaseStatus;
    _availabilityStatus = widget.selectedAvailabilityStatus;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filters',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              TextButton(
                onPressed: widget.onClear,
                child: const Text('Clear All'),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Release Status
          Text(
            'Release Status',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _releaseStatuses.map((status) {
              final isSelected = _releaseStatus == status['value'];
              return FilterChip(
                label: Text(status['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _releaseStatus = selected ? status['value'] : null;
                  });
                },
                selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                checkmarkColor: AppTheme.primaryColor,
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Availability Status
          Text(
            'Availability',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availabilityStatuses.map((status) {
              final isSelected = _availabilityStatus == status['value'];
              return FilterChip(
                label: Text(status['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _availabilityStatus = selected ? status['value'] : null;
                  });
                },
                selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                checkmarkColor: AppTheme.primaryColor,
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                widget.onApply(_releaseStatus, _availabilityStatus);
              },
              child: const Text('Apply Filters'),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
