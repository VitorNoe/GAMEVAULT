import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/game.dart';
import '../common/badges.dart';

/// Game card widget for grid/list display
class GameCard extends StatelessWidget {
  final Game game;
  final VoidCallback? onTap;
  final bool showRating;

  const GameCard({
    super.key,
    required this.game,
    this.onTap,
    this.showRating = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: game.displayCoverUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      placeholder: (context, url) => Container(
                        color: AppTheme.surfaceColor,
                        child: const Center(
                          child: Icon(
                            Icons.gamepad_outlined,
                            color: AppTheme.textMuted,
                            size: 40,
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppTheme.surfaceColor,
                        child: const Center(
                          child: Icon(
                            Icons.broken_image,
                            color: AppTheme.textMuted,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Rating badge
                  if (showRating && game.averageRating != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: RatingBadge(rating: game.averageRating!),
                    ),
                  // Year badge
                  if (game.releaseYear != null)
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          game.releaseYear.toString(),
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Game info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    game.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  StatusBadge(text: game.releaseStatus.label),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal game card for lists
class GameListTile extends StatelessWidget {
  final Game game;
  final VoidCallback? onTap;
  final Widget? trailing;

  const GameListTile({
    super.key,
    required this.game,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Cover image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: game.displayCoverUrl,
                width: 60,
                height: 80,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  width: 60,
                  height: 80,
                  color: AppTheme.surfaceColor,
                  child: const Icon(
                    Icons.gamepad_outlined,
                    color: AppTheme.textMuted,
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  width: 60,
                  height: 80,
                  color: AppTheme.surfaceColor,
                  child: const Icon(
                    Icons.broken_image,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    game.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (game.releaseYear != null)
                    Text(
                      game.releaseYear.toString(),
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      StatusBadge(text: game.releaseStatus.label),
                      if (game.averageRating != null) ...[
                        const SizedBox(width: 8),
                        RatingBadge(rating: game.averageRating!),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
