import '../models/collection_item.dart';
import '../models/user.dart';
import 'api_service.dart';

class UserService {
  final ApiService _api = ApiService();

  // ── Collection ──

  /// Get user's collection with optional status filter.
  Future<List<CollectionItem>> getCollection({
    String? status,
    int page = 1,
    int limit = 50,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (status != null && status.isNotEmpty) params['status'] = status;

    final response = await _api.get('/collection', auth: true, queryParams: params);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    final itemsJson = data['items'] as List<dynamic>? ?? [];

    return itemsJson
        .map((item) => CollectionItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Get collection stats.
  Future<CollectionStats> getCollectionStats() async {
    final response = await _api.get('/collection/stats', auth: true);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return CollectionStats.fromJson(data);
  }

  /// Check if a game is in the user's collection.
  Future<CollectionItem?> getCollectionStatus(int gameId) async {
    try {
      final response = await _api.get('/collection/status/$gameId', auth: true);
      final data = response['data'] as Map<String, dynamic>?;
      if (data != null && data['item'] != null) {
        return CollectionItem.fromJson(data['item'] as Map<String, dynamic>);
      }
      return null;
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  /// Add a game to the collection.
  Future<CollectionItem> addToCollection({
    required int gameId,
    String status = 'not_started',
    String format = 'digital',
    int? platformId,
  }) async {
    final body = <String, dynamic>{
      'game_id': gameId,
      'status': status,
      'format': format,
    };
    if (platformId != null) body['platform_id'] = platformId;

    final response = await _api.post('/collection', auth: true, body: body);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return CollectionItem.fromJson(data['item'] as Map<String, dynamic>? ?? data);
  }

  /// Update a collection item.
  Future<CollectionItem> updateCollectionItem({
    required int gameId,
    String? status,
    String? format,
    int? hoursPlayed,
    String? personalNotes,
    int? rating,
  }) async {
    final body = <String, dynamic>{};
    if (status != null) body['status'] = status;
    if (format != null) body['format'] = format;
    if (hoursPlayed != null) body['hours_played'] = hoursPlayed;
    if (personalNotes != null) body['personal_notes'] = personalNotes;
    if (rating != null) body['rating'] = rating;

    final response = await _api.put('/collection/$gameId', auth: true, body: body);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return CollectionItem.fromJson(data['item'] as Map<String, dynamic>? ?? data);
  }

  /// Remove a game from the collection.
  Future<void> removeFromCollection(int gameId) async {
    await _api.delete('/collection/$gameId', auth: true);
  }

  // ── User stats ──

  /// Get authenticated user's overview stats.
  Future<UserStats> getUserStats() async {
    final response = await _api.get('/users/me/stats', auth: true);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return UserStats.fromJson(data);
  }

  // ── Profile ──

  /// Update user profile.
  Future<User> updateProfile({
    String? name,
    String? bio,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (bio != null) body['bio'] = bio;
    if (avatarUrl != null) body['avatar_url'] = avatarUrl;

    final response = await _api.put('/users/me', auth: true, body: body);
    final data = response['data'] as Map<String, dynamic>? ?? response;
    return User.fromJson(data['user'] as Map<String, dynamic>? ?? data);
  }
}
