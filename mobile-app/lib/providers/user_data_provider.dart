import 'package:flutter/foundation.dart';

import '../models/collection_item.dart';
import '../services/user_service.dart';
import '../services/api_service.dart';

class UserDataProvider extends ChangeNotifier {
  final UserService _userService = UserService();

  // ── State ──
  List<CollectionItem> _collection = [];
  List<CollectionItem> _wishlist = [];
  List<CollectionItem> _playingNow = [];
  List<CollectionItem> _completedGames = [];
  CollectionStats _stats = CollectionStats();
  UserStats _userStats = UserStats();
  bool _isLoading = false;
  bool _isLoadingPlaying = false;
  bool _isLoadingCompleted = false;
  String? _error;

  // ── Cache for quick lookups ──
  final Map<int, CollectionItem> _collectionCache = {};

  // ── Getters ──
  List<CollectionItem> get collection => _collection;
  List<CollectionItem> get wishlist => _wishlist;
  List<CollectionItem> get playingNow => _playingNow;
  List<CollectionItem> get completedGames => _completedGames;
  CollectionStats get stats => _stats;
  UserStats get userStats => _userStats;
  bool get isLoading => _isLoading;
  bool get isLoadingPlaying => _isLoadingPlaying;
  bool get isLoadingCompleted => _isLoadingCompleted;
  String? get error => _error;

