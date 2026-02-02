import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Status badge widget
class StatusBadge extends StatelessWidget {
  final String text;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.text,
    this.backgroundColor,
    this.textColor,
    this.icon,
  });

  factory StatusBadge.released() {
    return const StatusBadge(
      text: 'Released',
      backgroundColor: AppTheme.successColor,
    );
  }

  factory StatusBadge.earlyAccess() {
    return const StatusBadge(
      text: 'Early Access',
      backgroundColor: AppTheme.warningColor,
    );
  }

  factory StatusBadge.comingSoon() {
    return const StatusBadge(
      text: 'Coming Soon',
      backgroundColor: AppTheme.accentColor,
    );
  }

  factory StatusBadge.available() {
    return const StatusBadge(
      text: 'Available',
      backgroundColor: AppTheme.successColor,
    );
  }

  factory StatusBadge.abandonware() {
    return const StatusBadge(
      text: 'Abandonware',
      backgroundColor: AppTheme.errorColor,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: (backgroundColor ?? AppTheme.primaryColor).withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: backgroundColor ?? AppTheme.primaryColor,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 12,
              color: textColor ?? backgroundColor ?? AppTheme.textPrimary,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: textColor ?? backgroundColor ?? AppTheme.textPrimary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Rating badge with stars
class RatingBadge extends StatelessWidget {
  final double rating;
  final bool showStars;

  const RatingBadge({
    super.key,
    required this.rating,
    this.showStars = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showStars)
            const Icon(
              Icons.star,
              size: 14,
              color: AppTheme.warningColor,
            ),
          if (showStars) const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Metacritic score badge
class MetacriticBadge extends StatelessWidget {
  final int score;

  const MetacriticBadge({
    super.key,
    required this.score,
  });

  Color get _backgroundColor {
    if (score >= 75) return const Color(0xFF66CC33);
    if (score >= 50) return const Color(0xFFFFCC33);
    return const Color(0xFFFF0000);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Text(
          score.toString(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
