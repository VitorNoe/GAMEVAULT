import '../models/game.dart';
import '../config/app_config.dart';
import 'api_service.dart';

/// Game service for fetching game data
class GameService {
  final ApiService _api = ApiService();

  /// Get all games with optional filters
  Future<PaginatedGames> getAllGames({
    int page = 1,
    int limit = AppConfig.defaultPageSize,
    String? search,
    String? releaseStatus,
    String? availabilityStatus,
    int? year,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (releaseStatus != null) {
      queryParams['release_status'] = releaseStatus;
    }
    if (availabilityStatus != null) {
      queryParams['availability_status'] = availabilityStatus;
    }
    if (year != null) {
      queryParams['year'] = year;
    }

    final response = await _api.get('/games', queryParams: queryParams);

    final games = (response['data']['games'] as List)
        .map((json) => Game.fromJson(json))
        .toList();

    return PaginatedGames(
      games: games,
      total: response['data']['pagination']['total'] ?? 0,
      page: response['data']['pagination']['page'] ?? page,
      totalPages: response['data']['pagination']['totalPages'] ?? 1,
    );
  }

  /// Get game by ID
  Future<Game> getGameById(int id) async {
    final response = await _api.get('/games/$id');
    return Game.fromJson(response['data']['game']);
  }

  /// Search games
  Future<PaginatedGames> searchGames(
    String query, {
    int page = 1,
    int limit = AppConfig.defaultPageSize,
  }) async {
    final response = await _api.get(
      '/games/search',
      queryParams: {
        'q': query,
        'page': page,
        'limit': limit,
      },
    );

    final games = (response['data']['games'] as List)
        .map((json) => Game.fromJson(json))
        .toList();

    return PaginatedGames(
      games: games,
      total: response['data']['pagination']['total'] ?? 0,
      page: response['data']['pagination']['page'] ?? page,
      totalPages: response['data']['pagination']['totalPages'] ?? 1,
    );
  }

  /// Get upcoming releases
  Future<PaginatedGames> getUpcomingReleases({
    int page = 1,
    int limit = AppConfig.defaultPageSize,
  }) async {
    final response = await _api.get(
      '/games/upcoming-releases',
      queryParams: {
        'page': page,
        'limit': limit,
      },
    );

    final games = (response['data']['games'] as List)
        .map((json) => Game.fromJson(json))
        .toList();

    return PaginatedGames(
      games: games,
      total: response['data']['pagination']['total'] ?? 0,
      page: response['data']['pagination']['page'] ?? page,
      totalPages: response['data']['pagination']['totalPages'] ?? 1,
    );
  }

  /// Get abandonware games
  Future<PaginatedGames> getAbandonwareGames({
    int page = 1,
    int limit = AppConfig.defaultPageSize,
  }) async {
    final response = await _api.get(
      '/games/abandonware',
      queryParams: {
        'page': page,
        'limit': limit,
      },
    );

    final games = (response['data']['games'] as List)
        .map((json) => Game.fromJson(json))
        .toList();

    return PaginatedGames(
      games: games,
      total: response['data']['pagination']['total'] ?? 0,
      page: response['data']['pagination']['page'] ?? page,
      totalPages: response['data']['pagination']['totalPages'] ?? 1,
    );
  }
}

/// Paginated games result
class PaginatedGames {
  final List<Game> games;
  final int total;
  final int page;
  final int totalPages;

  PaginatedGames({
    required this.games,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  bool get hasMore => page < totalPages;
}
