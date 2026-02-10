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

  /// Fetch games list (first page).
  Future<void> fetchGames({
    String? search,
    String? releaseStatus,
    String? sort,
    bool refresh = false,
  }) async {
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
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load games. Please try again.';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load next page.
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
    } catch (e) {
      debugPrint('Failed to load more games: $e');
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
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Search failed. Please try again.';
    }

    _isSearching = false;
    notifyListeners();
  }

  /// Get single game details.
  Future<void> getGameById(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedGame = await _gameService.getGameById(id);
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load game details.';
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
}
