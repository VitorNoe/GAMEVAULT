import '../models/game.dart';
import '../config/app_config.dart';
import 'api_service.dart';

/// User service for user-related operations
class UserService {
  final ApiService _api = ApiService();

  /// Get user's collection
  Future<PaginatedCollection> getCollection({
    int page = 1,
    int limit = AppConfig.defaultPageSize,
  }) async {
    final response = await _api.get(
      '/users/collection',
      queryParams: {
        'page': page,
        'limit': limit,
      },
    );

    final games = (response['data']['collection'] as List)
        .map((json) => Game.fromJson(json['game'] ?? json))
        .toList();

    return PaginatedCollection(
      games: games,
      total: response['data']['pagination']?['total'] ?? games.length,
      page: response['data']['pagination']?['page'] ?? page,
      totalPages: response['data']['pagination']?['totalPages'] ?? 1,
    );
  }

  /// Add game to collection
  Future<bool> addToCollection(int gameId, {String? status}) async {
    try {
      await _api.post(
        '/users/collection',
        body: {
          'game_id': gameId,
          'status': status ?? 'owned',
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Remove game from collection
  Future<bool> removeFromCollection(int gameId) async {
    try {
      await _api.delete('/users/collection/$gameId');
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get user's wishlist
  Future<PaginatedWishlist> getWishlist({
    int page = 1,
    int limit = AppConfig.defaultPageSize,
  }) async {
    final response = await _api.get(
      '/users/wishlist',
      queryParams: {
        'page': page,
        'limit': limit,
      },
    );

    final games = (response['data']['wishlist'] as List)
        .map((json) => Game.fromJson(json['game'] ?? json))
        .toList();

    return PaginatedWishlist(
      games: games,
      total: response['data']['pagination']?['total'] ?? games.length,
      page: response['data']['pagination']?['page'] ?? page,
      totalPages: response['data']['pagination']?['totalPages'] ?? 1,
    );
  }

  /// Add game to wishlist
  Future<bool> addToWishlist(int gameId) async {
    try {
      await _api.post(
        '/users/wishlist',
        body: {
          'game_id': gameId,
        },
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Remove game from wishlist
  Future<bool> removeFromWishlist(int gameId) async {
    try {
      await _api.delete('/users/wishlist/$gameId');
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Get user stats
  Future<UserStats?> getUserStats() async {
    try {
      final response = await _api.get('/users/stats');
      return UserStats.fromJson(response['data']);
    } catch (e) {
      return null;
    }
  }
}

/// Paginated collection result
class PaginatedCollection {
  final List<Game> games;
  final int total;
  final int page;
  final int totalPages;

  PaginatedCollection({
    required this.games,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  bool get hasMore => page < totalPages;
}

/// Paginated wishlist result
class PaginatedWishlist {
  final List<Game> games;
  final int total;
  final int page;
  final int totalPages;

  PaginatedWishlist({
    required this.games,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  bool get hasMore => page < totalPages;
}

/// User stats model
class UserStats {
  final int totalGames;
  final int wishlistCount;
  final int completedGames;

  UserStats({
    required this.totalGames,
    required this.wishlistCount,
    required this.completedGames,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalGames: json['total_games'] ?? 0,
      wishlistCount: json['wishlist_count'] ?? 0,
      completedGames: json['completed_games'] ?? 0,
    );
  }
}
