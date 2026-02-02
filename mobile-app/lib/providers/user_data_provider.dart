import 'package:flutter/material.dart';
import '../models/game.dart';
import '../services/user_service.dart';

/// User data provider (collection, wishlist, stats)
class UserDataProvider extends ChangeNotifier {
  final UserService _userService = UserService();

  List<Game> _collection = [];
  List<Game> _wishlist = [];
  UserStats? _stats;
  bool _isLoadingCollection = false;
  bool _isLoadingWishlist = false;
  bool _isLoadingStats = false;
  String? _error;

  List<Game> get collection => _collection;
  List<Game> get wishlist => _wishlist;
  UserStats? get stats => _stats;
  bool get isLoadingCollection => _isLoadingCollection;
  bool get isLoadingWishlist => _isLoadingWishlist;
  bool get isLoadingStats => _isLoadingStats;
  String? get error => _error;

  /// Fetch user's collection
  Future<void> fetchCollection({bool refresh = false}) async {
    if (_isLoadingCollection) return;

    _isLoadingCollection = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _userService.getCollection();
      _collection = result.games;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoadingCollection = false;
      notifyListeners();
    }
  }

  /// Add game to collection
  Future<bool> addToCollection(int gameId) async {
    try {
      final success = await _userService.addToCollection(gameId);
      if (success) {
        await fetchCollection(refresh: true);
        await fetchStats();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Remove game from collection
  Future<bool> removeFromCollection(int gameId) async {
    try {
      final success = await _userService.removeFromCollection(gameId);
      if (success) {
        _collection.removeWhere((game) => game.id == gameId);
        await fetchStats();
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Fetch user's wishlist
  Future<void> fetchWishlist({bool refresh = false}) async {
    if (_isLoadingWishlist) return;

    _isLoadingWishlist = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _userService.getWishlist();
      _wishlist = result.games;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoadingWishlist = false;
      notifyListeners();
    }
  }

  /// Add game to wishlist
  Future<bool> addToWishlist(int gameId) async {
    try {
      final success = await _userService.addToWishlist(gameId);
      if (success) {
        await fetchWishlist(refresh: true);
        await fetchStats();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Remove game from wishlist
  Future<bool> removeFromWishlist(int gameId) async {
    try {
      final success = await _userService.removeFromWishlist(gameId);
      if (success) {
        _wishlist.removeWhere((game) => game.id == gameId);
        await fetchStats();
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Fetch user stats
  Future<void> fetchStats() async {
    _isLoadingStats = true;
    notifyListeners();

    try {
      _stats = await _userService.getUserStats();
    } catch (e) {
      // Ignore stats errors
    } finally {
      _isLoadingStats = false;
      notifyListeners();
    }
  }

  /// Check if game is in collection
  bool isInCollection(int gameId) {
    return _collection.any((game) => game.id == gameId);
  }

  /// Check if game is in wishlist
  bool isInWishlist(int gameId) {
    return _wishlist.any((game) => game.id == gameId);
  }

  /// Clear all data (on logout)
  void clearData() {
    _collection = [];
    _wishlist = [];
    _stats = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
