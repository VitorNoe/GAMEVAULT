import '../models/game.dart';
import 'api_service.dart';

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

class GameService {
  final ApiService _api = ApiService();

  /// Fetch all games with optional pagination, search and filters.
  Future<PaginatedGames> getAllGames({
    int page = 1,
    int limit = 20,
    String? search,
    String? releaseStatus,
    String? availabilityStatus,
    int? year,
    String? tag,
    String? platform,
    String? genre,
    String? sort,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (releaseStatus != null) params['release_status'] = releaseStatus;
    if (availabilityStatus != null) params['availability_status'] = availabilityStatus;
    if (year != null) params['year'] = year.toString();
    if (tag != null) params['tag'] = tag;
    if (platform != null) params['platform'] = platform;
    if (genre != null) params['genre'] = genre;
    if (sort != null) params['sort'] = sort;

    final response = await _api.get('/games', queryParams: params);
    final data = response['data'] as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>? ??
        response['pagination'] as Map<String, dynamic>? ??
        {};

    final gamesJson = data['games'] as List<dynamic>? ?? [];
    final games = gamesJson
        .map((g) => Game.fromJson(g as Map<String, dynamic>))
        .toList();

    return PaginatedGames(
      games: games,
      total: pagination['total'] as int? ?? games.length,
      page: pagination['page'] as int? ?? page,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }

  /// Get a single game by ID.
  Future<Game> getGameById(int id) async {
    final response = await _api.get('/games/$id');
    final data = response['data'] as Map<String, dynamic>;
    return Game.fromJson(data['game'] as Map<String, dynamic>? ?? data);
  }

  /// Search games by text query.
  Future<PaginatedGames> searchGames({
    required String query,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _api.get('/games/search', queryParams: {
      'q': query,
      'page': page.toString(),
      'limit': limit.toString(),
    });

    final data = response['data'] as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
    final gamesJson = data['games'] as List<dynamic>? ?? [];
    final games = gamesJson
        .map((g) => Game.fromJson(g as Map<String, dynamic>))
        .toList();

    return PaginatedGames(
      games: games,
      total: pagination['total'] as int? ?? games.length,
      page: pagination['page'] as int? ?? page,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }

  /// Get upcoming game releases.
  Future<PaginatedGames> getUpcomingReleases({int page = 1, int limit = 20}) async {
    final response = await _api.get('/games/upcoming-releases', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });

    final data = response['data'] as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
    final gamesJson = data['games'] as List<dynamic>? ?? [];
    final games = gamesJson
        .map((g) => Game.fromJson(g as Map<String, dynamic>))
        .toList();

    return PaginatedGames(
      games: games,
      total: pagination['total'] as int? ?? games.length,
      page: pagination['page'] as int? ?? page,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }

  /// Get abandonware games.
  Future<PaginatedGames> getAbandonwareGames({int page = 1, int limit = 20}) async {
    final response = await _api.get('/games/abandonware', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });

    final data = response['data'] as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
    final gamesJson = data['games'] as List<dynamic>? ?? [];
    final games = gamesJson
        .map((g) => Game.fromJson(g as Map<String, dynamic>))
        .toList();

    return PaginatedGames(
      games: games,
      total: pagination['total'] as int? ?? games.length,
      page: pagination['page'] as int? ?? page,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }

  /// Get GOTY games.
  Future<PaginatedGames> getGotyGames({int page = 1, int limit = 20}) async {
    final response = await _api.get('/games/goty', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });

    final data = response['data'] as Map<String, dynamic>;
    final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
    final gamesJson = data['games'] as List<dynamic>? ?? [];
    final games = gamesJson
        .map((g) => Game.fromJson(g as Map<String, dynamic>))
        .toList();

    return PaginatedGames(
      games: games,
      total: pagination['total'] as int? ?? games.length,
      page: pagination['page'] as int? ?? page,
      totalPages: pagination['totalPages'] as int? ?? 1,
    );
  }
}
