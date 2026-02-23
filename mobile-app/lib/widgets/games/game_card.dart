import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';

import '../../config/theme.dart';
import '../../models/game.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_data_provider.dart';
import '../common/badges.dart';

/// Game card for grid display (cover art + info).
class GameCard extends StatelessWidget {
  final Game game;
  final VoidCallback? onTap;
  final bool showCollectionStatus;

  const GameCard({
    super.key,
    required this.game,
    this.onTap,
    this.showCollectionStatus = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.2)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            Expanded(
              flex: 4,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildCover(),
                  // Metacritic score
                  if (game.metacriticScore != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: MetacriticBadge(
                        score: game.metacriticScore!,
                        size: 30,
                      ),
                    ),
                  // Collection status badge
                  if (showCollectionStatus)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: _CollectionStatusOverlay(gameId: game.id),
                    ),
                  // Year badge
                  if (game.releaseYear != null)
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: YearBadge(year: game.releaseYear!),
                    ),
                ],
              ),
            ),
            // Info section
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      game.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        height: 1.2,
                      ),
                    ),
                    const Spacer(),
                    if (game.genreList.isNotEmpty)
                      Text(
                        game.genreList.take(2).join(', '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    if (game.averageRating != null) ...[
                      const SizedBox(height: 4),
                      RatingBadge(rating: game.averageRating!, size: 13),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCover() {
    if (game.coverUrl != null && game.coverUrl!.isNotEmpty) {
      return RepaintBoundary(
        child: CachedNetworkImage(
          imageUrl: game.coverUrl!,
          fit: BoxFit.cover,
          fadeInDuration: const Duration(milliseconds: 200),
          placeholder: (context, url) => Container(
            color: AppTheme.surfaceColor,
            child: const Center(
              child: Icon(Icons.gamepad_outlined, color: AppTheme.textMuted, size: 32),
            ),
          ),
          errorWidget: (context, url, error) => _coverPlaceholder(),
        ),
      );
    }
    return _coverPlaceholder();
  }

  Widget _coverPlaceholder() {
    return Container(
      color: AppTheme.surfaceColor,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.gamepad_outlined, color: AppTheme.textMuted, size: 36),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                game.title,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Game list tile for horizontal list display.
class GameListTile extends StatelessWidget {
  final Game game;
  final VoidCallback? onTap;
  final Widget? trailing;
  final String? subtitle;

  const GameListTile({
    super.key,
    required this.game,
    this.onTap,
    this.trailing,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            // Cover thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 56,
                height: 72,
                child: game.coverUrl != null && game.coverUrl!.isNotEmpty
                    ? RepaintBoundary(
                        child: CachedNetworkImage(
                          imageUrl: game.coverUrl!,
                          fit: BoxFit.cover,
                          fadeInDuration: const Duration(milliseconds: 200),
                          placeholder: (context, url) => Container(
                            color: AppTheme.surfaceColor,
                            child: const Icon(Icons.gamepad_outlined,
                                color: AppTheme.textMuted, size: 20),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: AppTheme.surfaceColor,
                            child: const Icon(Icons.gamepad_outlined,
                                color: AppTheme.textMuted, size: 20),
                          ),
                        ),
                      )
                    : Container(
                        color: AppTheme.surfaceColor,
                        child: const Icon(Icons.gamepad_outlined,
                            color: AppTheme.textMuted, size: 20),
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
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 12,
                      ),
                    )
                  else ...[
                    if (game.releaseYear != null || game.genreList.isNotEmpty)
                      Text(
                        [
                          if (game.releaseYear != null) '${game.releaseYear}',
                          if (game.genreList.isNotEmpty)
                            game.genreList.take(2).join(', '),
                        ].join(' • '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                        ),
                      ),
                  ],
                  if (game.metacriticScore != null) ...[
                    const SizedBox(height: 4),
                    MetacriticBadge(score: game.metacriticScore!, size: 22),
                  ],
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

/// Small overlay badge that shows the game's collection status.
class _CollectionStatusOverlay extends StatelessWidget {
  final int gameId;

  const _CollectionStatusOverlay({required this.gameId});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuthenticated) return const SizedBox.shrink();

    final userData = context.watch<UserDataProvider>();
    final status = userData.getGameStatus(gameId);
    if (status == null) return const SizedBox.shrink();

    final color = AppTheme.statusColor(status);
    final icon = AppTheme.statusIcon(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.5), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            AppTheme.statusLabel(status),
            style: TextStyle(
              color: color,
              fontSize: 9,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
