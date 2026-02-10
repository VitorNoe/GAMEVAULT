enum PlatformType {
  console,
  handheld,
  pc,
  mobile;

  String get apiValue {
    switch (this) {
      case PlatformType.console:
        return 'console';
      case PlatformType.handheld:
        return 'handheld';
      case PlatformType.pc:
        return 'pc';
      case PlatformType.mobile:
        return 'mobile';
    }
  }

  String get label {
    switch (this) {
      case PlatformType.console:
        return 'Console';
      case PlatformType.handheld:
        return 'Handheld';
      case PlatformType.pc:
        return 'PC';
      case PlatformType.mobile:
        return 'Mobile';
    }
  }

  static PlatformType fromString(String? value) {
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

class GamePlatform {
  final int id;
  final String name;
  final String slug;
  final String? manufacturer;
  final PlatformType type;
  final int? generation;
  final int? releaseYear;
  final int? discontinuationYear;
  final String? logoUrl;
  final String? primaryColor;

  GamePlatform({
    required this.id,
    required this.name,
    required this.slug,
    this.manufacturer,
    required this.type,
    this.generation,
    this.releaseYear,
    this.discontinuationYear,
    this.logoUrl,
    this.primaryColor,
  });

  factory GamePlatform.fromJson(Map<String, dynamic> json) {
    return GamePlatform(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String,
      manufacturer: json['manufacturer'] as String?,
      type: PlatformType.fromString(json['platform_type'] as String? ?? json['type'] as String?),
      generation: json['generation'] as int?,
      releaseYear: json['release_year'] as int?,
      discontinuationYear: json['discontinuation_year'] as int?,
      logoUrl: json['logo_url'] as String?,
      primaryColor: json['primary_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'manufacturer': manufacturer,
        'type': type.apiValue,
        'generation': generation,
        'release_year': releaseYear,
        'discontinuation_year': discontinuationYear,
        'logo_url': logoUrl,
        'primary_color': primaryColor,
      };
}
