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
  bool _isLoadingWishlist = false;
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
  bool get isLoadingWishlist => _isLoadingWishlist;
  bool get isLoadingPlaying => _isLoadingPlaying;
  bool get isLoadingCompleted => _isLoadingCompleted;
  String? get error => _error;

  /// Fetch user collection (non-wishlist items).
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
      debugPrint('fetchCollection error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch wishlist items.
  Future<void> fetchWishlist() async {
    _isLoadingWishlist = true;
    _error = null;
    notifyListeners();

    try {
      _wishlist = await _userService.getCollection(status: 'wishlist', limit: 100);
      _rebuildCache();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load wishlist.';
      debugPrint('fetchWishlist error: $e');
    }

    _isLoadingWishlist = false;
    notifyListeners();
  }

  /// Fetch playing now items.
  Future<void> fetchPlayingNow() async {
    _isLoadingPlaying = true;
    _error = null;
    notifyListeners();

    try {
      _playingNow = await _userService.getCollection(status: 'playing', limit: 100);
      _rebuildCache();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load playing games.';
      debugPrint('fetchPlayingNow error: $e');
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
      _rebuildCache();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load completed games.';
      debugPrint('fetchCompletedGames error: $e');
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

  /// Fetch all user data in parallel (avoids nested loading flags).
  Future<void> fetchAllData() async {
    _isLoading = true;
    _isLoadingWishlist = true;
    _isLoadingPlaying = true;
    _isLoadingCompleted = true;
    _error = null;
    notifyListeners();

    try {
      await Future.wait<void>([
        _fetchCollectionSilent(),
        _fetchWishlistSilent(),
        _fetchPlayingNowSilent(),
        _fetchCompletedGamesSilent(),
        fetchStats(),
        fetchUserStats(),
      ], eagerError: false);
      _rebuildCache();
    } catch (e) {
      debugPrint('Failed to fetch all data: $e');
    }

    _isLoading = false;
    _isLoadingWishlist = false;
    _isLoadingPlaying = false;
    _isLoadingCompleted = false;
    notifyListeners();
  }

  // Silent versions of fetch methods (no loading flag changes, no notifyListeners).
  Future<void> _fetchCollectionSilent() async {
    try {
      _collection = await _userService.getCollection(limit: 200);
    } catch (e) {
      debugPrint('Silent fetchCollection error: $e');
    }
  }

  Future<void> _fetchWishlistSilent() async {
    try {
      _wishlist = await _userService.getCollection(status: 'wishlist', limit: 100);
    } catch (e) {
      debugPrint('Silent fetchWishlist error: $e');
    }
  }

  Future<void> _fetchPlayingNowSilent() async {
    try {
      _playingNow = await _userService.getCollection(status: 'playing', limit: 100);
    } catch (e) {
      debugPrint('Silent fetchPlayingNow error: $e');
    }
  }

  Future<void> _fetchCompletedGamesSilent() async {
    try {
      _completedGames = await _userService.getCollection(status: 'completed', limit: 100);
    } catch (e) {
      debugPrint('Silent fetchCompletedGames error: $e');
    }
  }

  /// Add game to collection (handles duplicates by updating status).
  Future<bool> addToCollection({
    required int gameId,
    String status = 'not_started',
    String format = 'digital',
  }) async {
    try {
      // If game already exists in any list, update status instead of adding
      if (_isGameInAnyList(gameId)) {
        await _userService.updateCollectionItem(
          gameId: gameId,
          status: status,
          format: format,
        );
      } else {
        await _userService.addToCollection(
          gameId: gameId,
          status: status,
          format: format,
        );
      }
      // Refresh relevant lists based on status
      await _refreshForStatus(status);
      await fetchCollection();
      await fetchStats();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to add game to collection.';
      debugPrint('addToCollection error: $e');
      notifyListeners();
      return false;
    }
  }

  /// Add game to wishlist (handles games already in collection).
  Future<bool> addToWishlist(int gameId) async {
    try {
      if (_isGameInAnyList(gameId)) {
        // Game exists somewhere — update its status to wishlist
        await _userService.updateCollectionItem(
          gameId: gameId,
          status: 'wishlist',
        );
      } else {
        await _userService.addToCollection(
          gameId: gameId,
          status: 'wishlist',
        );
      }
      await Future.wait([fetchWishlist(), fetchCollection(), fetchStats()]);
      _rebuildCache();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to add game to wishlist.';
      debugPrint('addToWishlist error: $e');
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
      if (_isGameInAnyList(gameId)) {
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
      _rebuildCache();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game status.';
      debugPrint('setAsPlaying error: $e');
      notifyListeners();
      return false;
    }
  }

  /// Set game as "Completed".
  Future<bool> setAsCompleted(int gameId) async {
    try {
      if (_isGameInAnyList(gameId)) {
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
      _rebuildCache();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game status.';
      debugPrint('setAsCompleted error: $e');
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
      _rebuildCache();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Failed to update game.';
      debugPrint('updateCollectionItem error: $e');
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
      debugPrint('removeFromCollection error: $e');
      notifyListeners();
      return false;
    }
  }

  /// Check if a game exists in any list (collection, wishlist, playing, completed).
  bool _isGameInAnyList(int gameId) {
    return _collectionCache.containsKey(gameId) ||
        _collection.any((item) => item.gameId == gameId) ||
        _wishlist.any((item) => item.gameId == gameId) ||
        _playingNow.any((item) => item.gameId == gameId) ||
        _completedGames.any((item) => item.gameId == gameId);
  }

  /// Check if a game is in the collection (any non-wishlist status).
  bool isInCollection(int gameId) {
    return _collection.any((item) => item.gameId == gameId && item.status != 'wishlist');
  }

  /// Check if a game is in the wishlist.
  bool isInWishlist(int gameId) {
    return _wishlist.any((item) => item.gameId == gameId) ||
        _collection.any((item) => item.gameId == gameId && item.status == 'wishlist');
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
    for (final ci in _playingNow) {
      if (ci.gameId == gameId) return ci.status;
    }
    for (final ci in _completedGames) {
      if (ci.gameId == gameId) return ci.status;
    }
    return null;
  }

  /// Rebuild the lookup cache from all lists.
  void _rebuildCache() {
    _collectionCache.clear();
    for (final item in _collection) {
      _collectionCache[item.gameId] = item;
    }
    for (final item in _wishlist) {
      _collectionCache[item.gameId] = item;
    }
    for (final item in _playingNow) {
      _collectionCache[item.gameId] = item;
    }
    for (final item in _completedGames) {
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
