enum ReleaseStatus {
  released,
  earlyAccess,
  openBeta,
  closedBeta,
  alpha,
  comingSoon,
  inDevelopment,
  cancelled;

  String get apiValue {
    switch (this) {
      case ReleaseStatus.released:
        return 'released';
      case ReleaseStatus.earlyAccess:
        return 'early_access';
      case ReleaseStatus.openBeta:
        return 'open_beta';
      case ReleaseStatus.closedBeta:
        return 'closed_beta';
      case ReleaseStatus.alpha:
        return 'alpha';
      case ReleaseStatus.comingSoon:
        return 'coming_soon';
      case ReleaseStatus.inDevelopment:
        return 'in_development';
      case ReleaseStatus.cancelled:
        return 'cancelled';
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

  static ReleaseStatus fromString(String? value) {
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
}

enum AvailabilityStatus {
  available,
  outOfCatalog,
  expiredLicense,
  abandonware,
  publicDomain,
  discontinued,
  rereleased;

  String get apiValue {
    switch (this) {
      case AvailabilityStatus.available:
        return 'available';
      case AvailabilityStatus.outOfCatalog:
        return 'out_of_catalog';
      case AvailabilityStatus.expiredLicense:
        return 'expired_license';
      case AvailabilityStatus.abandonware:
        return 'abandonware';
      case AvailabilityStatus.publicDomain:
        return 'public_domain';
      case AvailabilityStatus.discontinued:
        return 'discontinued';
      case AvailabilityStatus.rereleased:
        return 'rereleased';
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
        return 'Re-Released';
    }
  }

  static AvailabilityStatus fromString(String? value) {
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
}

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
  final ReleaseStatus releaseStatus;
  final AvailabilityStatus availabilityStatus;
  final String? ageRating;
  final double? averageRating;
  final int totalReviews;
  final int? metacriticScore;
  final String? tags;
  final String? developerName;
  final String? publisherName;
  final String? genres;
  final String? platforms;
  final bool isEarlyAccess;
  final bool wasRereleased;
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
    required this.releaseStatus,
    required this.availabilityStatus,
    this.ageRating,
    this.averageRating,
    this.totalReviews = 0,
    this.metacriticScore,
    this.tags,
    this.developerName,
    this.publisherName,
    this.genres,
    this.platforms,
    this.isEarlyAccess = false,
    this.wasRereleased = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      id: json['id'] as int,
      title: json['title'] as String? ?? 'Unknown',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      synopsis: json['synopsis'] as String?,
      releaseYear: json['release_year'] as int?,
      releaseDate: json['release_date'] as String?,
      coverUrl: json['cover_url'] as String?,
      bannerUrl: json['banner_url'] as String?,
      trailerUrl: json['trailer_url'] as String?,
      releaseStatus:
          ReleaseStatus.fromString(json['release_status'] as String?),
      availabilityStatus:
          AvailabilityStatus.fromString(json['availability_status'] as String?),
      ageRating: json['age_rating'] as String?,
      averageRating: json['average_rating'] != null
          ? double.tryParse(json['average_rating'].toString())
          : null,
      totalReviews: json['total_reviews'] as int? ?? 0,
      metacriticScore: json['metacritic_score'] as int?,
      tags: json['tags'] as String?,
      developerName: json['developer_name'] as String?,
      publisherName: json['publisher_name'] as String?,
      genres: json['genres'] as String?,
      platforms: json['platforms'] as String?,
      isEarlyAccess: json['is_early_access'] == true,
      wasRereleased: json['was_rereleased'] == true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
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
        'release_status': releaseStatus.apiValue,
        'availability_status': availabilityStatus.apiValue,
        'age_rating': ageRating,
        'average_rating': averageRating,
        'total_reviews': totalReviews,
        'metacritic_score': metacriticScore,
        'tags': tags,
        'developer_name': developerName,
        'publisher_name': publisherName,
        'genres': genres,
        'platforms': platforms,
        'is_early_access': isEarlyAccess,
        'was_rereleased': wasRereleased,
      };

  /// Returns the cover URL or a placeholder.
  String get displayCoverUrl =>
      coverUrl ?? 'https://via.placeholder.com/300x400?text=${Uri.encodeComponent(title)}';

  /// Returns tags as a list.
  List<String> get tagList =>
      tags?.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList() ?? [];

  /// Returns genres as a list.
  List<String> get genreList =>
      genres?.split(',').map((g) => g.trim()).where((g) => g.isNotEmpty).toList() ?? [];

  /// Returns platforms as a list.
  List<String> get platformList =>
      platforms?.split(',').map((p) => p.trim()).where((p) => p.isNotEmpty).toList() ?? [];
}
