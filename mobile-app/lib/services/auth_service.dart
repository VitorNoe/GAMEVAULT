import '../models/user.dart';
import 'api_service.dart';

/// Authentication service
class AuthService {
  final ApiService _api = ApiService();

  /// Login with email and password
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post(
        '/auth/login',
        body: {
          'email': email,
          'password': password,
        },
        requiresAuth: false,
      );

      if (response['success'] == true && response['data'] != null) {
        final token = response['data']['token'] as String;
        final userData = response['data']['user'];
        final user = User.fromJson(userData);

        await _api.saveToken(token);

        return AuthResult(
          success: true,
          user: user,
          token: token,
        );
      }

      return AuthResult(
        success: false,
        message: response['message'] ?? 'Login failed',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }

  /// Register a new user
  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post(
        '/auth/register',
        body: {
          'name': name,
          'email': email,
          'password': password,
        },
        requiresAuth: false,
      );

      if (response['success'] == true && response['data'] != null) {
        final token = response['data']['token'] as String;
        final userData = response['data']['user'];
        final user = User.fromJson(userData);

        await _api.saveToken(token);

        return AuthResult(
          success: true,
          user: user,
          token: token,
        );
      }

      return AuthResult(
        success: false,
        message: response['message'] ?? 'Registration failed',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }

  /// Get current user
  Future<User?> getCurrentUser() async {
    try {
      final token = await _api.getToken();
      if (token == null) return null;

      final response = await _api.get('/auth/me');

      if (response['success'] == true && response['data'] != null) {
        return User.fromJson(response['data']['user']);
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await _api.deleteToken();
    }
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _api.getToken();
    return token != null;
  }
}

/// Auth result model
class AuthResult {
  final bool success;
  final User? user;
  final String? token;
  final String? message;

  AuthResult({
    required this.success,
    this.user,
    this.token,
    this.message,
  });
}