  /// Fetch user collection.
  Future<void> fetchCollection({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _collection = await _userService.getCollection(status: status, limit: 200);
      _rebuildCache();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load collection.';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch wishlist items.
  Future<void> fetchWishlist() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _wishlist = await _userService.getCollection(status: 'wishlist', limit: 100);
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load wishlist.';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch playing now items.
  Future<void> fetchPlayingNow() async {
    _isLoadingPlaying = true;
    _error = null;
    notifyListeners();

    try {
      _playingNow = await _userService.getCollection(status: 'playing', limit: 100);
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load playing games.';
    }

    _isLoadingPlaying = false;
    notifyListeners();
  }

  /// Fetch completed games.
  Future<void> fetchCompletedGames() async {
    _isLoadingCompleted = true;
    _error = null;
    notifyListeners();

    try {
      _completedGames = await _userService.getCollection(status: 'completed', limit: 100);
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load completed games.';
    }

    _isLoadingCompleted = false;
    notifyListeners();
  }

  /// Fetch collection stats.
  Future<void> fetchStats() async {
    try {
      _stats = await _userService.getCollectionStats();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to fetch stats: $e');
    }
  }

  /// Fetch user overview stats.
  Future<void> fetchUserStats() async {
    try {
      _userStats = await _userService.getUserStats();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to fetch user stats: $e');
    }
  }

  /// Fetch all user data in parallel.
  Future<void> fetchAllData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Future.wait([
        fetchCollection(),
        fetchWishlist(),
        fetchPlayingNow(),
        fetchCompletedGames(),
        fetchStats(),
        fetchUserStats(),
      ]);
    } catch (e) {
      debugPrint('Failed to fetch all data: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Add game to collection.
  Future<bool> addToCollection({
    required int gameId,
    String status = 'not_started',
    String format = 'digital',
  }) async {
    try {
      await _userService.addToCollection(
        gameId: gameId,
        status: status,
        format: format,
      );
      // Refresh relevant lists based on status
      await _refreshForStatus(status);
      await fetchStats();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to add game to collection.';
      notifyListeners();
      return false;
    }
  }

  /// Add game to wishlist.
  Future<bool> addToWishlist(int gameId) async {
    try {
      await _userService.addToCollection(
        gameId: gameId,
        status: 'wishlist',
      );
      await fetchWishlist();
      await fetchStats();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to add game to wishlist.';
      notifyListeners();
      return false;
    }
  }

  /// Toggle wishlist status for a game.
  Future<bool> toggleWishlist(int gameId) async {
    if (isInWishlist(gameId)) {
      return await removeFromCollection(gameId);
    } else {
      return await addToWishlist(gameId);
    }
  }

  /// Set game as "Playing Now".
  Future<bool> setAsPlaying(int gameId) async {
    try {
      if (isInCollection(gameId) || isInWishlist(gameId)) {
        await _userService.updateCollectionItem(
          gameId: gameId,
          status: 'playing',
        );
      } else {
        await _userService.addToCollection(
          gameId: gameId,
          status: 'playing',
        );
      }
      await Future.wait([fetchPlayingNow(), fetchCollection(), fetchStats()]);
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game status.';
      notifyListeners();
      return false;
    }
  }

  /// Set game as "Completed".
  Future<bool> setAsCompleted(int gameId) async {
    try {
      if (isInCollection(gameId) || isInWishlist(gameId)) {
        await _userService.updateCollectionItem(
          gameId: gameId,
          status: 'completed',
        );
      } else {
        await _userService.addToCollection(
          gameId: gameId,
          status: 'completed',
        );
      }
      await Future.wait([fetchCompletedGames(), fetchCollection(), fetchStats()]);
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game status.';
      notifyListeners();
      return false;
    }
  }

  /// Update collection item.
  Future<bool> updateCollectionItem({
    required int gameId,
    String? status,
    String? format,
    int? hoursPlayed,
    String? personalNotes,
    int? rating,
  }) async {
    try {
      await _userService.updateCollectionItem(
        gameId: gameId,
        status: status,
        format: format,
        hoursPlayed: hoursPlayed,
        personalNotes: personalNotes,
        rating: rating,
      );
      if (status != null) {
        await _refreshForStatus(status);
      }
      await fetchCollection();
      await fetchStats();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game.';
      notifyListeners();
      return false;
    }
  }

  /// Remove game from collection.
  Future<bool> removeFromCollection(int gameId) async {
    try {
      await _userService.removeFromCollection(gameId);
      _collection.removeWhere((item) => item.gameId == gameId);
      _wishlist.removeWhere((item) => item.gameId == gameId);
      _playingNow.removeWhere((item) => item.gameId == gameId);
      _completedGames.removeWhere((item) => item.gameId == gameId);
      _collectionCache.remove(gameId);
      await fetchStats();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to remove game.';
      notifyListeners();
      return false;
    }
  }

  /// Check if a game is in the collection (any non-wishlist status).
  bool isInCollection(int gameId) {
    return _collection.any((item) => item.gameId == gameId && item.status != 'wishlist');
  }

  /// Check if a game is in the wishlist.
  bool isInWishlist(int gameId) {
    return _wishlist.any((item) => item.gameId == gameId);
  }

  /// Check if a game is currently being played.
  bool isPlaying(int gameId) {
    return _playingNow.any((item) => item.gameId == gameId) ||
        _collection.any((item) => item.gameId == gameId && item.status == 'playing');
  }

  /// Check if a game is completed.
  bool isCompleted(int gameId) {
    return _completedGames.any((item) => item.gameId == gameId) ||
        _collection.any((item) => item.gameId == gameId && item.status == 'completed');
  }

  /// Get the collection status for a specific game.
  String? getGameStatus(int gameId) {
    final item = _collectionCache[gameId];
    if (item != null) return item.status;
    // Fallback to list search
    for (final ci in _collection) {
      if (ci.gameId == gameId) return ci.status;
    }
    for (final ci in _wishlist) {
      if (ci.gameId == gameId) return ci.status;
    }
    return null;
  }

  /// Rebuild the lookup cache.
  void _rebuildCache() {
    _collectionCache.clear();
    for (final item in _collection) {
      _collectionCache[item.gameId] = item;
    }
    for (final item in _wishlist) {
      _collectionCache[item.gameId] = item;
    }
  }

  /// Refresh data based on the updated status.
  Future<void> _refreshForStatus(String status) async {
    switch (status) {
      case 'wishlist':
        await fetchWishlist();
        break;
      case 'playing':
        await fetchPlayingNow();
        break;
      case 'completed':
        await fetchCompletedGames();
        break;
      default:
        break;
    }
  }

  /// Clear all user data (on logout).
  void clearData() {
    _collection.clear();
    _wishlist.clear();
    _playingNow.clear();
    _completedGames.clear();
    _collectionCache.clear();
    _stats = CollectionStats();
    _userStats = UserStats();
    _error = null;
    notifyListeners();
  }

  /// Clear error.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
