import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get error => _error;

  AuthProvider() {
    _checkAuthState();
  }

  /// Check stored auth state on app start.
  Future<void> _checkAuthState() async {
    _isLoading = true;
    notifyListeners();

    try {
      final hasToken = await _authService.isLoggedIn();
      if (hasToken) {
        // Try to restore from cache first
        _user = await _authService.restoreUser();
        _isAuthenticated = _user != null;
        notifyListeners();

        // Then refresh from API
        try {
          final freshUser = await _authService.getCurrentUser();
          _user = freshUser;
          _isAuthenticated = true;
        } on ApiException catch (e) {
          if (e.statusCode == 401) {
            _user = null;
            _isAuthenticated = false;
          }
        } catch (_) {
          // Keep cached user if network fails
        }
      }
    } catch (e) {
      debugPrint('Auth check failed: $e');
      _user = null;
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Login with email and password.
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _authService.login(
        email: email,
        password: password,
      );
      _user = result.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Register a new account.
  Future<bool> register({
    required String name,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _authService.register(
        name: name,
        email: email,
        password: password,
      );
      _user = result.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout and clear session.
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  /// Refresh user profile from API.
  Future<void> refreshUser() async {
    try {
      final user = await _authService.getCurrentUser();
      _user = user;
      notifyListeners();
    } catch (_) {}
  }

  /// Clear error message.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
