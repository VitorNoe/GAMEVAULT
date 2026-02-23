import 'game.dart';

class CollectionItem {
  final int id;
  final int userId;
  final int gameId;
  final int? platformId;
  final String status;
  final String format;
  final int hoursPlayed;
  final String? personalNotes;
  final int? rating;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Game? game;

  CollectionItem({
    required this.id,
    required this.userId,
    required this.gameId,
    this.platformId,
    required this.status,
    required this.format,
    this.hoursPlayed = 0,
    this.personalNotes,
    this.rating,
    required this.createdAt,
    required this.updatedAt,
    this.game,
  });

  factory CollectionItem.fromJson(Map<String, dynamic> json) {
    return CollectionItem(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      gameId: json['game_id'] as int,
      platformId: json['platform_id'] as int?,
      status: json['status'] as String? ?? 'not_started',
      format: json['format'] as String? ?? 'digital',
      hoursPlayed: json['hours_played'] as int? ?? 0,
      personalNotes: json['personal_notes'] as String?,
      rating: json['rating'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
      game: json['Game'] != null
          ? Game.fromJson(json['Game'] as Map<String, dynamic>)
          : (json['game'] != null
              ? Game.fromJson(json['game'] as Map<String, dynamic>)
              : null),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'game_id': gameId,
        'platform_id': platformId,
        'status': status,
        'format': format,
        'hours_played': hoursPlayed,
        'personal_notes': personalNotes,
        'rating': rating,
      };

  bool get isWishlist => status == 'wishlist';
  bool get isPlaying => status == 'playing';
  bool get isCompleted => status == 'completed';
}

class CollectionStats {
  final int total;
  final int playing;
  final int completed;
  final int paused;
  final int abandoned;
  final int notStarted;
  final int wishlist;
  final int backlog;

  CollectionStats({
    this.total = 0,
    this.playing = 0,
    this.completed = 0,
    this.paused = 0,
    this.abandoned = 0,
    this.notStarted = 0,
    this.wishlist = 0,
    this.backlog = 0,
  });

  factory CollectionStats.fromJson(Map<String, dynamic> json) {
    return CollectionStats(
      total: json['total'] as int? ?? 0,
      playing: json['playing'] as int? ?? 0,
      completed: json['completed'] as int? ?? 0,
      paused: json['paused'] as int? ?? 0,
      abandoned: json['abandoned'] as int? ?? 0,
      notStarted: json['not_started'] as int? ?? 0,
      wishlist: json['wishlist'] as int? ?? 0,
      backlog: json['backlog'] as int? ?? 0,
    );
  }
}

class UserStats {
  final int totalGames;
  final int wishlistCount;
  final int playingCount;
  final int completedCount;
  final int backlogCount;
  final int pausedCount;
  final int abandonedCount;

  UserStats({
    this.totalGames = 0,
    this.wishlistCount = 0,
    this.playingCount = 0,
    this.completedCount = 0,
    this.backlogCount = 0,
    this.pausedCount = 0,
    this.abandonedCount = 0,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalGames: json['collection'] as int? ?? json['total'] as int? ?? 0,
      wishlistCount: json['wishlist'] as int? ?? 0,
      playingCount: json['playing'] as int? ?? 0,
      completedCount: json['completed'] as int? ?? 0,
      backlogCount: json['backlog'] as int? ?? 0,
      pausedCount: json['paused'] as int? ?? 0,
      abandonedCount: json['abandoned'] as int? ?? 0,
    );
  }
}
