import 'dart:convert';

import '../models/user.dart';
import 'api_service.dart';

class AuthResult {
  final User user;
  final String token;

  AuthResult({required this.user, required this.token});
}

class AuthService {
  final ApiService _api = ApiService();

  /// Login with email and password.
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '/auth/login',
      body: {'email': email, 'password': password},
    );

    final data = response['data'] as Map<String, dynamic>;
    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    final token = data['token'] as String;

    await _api.saveToken(token);
    await _api.saveUserData(jsonEncode(user.toJson()));

    return AuthResult(user: user, token: token);
  }

  /// Register a new account.
  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '/auth/register',
      body: {'name': name, 'email': email, 'password': password},
    );

    final data = response['data'] as Map<String, dynamic>;
    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    final token = data['token'] as String;

    await _api.saveToken(token);
    await _api.saveUserData(jsonEncode(user.toJson()));

    return AuthResult(user: user, token: token);
  }

  /// Get current authenticated user profile.
  Future<User> getCurrentUser() async {
    final response = await _api.get('/auth/me', auth: true);
    final data = response['data'] as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// Logout and clear stored credentials.
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Even if API call fails, clear local data
    }
    await _api.deleteToken();
    await _api.deleteUserData();
  }

  /// Check if user has a stored auth token.
  Future<bool> isLoggedIn() async {
    final token = await _api.getToken();
    return token != null && token.isNotEmpty;
  }

  /// Try to restore user from stored data.
  Future<User?> restoreUser() async {
    final userData = await _api.getUserData();
    if (userData != null) {
      try {
        return User.fromJson(jsonDecode(userData) as Map<String, dynamic>);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}
