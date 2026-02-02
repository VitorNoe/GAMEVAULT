import 'package:flutter/material.dart';
import '../models/game.dart';
import '../services/game_service.dart';

/// Games state provider
class GamesProvider extends ChangeNotifier {
  final GameService _gameService = GameService();

  List<Game> _games = [];
  List<Game> _searchResults = [];
  Game? _selectedGame;
  bool _isLoading = false;
  bool _isSearching = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  int _total = 0;

  List<Game> get games => _games;
  List<Game> get searchResults => _searchResults;
  Game? get selectedGame => _selectedGame;
  bool get isLoading => _isLoading;
  bool get isSearching => _isSearching;
  String? get error => _error;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get total => _total;
  bool get hasMore => _currentPage < _totalPages;

  /// Fetch games list
  Future<void> fetchGames({
    bool refresh = false,
    String? search,
    String? releaseStatus,
    String? availabilityStatus,
    int? year,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _games = [];
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _gameService.getAllGames(
        page: _currentPage,
        search: search,
        releaseStatus: releaseStatus,
        availabilityStatus: availabilityStatus,
        year: year,
      );

      if (refresh) {
        _games = result.games;
      } else {
        _games = [..._games, ...result.games];
      }

      _total = result.total;
      _totalPages = result.totalPages;
      _currentPage = result.page;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load more games
  Future<void> loadMore() async {
    if (!hasMore || _isLoading) return;
    _currentPage++;
    await fetchGames();
  }

  /// Search games
  Future<void> searchGames(String query) async {
    if (query.isEmpty) {
      _searchResults = [];
      _isSearching = false;
      notifyListeners();
      return;
    }

    _isSearching = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _gameService.searchGames(query);
      _searchResults = result.games;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isSearching = false;
      notifyListeners();
    }
  }

  /// Get game by ID
  Future<void> getGameById(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedGame = await _gameService.getGameById(id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear selected game
  void clearSelectedGame() {
    _selectedGame = null;
    notifyListeners();
  }

  /// Clear search results
  void clearSearch() {
    _searchResults = [];
    _isSearching = false;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
