import 'package:flutter/foundation.dart';

import '../models/game.dart';
import '../services/game_service.dart';
import '../services/api_service.dart';

class GamesProvider extends ChangeNotifier {
  final GameService _gameService = GameService();

  // ── State ──
  List<Game> _games = [];
  List<Game> _searchResults = [];
  Game? _selectedGame;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _isSearching = false;
  String? _error;

  int _currentPage = 1;
  int _totalPages = 1;
  int _totalGames = 0;
  String? _currentSearch;
  String? _currentReleaseStatus;
  DateTime? _lastFetchTime;

  // Cache for individual games
  final Map<int, Game> _gameCache = {};

  // ── Getters ──
  List<Game> get games => _games;
  List<Game> get searchResults => _searchResults;
  Game? get selectedGame => _selectedGame;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get isSearching => _isSearching;
  String? get error => _error;
  bool get hasMore => _currentPage < _totalPages;
  int get totalGames => _totalGames;
  int get currentPage => _currentPage;
  bool get isCached => _lastFetchTime != null;

  /// Fetch games list (first page) with caching.
  Future<void> fetchGames({
    String? search,
    String? releaseStatus,
    String? sort,
    bool refresh = false,
    bool skipIfRecent = true,
  }) async {
    // Skip if recently fetched (unless refresh is true)
    if (!refresh && skipIfRecent && _lastFetchTime != null) {
      final timeSinceLastFetch = DateTime.now().difference(_lastFetchTime!);
      if (timeSinceLastFetch.inMinutes < 5) {
        debugPrint('🎮 Using cached games (fetched ${timeSinceLastFetch.inSeconds}s ago)');
        return;
      }
    }

    if (_isLoading && !refresh) return;

    _isLoading = true;
    _error = null;
    _currentSearch = search;
    _currentReleaseStatus = releaseStatus;
    if (refresh) {
      _games.clear();
    }
    notifyListeners();

    try {
      final result = await _gameService.getAllGames(
        page: 1,
        search: search,
        releaseStatus: releaseStatus,
        sort: sort,
      );
      _games = result.games;
      _currentPage = result.page;
      _totalPages = result.totalPages;
      _totalGames = result.total;
      _lastFetchTime = DateTime.now();

      // Cache individual games
      for (var game in _games) {
        _gameCache[game.id] = game;
      }
    } on ApiException catch (e) {
      _error = e.message;
      debugPrint('🎮 Games fetch error: ${e.message}');
    } catch (e) {
      _error = 'Failed to load games. Please try again.';
      debugPrint('🎮 Games fetch error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load next page with pagination.
  Future<void> loadMore() async {
    if (_isLoadingMore || !hasMore) return;

    _isLoadingMore = true;
    notifyListeners();

    try {
      final result = await _gameService.getAllGames(
        page: _currentPage + 1,
        search: _currentSearch,
        releaseStatus: _currentReleaseStatus,
      );
      _games.addAll(result.games);
      _currentPage = result.page;
      _totalPages = result.totalPages;
      _totalGames = result.total;

      // Cache individual games
      for (var game in result.games) {
        _gameCache[game.id] = game;
      }
    } catch (e) {
      debugPrint('🎮 Load more error: $e');
      _error = 'Failed to load more games. Please try again.';
    }

    _isLoadingMore = false;
    notifyListeners();
  }

  /// Search games by text query.
  Future<void> searchGames(String query) async {
    if (query.trim().isEmpty) {
      clearSearch();
      return;
    }

    _isSearching = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _gameService.searchGames(query: query);
      _searchResults = result.games;

      // Cache search results
      for (var game in _searchResults) {
        _gameCache[game.id] = game;
      }
    } on ApiException catch (e) {
      _error = e.message;
      debugPrint('🎮 Search error: ${e.message}');
    } catch (e) {
      _error = 'Search failed. Please try again.';
      debugPrint('🎮 Search error: $e');
    }

    _isSearching = false;
    notifyListeners();
  }

  /// Get single game details with cache.
  Future<void> getGameById(int id) async {
    // Check cache first
    if (_gameCache.containsKey(id)) {
      _selectedGame = _gameCache[id];
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedGame = await _gameService.getGameById(id);
      _gameCache[id] = _selectedGame!;
    } on ApiException catch (e) {
      _error = e.message;
      debugPrint('🎮 Game detail error: ${e.message}');
    } catch (e) {
      _error = 'Failed to load game details.';
      debugPrint('🎮 Game detail error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Clear search results.
  void clearSearch() {
    _searchResults.clear();
    _isSearching = false;
    notifyListeners();
  }

  /// Clear selected game.
  void clearSelectedGame() {
    _selectedGame = null;
    notifyListeners();
  }

  /// Clear error.
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Clear all caches
  void clearCaches() {
    _gameCache.clear();
    _games.clear();
    _searchResults.clear();
    _selectedGame = null;
    _lastFetchTime = null;
    debugPrint('🎮 All caches cleared');
    notifyListeners();
  }
}
