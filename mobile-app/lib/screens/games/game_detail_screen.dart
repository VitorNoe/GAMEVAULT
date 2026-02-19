import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../models/game.dart';
import '../../providers/auth_provider.dart';
import '../../providers/games_provider.dart';
import '../../providers/user_data_provider.dart';
import '../../widgets/common/badges.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/glass_container.dart';
import '../../widgets/common/loading.dart';
import '../../widgets/common/error_display.dart';

class GameDetailScreen extends StatefulWidget {
  final int gameId;

  const GameDetailScreen({super.key, required this.gameId});

  @override
  State<GameDetailScreen> createState() => _GameDetailScreenState();
}

class _GameDetailScreenState extends State<GameDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<GamesProvider>().getGameById(widget.gameId);
  }

  @override
  void dispose() {
    context.read<GamesProvider>().clearSelectedGame();
    super.dispose();
  }

  Future<void> _launchTrailer(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showAddToCollectionSheet(Game game) {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.pushNamed(context, '/login');
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _CollectionBottomSheet(gameId: game.id),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<GamesProvider>(
        builder: (context, games, _) {
          if (games.isLoading || games.selectedGame == null) {
            return const LoadingIndicator(message: 'Loading game...');
          }

          if (games.error != null) {
            return ErrorDisplay(
              message: games.error!,
              onRetry: () => games.getGameById(widget.gameId),
            );
          }

          final game = games.selectedGame!;
          return CustomScrollView(
            slivers: [
              // Hero cover
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                backgroundColor: AppTheme.backgroundColor,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.arrow_back, size: 20),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Cover image
                      if (game.bannerUrl != null || game.coverUrl != null)
                        CachedNetworkImage(
                          imageUrl: game.bannerUrl ?? game.coverUrl!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: AppTheme.surfaceColor,
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: AppTheme.surfaceColor,
                            child: const Icon(Icons.gamepad,
                                color: AppTheme.textMuted, size: 48),
                          ),
                        )
                      else
                        Container(
                          color: AppTheme.surfaceColor,
                          child: const Icon(Icons.gamepad,
                              color: AppTheme.textMuted, size: 48),
                        ),
                      // Gradient overlay
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.transparent,
                              AppTheme.backgroundColor,
                            ],
                            stops: [0.0, 0.5, 1.0],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        game.title,
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Badges row
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ReleaseStatusBadge(
                              status: game.releaseStatus.apiValue),
                          if (game.releaseYear != null)
                            YearBadge(year: game.releaseYear!),
                          if (game.metacriticScore != null)
                            MetacriticBadge(
                                score: game.metacriticScore!, size: 28),
                          if (game.averageRating != null)
                            RatingBadge(rating: game.averageRating!),
                          if (game.ageRating != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.cardColor,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                game.ageRating!,
                                style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Action buttons
                      _buildActionButtons(game),
                      const SizedBox(height: 24),

                      // Info cards
                      _buildInfoSection(game),
                      const SizedBox(height: 20),

                      // Synopsis
                      if (game.synopsis != null &&
                          game.synopsis!.isNotEmpty) ...[
                        const Text(
                          'Synopsis',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          game.synopsis!,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Description
                      if (game.description != null &&
                          game.description!.isNotEmpty) ...[
                        const Text(
                          'About',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          game.description!,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Tags
                      if (game.tagList.isNotEmpty) ...[
                        const Text(
                          'Tags',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: game.tagList.map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.cardColor,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppTheme.borderColor.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                tag,
                                style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Genres
                      if (game.genreList.isNotEmpty) ...[
                        const Text(
                          'Genres',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: game.genreList.map((genre) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppTheme.primaryColor.withValues(alpha: 0.2),
                                ),
                              ),
                              child: Text(
                                genre,
                                style: const TextStyle(
                                  color: AppTheme.primaryColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Platforms
                      if (game.platformList.isNotEmpty) ...[
                        const Text(
                          'Platforms',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: game.platformList.map((platform) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.accentCyan.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppTheme.accentCyan.withValues(alpha: 0.2),
                                ),
                              ),
                              child: Text(
                                platform,
                                style: const TextStyle(
                                  color: AppTheme.accentCyan,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActionButtons(Game game) {
    final auth = context.watch<AuthProvider>();
    final userData = context.watch<UserDataProvider>();
    final isAuthenticated = auth.isAuthenticated;
    final inWishlist = isAuthenticated && userData.isInWishlist(game.id);
    final inPlaying = isAuthenticated && userData.isPlaying(game.id);
    final inCompleted = isAuthenticated && userData.isCompleted(game.id);
    final inCollection = isAuthenticated && userData.isInCollection(game.id);
    final currentStatus = isAuthenticated ? userData.getGameStatus(game.id) : null;

    return Column(
      children: [
        // Current status indicator
        if (currentStatus != null) ...[
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            borderColor: AppTheme.statusColor(currentStatus).withValues(alpha: 0.4),
            child: Row(
              children: [
                Icon(
                  AppTheme.statusIcon(currentStatus),
                  color: AppTheme.statusColor(currentStatus),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  'In your collection as: ${AppTheme.statusLabel(currentStatus)}',
                  style: TextStyle(
                    color: AppTheme.statusColor(currentStatus),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => _showAddToCollectionSheet(game),
                  child: const Icon(Icons.edit, color: AppTheme.textMuted, size: 18),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Main action buttons row
        Row(
          children: [
            Expanded(
              child: PrimaryButton(
                text: inCollection ? 'Update Status' : 'Add to Collection',
                icon: inCollection ? Icons.edit : Icons.add,
                height: 46,
                onPressed: () => _showAddToCollectionSheet(game),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _WishlistButton(
                isInWishlist: inWishlist,
                onPressed: () async {
                  if (!isAuthenticated) {
                    Navigator.pushNamed(context, '/login');
                    return;
                  }
                  final success = await userData.toggleWishlist(game.id);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          inWishlist ? 'Removed from wishlist' : 'Added to wishlist!',
                        ),
                      ),
                    );
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Quick status buttons
        Row(
          children: [
            Expanded(
              child: _QuickStatusButton(
                text: 'Playing',
                icon: Icons.play_circle_outline,
                activeIcon: Icons.play_circle,
                isActive: inPlaying,
                activeColor: AppTheme.accentCyan,
                onPressed: () async {
                  if (!isAuthenticated) {
                    Navigator.pushNamed(context, '/login');
                    return;
                  }
                  final success = await userData.setAsPlaying(game.id);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Marked as Playing Now!')),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _QuickStatusButton(
                text: 'Completed',
                icon: Icons.check_circle_outline,
                activeIcon: Icons.check_circle,
                isActive: inCompleted,
                activeColor: AppTheme.successColor,
                onPressed: () async {
                  if (!isAuthenticated) {
                    Navigator.pushNamed(context, '/login');
                    return;
                  }
                  final success = await userData.setAsCompleted(game.id);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Marked as Completed!')),
                    );
                  }
                },
              ),
            ),
          ],
        ),

        if (game.trailerUrl != null && game.trailerUrl!.isNotEmpty) ...[
          const SizedBox(height: 10),
          SecondaryButton(
            text: 'Watch Trailer',
            icon: Icons.play_circle_outline,
            onPressed: () => _launchTrailer(game.trailerUrl!),
          ),
        ],
      ],
    );
  }

  Widget _buildInfoSection(Game game) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (game.developerName != null)
            _infoRow('Developer', game.developerName!),
          if (game.publisherName != null) ...[
            if (game.developerName != null)
              Divider(color: AppTheme.borderColor.withValues(alpha: 0.3), height: 20),
            _infoRow('Publisher', game.publisherName!),
          ],
          if (game.releaseDate != null) ...[
            Divider(color: AppTheme.borderColor.withValues(alpha: 0.3), height: 20),
            _infoRow('Release Date', game.releaseDate!),
          ],
          if (game.availabilityStatus != AvailabilityStatus.available) ...[
            Divider(color: AppTheme.borderColor.withValues(alpha: 0.3), height: 20),
            _infoRow('Availability', game.availabilityStatus.label),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 13,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom sheet for selecting collection status.
class _CollectionBottomSheet extends StatelessWidget {
  final int gameId;

  const _CollectionBottomSheet({required this.gameId});

  @override
  Widget build(BuildContext context) {
    final statuses = [
      ('playing', 'Playing Now', Icons.play_circle_outline, AppTheme.accentCyan),
      ('completed', 'Completed', Icons.check_circle_outline, AppTheme.successColor),
      ('not_started', 'Not Started', Icons.radio_button_unchecked, AppTheme.textMuted),
      ('backlog', 'Backlog', Icons.inventory_2_outlined, AppTheme.secondaryColor),
      ('paused', 'Paused', Icons.pause_circle_outline, AppTheme.warningColor),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
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
            'Add to Collection',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Choose the status for this game:',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
          ),
          const SizedBox(height: 16),
          ...statuses.map((s) {
            return ListTile(
              leading: Icon(s.$3, color: s.$4),
              title: Text(
                s.$2,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              onTap: () async {
                Navigator.pop(context);
                final userData = context.read<UserDataProvider>();
                final success = await userData.addToCollection(
                  gameId: gameId,
                  status: s.$1,
                );
                if (success && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Added as "${s.$2}"')),
                  );
                }
              },
            );
          }),
        ],
      ),
    );
  }
}

/// Wishlist toggle button with animated state.
class _WishlistButton extends StatelessWidget {
  final bool isInWishlist;
  final VoidCallback onPressed;

  const _WishlistButton({
    required this.isInWishlist,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isInWishlist
                ? AppTheme.accentPink
                : AppTheme.accentPink.withValues(alpha: 0.5),
          ),
          backgroundColor: isInWishlist
              ? AppTheme.accentPink.withValues(alpha: 0.15)
              : Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isInWishlist ? Icons.favorite : Icons.favorite_border,
              size: 20,
              color: AppTheme.accentPink,
            ),
            const SizedBox(width: 8),
            Text(
              isInWishlist ? 'In Wishlist' : 'Wishlist',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.accentPink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Quick status toggle button.
class _QuickStatusButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final IconData activeIcon;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onPressed;

  const _QuickStatusButton({
    required this.text,
    required this.icon,
    required this.activeIcon,
    required this.isActive,
    required this.activeColor,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isActive
                ? activeColor
                : AppTheme.borderColor,
          ),
          backgroundColor: isActive
              ? activeColor.withValues(alpha: 0.15)
              : Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 18,
              color: isActive ? activeColor : AppTheme.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              text,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? activeColor : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
