import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Collection status badge.
class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(AppTheme.statusIcon(status), size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            AppTheme.statusLabel(status),
            style: TextStyle(
              color: color,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Star rating badge.
class RatingBadge extends StatelessWidget {
  final double rating;
  final double size;

  const RatingBadge({
    super.key,
    required this.rating,
    this.size = 14,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.star, color: AppTheme.warningColor, size: size),
        const SizedBox(width: 3),
        Text(
          rating.toStringAsFixed(1),
          style: TextStyle(
            color: AppTheme.textPrimary,
            fontSize: size - 2,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

/// Metacritic score badge.
class MetacriticBadge extends StatelessWidget {
  final int score;
  final double size;

  const MetacriticBadge({
    super.key,
    required this.score,
    this.size = 28,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.metacriticColor(score);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        score.toString(),
        style: TextStyle(
          color: color,
          fontSize: size * 0.4,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Release status badge (e.g., "Coming Soon", "Early Access").
class ReleaseStatusBadge extends StatelessWidget {
  final String status;

  const ReleaseStatusBadge({super.key, required this.status});

  Color get _color {
    switch (status) {
      case 'released':
        return AppTheme.successColor;
      case 'early_access':
        return AppTheme.warningColor;
      case 'coming_soon':
        return AppTheme.accentCyan;
      case 'in_development':
        return AppTheme.accentBlue;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textMuted;
    }
  }

  String get _label {
    switch (status) {
      case 'released':
        return 'Released';
      case 'early_access':
        return 'Early Access';
      case 'open_beta':
        return 'Open Beta';
      case 'closed_beta':
        return 'Closed Beta';
      case 'alpha':
        return 'Alpha';
      case 'coming_soon':
        return 'Coming Soon';
      case 'in_development':
        return 'In Development';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        _label,
        style: TextStyle(
          color: _color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Year badge.
class YearBadge extends StatelessWidget {
  final int year;

  const YearBadge({super.key, required this.year});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        year.toString(),
        style: const TextStyle(
          color: AppTheme.textSecondary,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
