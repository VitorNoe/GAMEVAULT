import 'package:flutter/foundation.dart';

import '../models/collection_item.dart';
import '../services/user_service.dart';
import '../services/api_service.dart';

class UserDataProvider extends ChangeNotifier {
  final UserService _userService = UserService();

  // ── State ──
  List<CollectionItem> _collection = [];
  List<CollectionItem> _wishlist = [];
  CollectionStats _stats = CollectionStats();
  UserStats _userStats = UserStats();
  bool _isLoading = false;
  String? _error;

  // ── Getters ──
  List<CollectionItem> get collection => _collection;
  List<CollectionItem> get wishlist => _wishlist;
  CollectionStats get stats => _stats;
  UserStats get userStats => _userStats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch user collection.
  Future<void> fetchCollection({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _collection = await _userService.getCollection(status: status, limit: 100);
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
      await fetchCollection();
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

  /// Check if a game is in the collection.
  bool isInCollection(int gameId) {
    return _collection.any((item) => item.gameId == gameId && item.status != 'wishlist');
  }

  /// Check if a game is in the wishlist.
  bool isInWishlist(int gameId) {
    return _wishlist.any((item) => item.gameId == gameId);
  }

  /// Clear all user data (on logout).
  void clearData() {
    _collection.clear();
    _wishlist.clear();
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
