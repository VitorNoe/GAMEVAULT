import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../models/game.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';

/// Game detail screen
class GameDetailScreen extends StatefulWidget {
  final int gameId;

  const GameDetailScreen({
    super.key,
    required this.gameId,
  });

  @override
  State<GameDetailScreen> createState() => _GameDetailScreenState();
}

class _GameDetailScreenState extends State<GameDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GamesProvider>().getGameById(widget.gameId);
    });
  }

  @override
  void dispose() {
    // Clear selected game when leaving
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<GamesProvider>().clearSelectedGame();
      }
    });
    super.dispose();
  }

  Future<void> _openTrailer(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<GamesProvider>(
        builder: (context, gamesProvider, _) {
          if (gamesProvider.isLoading) {
            return const LoadingIndicator(message: 'Loading game...');
          }

          if (gamesProvider.error != null) {
            return ErrorDisplay(
              message: gamesProvider.error!,
              onRetry: () {
                gamesProvider.getGameById(widget.gameId);
              },
            );
          }

          final game = gamesProvider.selectedGame;
          if (game == null) {
            return const EmptyState(
              title: 'Game not found',
              icon: Icons.error_outline,
            );
          }

          return CustomScrollView(
            slivers: [
              // Hero image with back button
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                backgroundColor: AppTheme.backgroundColor,
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: game.bannerUrl ?? game.displayCoverUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: AppTheme.surfaceColor,
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: AppTheme.surfaceColor,
                          child: const Icon(
                            Icons.gamepad_outlined,
                            size: 80,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ),
                      // Gradient overlay
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              AppTheme.backgroundColor.withOpacity(0.8),
                              AppTheme.backgroundColor,
                            ],
                            stops: const [0.3, 0.7, 1.0],
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
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and badges
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              game.title,
                              style: Theme.of(context).textTheme.displaySmall,
                            ),
                          ),
                          if (game.metacriticScore != null) ...[
                            const SizedBox(width: 12),
                            MetacriticBadge(score: game.metacriticScore!),
                          ],
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Status badges
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatusBadge(text: game.releaseStatus.label),
                          StatusBadge(
                            text: game.availabilityStatus.label,
                            backgroundColor: _getAvailabilityColor(
                              game.availabilityStatus,
                            ),
                          ),
                          if (game.releaseYear != null)
                            StatusBadge(
                              text: game.releaseYear.toString(),
                              backgroundColor: AppTheme.accentColor,
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Rating
                      if (game.averageRating != null)
                        Row(
                          children: [
                            ...List.generate(5, (index) {
                              final rating = game.averageRating!;
                              if (index < rating.floor()) {
                                return const Icon(
                                  Icons.star,
                                  color: AppTheme.warningColor,
                                  size: 24,
                                );
                              } else if (index < rating) {
                                return const Icon(
                                  Icons.star_half,
                                  color: AppTheme.warningColor,
                                  size: 24,
                                );
                              }
                              return const Icon(
                                Icons.star_border,
                                color: AppTheme.textMuted,
                                size: 24,
                              );
                            }),
                            const SizedBox(width: 8),
                            Text(
                              '${game.averageRating!.toStringAsFixed(1)} (${game.totalReviews} reviews)',
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 24),

                      // Action buttons
                      _ActionButtons(game: game),
                      const SizedBox(height: 24),

                      // Synopsis
                      if (game.synopsis != null) ...[
                        Text(
                          'Synopsis',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          game.synopsis!,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 15,
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Description
                      if (game.description != null) ...[
                        Text(
                          'About',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          game.description!,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 15,
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Trailer button
                      if (game.trailerUrl != null) ...[
                        SecondaryButton(
                          text: 'Watch Trailer',
                          icon: Icons.play_circle_outline,
                          onPressed: () => _openTrailer(game.trailerUrl!),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Age rating
                      if (game.ageRating != null)
                        _InfoRow(
                          icon: Icons.person_outline,
                          label: 'Age Rating',
                          value: game.ageRating!,
                        ),

                      const SizedBox(height: 32),
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

  Color _getAvailabilityColor(AvailabilityStatus status) {
    switch (status) {
      case AvailabilityStatus.available:
        return AppTheme.successColor;
      case AvailabilityStatus.abandonware:
        return AppTheme.errorColor;
      case AvailabilityStatus.discontinued:
        return AppTheme.warningColor;
      default:
        return AppTheme.textMuted;
    }
  }
}

/// Action buttons (add to collection/wishlist)
class _ActionButtons extends StatelessWidget {
  final Game game;

  const _ActionButtons({required this.game});

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, UserDataProvider>(
      builder: (context, auth, userData, _) {
        if (!auth.isAuthenticated) {
          return PrimaryButton(
            text: 'Login to save games',
            onPressed: () => Navigator.pushNamed(context, '/login'),
          );
        }

        final isInCollection = userData.isInCollection(game.id);
        final isInWishlist = userData.isInWishlist(game.id);

        return Row(
          children: [
            Expanded(
              child: isInCollection
                  ? SecondaryButton(
                      text: 'In Collection',
                      icon: Icons.check,
                      onPressed: () async {
                        await userData.removeFromCollection(game.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Removed from collection'),
                            ),
                          );
                        }
                      },
                    )
                  : PrimaryButton(
                      text: 'Add to Collection',
                      icon: Icons.add,
                      onPressed: () async {
                        await userData.addToCollection(game.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Added to collection'),
                            ),
                          );
                        }
                      },
                    ),
            ),
            const SizedBox(width: 12),
            IconButton(
              onPressed: () async {
                if (isInWishlist) {
                  await userData.removeFromWishlist(game.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Removed from wishlist'),
                      ),
                    );
                  }
                } else {
                  await userData.addToWishlist(game.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Added to wishlist'),
                      ),
                    );
                  }
                }
              },
              icon: Icon(
                isInWishlist ? Icons.favorite : Icons.favorite_border,
                color: isInWishlist ? AppTheme.errorColor : AppTheme.textMuted,
                size: 28,
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Info row widget
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textMuted, size: 20),
          const SizedBox(width: 12),
          Text(
            '$label:',
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
