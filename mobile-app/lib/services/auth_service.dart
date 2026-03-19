import 'dart:convert';

import '../config/api_endpoints.dart';
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
  ///
  /// Returns [AuthResult] containing the authenticated user and token.
  /// Throws [ApiException] on failure.
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      ApiEndpoints.login,
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
  ///
  /// The backend register endpoint does NOT return a token — it only creates
  /// the user. After a successful registration we automatically log in so
  /// the caller receives a valid [AuthResult] with a token.
  ///
  /// Throws [ApiException] on failure.
  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    // Step 1: register the new account
    await _api.post(
      ApiEndpoints.register,
      body: {'name': name, 'email': email, 'password': password},
    );

    // Step 2: immediately log in to obtain a token
    return login(email: email, password: password);
  }

  /// Get current authenticated user profile.
  ///
  /// Requires valid authentication token.
  /// Throws [ApiException] if not authenticated or on network error.
  Future<User> getCurrentUser() async {
    final response = await _api.get(ApiEndpoints.me, auth: true);
    final data = response['data'] as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// Logout and clear stored credentials.
  ///
  /// Always clears local data even if API call fails.
  Future<void> logout() async {
    try {
      await _api.post(ApiEndpoints.logout, auth: true);
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
  ///
  /// Returns null if no stored user data found.
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

  /// Verify email address.
  ///
  /// Throws [ApiException] on failure.
  Future<void> verifyEmail(String token) async {
    await _api.post(
      ApiEndpoints.verifyEmail,
      body: {'token': token},
    );
  }

  /// Resend email verification.
  ///
  /// Throws [ApiException] on failure.
  Future<void> resendVerification(String email) async {
    await _api.post(
      ApiEndpoints.resendVerification,
      body: {'email': email},
    );
  }

  /// Request password reset.
  ///
  /// Throws [ApiException] on failure.
  Future<void> forgotPassword(String email) async {
    await _api.post(
      ApiEndpoints.forgotPassword,
      body: {'email': email},
    );
  }

  /// Reset password with token.
  ///
  /// Throws [ApiException] on failure.
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _api.post(
      ApiEndpoints.resetPassword,
      body: {'token': token, 'password': newPassword},
    );
  }

  /// Refresh authentication token.
  ///
  /// Returns new token and saves it automatically.
  /// Throws [ApiException] if refresh fails.
  Future<String> refreshToken() async {
    final response = await _api.post(ApiEndpoints.refreshToken, auth: true);
    final newToken = response['data']['token'] as String;
    await _api.saveToken(newToken);
    return newToken;
  }
}
