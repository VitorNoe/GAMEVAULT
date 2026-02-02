/// Release status enum
enum ReleaseStatus {
  released,
  earlyAccess,
  openBeta,
  closedBeta,
  alpha,
  comingSoon,
  inDevelopment,
  cancelled;

  static ReleaseStatus fromString(String value) {
    switch (value) {
      case 'released':
        return ReleaseStatus.released;
      case 'early_access':
        return ReleaseStatus.earlyAccess;
      case 'open_beta':
        return ReleaseStatus.openBeta;
      case 'closed_beta':
        return ReleaseStatus.closedBeta;
      case 'alpha':
        return ReleaseStatus.alpha;
      case 'coming_soon':
        return ReleaseStatus.comingSoon;
      case 'in_development':
        return ReleaseStatus.inDevelopment;
      case 'cancelled':
        return ReleaseStatus.cancelled;
      default:
        return ReleaseStatus.released;
    }
  }

  String get label {
    switch (this) {
      case ReleaseStatus.released:
        return 'Released';
      case ReleaseStatus.earlyAccess:
        return 'Early Access';
      case ReleaseStatus.openBeta:
        return 'Open Beta';
      case ReleaseStatus.closedBeta:
        return 'Closed Beta';
      case ReleaseStatus.alpha:
        return 'Alpha';
      case ReleaseStatus.comingSoon:
        return 'Coming Soon';
      case ReleaseStatus.inDevelopment:
        return 'In Development';
      case ReleaseStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Availability status enum
enum AvailabilityStatus {
  available,
  outOfCatalog,
  expiredLicense,
  abandonware,
  publicDomain,
  discontinued,
  rereleased;

  static AvailabilityStatus fromString(String value) {
    switch (value) {
      case 'available':
        return AvailabilityStatus.available;
      case 'out_of_catalog':
        return AvailabilityStatus.outOfCatalog;
      case 'expired_license':
        return AvailabilityStatus.expiredLicense;
      case 'abandonware':
        return AvailabilityStatus.abandonware;
      case 'public_domain':
        return AvailabilityStatus.publicDomain;
      case 'discontinued':
        return AvailabilityStatus.discontinued;
      case 'rereleased':
        return AvailabilityStatus.rereleased;
      default:
        return AvailabilityStatus.available;
    }
  }

  String get label {
    switch (this) {
      case AvailabilityStatus.available:
        return 'Available';
      case AvailabilityStatus.outOfCatalog:
        return 'Out of Catalog';
      case AvailabilityStatus.expiredLicense:
        return 'Expired License';
      case AvailabilityStatus.abandonware:
        return 'Abandonware';
      case AvailabilityStatus.publicDomain:
        return 'Public Domain';
      case AvailabilityStatus.discontinued:
        return 'Discontinued';
      case AvailabilityStatus.rereleased:
        return 'Re-released';
    }
  }
}

/// Game model
class Game {
  final int id;
  final String title;
  final String slug;
  final String? description;
  final String? synopsis;
  final int? releaseYear;
  final String? releaseDate;
  final String? coverUrl;
  final String? bannerUrl;
  final String? trailerUrl;
  final int? developerId;
  final int? publisherId;
  final ReleaseStatus releaseStatus;
  final AvailabilityStatus availabilityStatus;
  final String? ageRating;
  final double? averageRating;
  final int totalReviews;
  final bool isEarlyAccess;
  final bool wasRereleased;
  final int? metacriticScore;
  final DateTime createdAt;
  final DateTime updatedAt;

  Game({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    this.synopsis,
    this.releaseYear,
    this.releaseDate,
    this.coverUrl,
    this.bannerUrl,
    this.trailerUrl,
    this.developerId,
    this.publisherId,
    required this.releaseStatus,
    required this.availabilityStatus,
    this.ageRating,
    this.averageRating,
    required this.totalReviews,
    this.isEarlyAccess = false,
    this.wasRereleased = false,
    this.metacriticScore,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      id: json['id'] as int,
      title: json['title'] as String,
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      synopsis: json['synopsis'] as String?,
      releaseYear: json['release_year'] as int?,
      releaseDate: json['release_date'] as String?,
      coverUrl: json['cover_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
      trailerUrl: json['trailer_url'] as String?,
      developerId: json['developer_id'] as int?,
      publisherId: json['publisher_id'] as int?,
      releaseStatus: ReleaseStatus.fromString(
        json['release_status'] as String? ?? 'released',
      ),
      availabilityStatus: AvailabilityStatus.fromString(
        json['availability_status'] as String? ?? 'available',
      ),
      ageRating: json['age_rating'] as String?,
      averageRating: json['average_rating'] != null
          ? (json['average_rating'] as num).toDouble()
          : null,
      totalReviews: json['total_reviews'] as int? ?? 0,
      isEarlyAccess: json['is_early_access'] as bool? ?? false,
      wasRereleased: json['was_rereleased'] as bool? ?? false,
      metacriticScore: json['metacritic_score'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'slug': slug,
      'description': description,
      'synopsis': synopsis,
      'release_year': releaseYear,
      'release_date': releaseDate,
      'cover_url': coverUrl,
      'banner_url': bannerUrl,
      'trailer_url': trailerUrl,
      'developer_id': developerId,
      'publisher_id': publisherId,
      'release_status': releaseStatus.name,
      'availability_status': availabilityStatus.name,
      'age_rating': ageRating,
      'average_rating': averageRating,
      'total_reviews': totalReviews,
      'is_early_access': isEarlyAccess,
      'was_rereleased': wasRereleased,
      'metacritic_score': metacriticScore,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Get display cover URL with fallback
  String get displayCoverUrl =>
      coverUrl ?? 'https://via.placeholder.com/300x400?text=No+Cover';
}
