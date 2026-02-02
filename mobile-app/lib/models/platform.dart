/// Platform type enum
enum PlatformType {
  console,
  handheld,
  pc,
  mobile;

  static PlatformType fromString(String value) {
    switch (value) {
      case 'console':
        return PlatformType.console;
      case 'handheld':
        return PlatformType.handheld;
      case 'pc':
        return PlatformType.pc;
      case 'mobile':
        return PlatformType.mobile;
      default:
        return PlatformType.console;
    }
  }
}

/// Platform model
class Platform {
  final int id;
  final String name;
  final String slug;
  final String? manufacturer;
  final PlatformType type;
  final int? generation;
  final int? releaseYear;
  final String? logoUrl;
  final String? primaryColor;

  Platform({
    required this.id,
    required this.name,
    required this.slug,
    this.manufacturer,
    required this.type,
    this.generation,
    this.releaseYear,
    this.logoUrl,
    this.primaryColor,
  });

  factory Platform.fromJson(Map<String, dynamic> json) {
    return Platform(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String? ?? '',
      manufacturer: json['manufacturer'] as String?,
      type: PlatformType.fromString(json['type'] as String? ?? 'console'),
      generation: json['generation'] as int?,
      releaseYear: json['release_year'] as int?,
      logoUrl: json['logo_url'] as String?,
      primaryColor: json['primary_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'manufacturer': manufacturer,
      'type': type.name,
      'generation': generation,
      'release_year': releaseYear,
      'logo_url': logoUrl,
      'primary_color': primaryColor,
    };
  }
}
