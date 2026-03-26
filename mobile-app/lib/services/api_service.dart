import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

import '../config/app_config.dart';

/// Custom API exception with status code and message.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? body;
  final bool isNetworkError;
  final bool isTimeout;

  ApiException(
    this.message, {
    this.statusCode,
    this.body,
    this.isNetworkError = false,
    this.isTimeout = false,
  });

  @override
  String toString() => message;
}

/// Simple in-memory cache for GET requests
class _CacheEntry {
  final Map<String, dynamic> data;
  final DateTime createdAt;

  _CacheEntry(this.data) : createdAt = DateTime.now();

  bool get isExpired =>
      DateTime.now().difference(createdAt) > AppConfig.cacheExpiration;
}

/// Singleton HTTP client for communicating with the GameVault API with retry logic.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final http.Client _client;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final Map<String, _CacheEntry> _cache = {};

  ApiService._internal() {
    _client = _createHttpClient();
  }

  /// Create HTTP client with SSL bypass for development (GitHub Codespaces)
  /// In production, use the standard HTTP client with certificate validation
  http.Client _createHttpClient() {
    if (AppConfig.isDebug && (AppConfig.apiBaseUrl.contains('codespaces') || 
        AppConfig.apiBaseUrl.contains('github.dev'))) {
      // For GitHub Codespaces with self-signed certificates
      final httpClient = HttpClient()
        ..badCertificateCallback = (cert, host, port) => true;
      return IOClient(httpClient);
    }
    // Standard HTTP client for production/localhost
    return http.Client();
  }

  String get _baseUrl => AppConfig.apiBaseUrl;

  // ── Logging ──

  void _log(String message, {String level = 'INFO'}) {
    if (kDebugMode) {
      const String prefix = '🎮 [GameVault API]';
      print('$prefix [$level] $message');
    }
  }

  // ── Cache management ──

  void _setCacheEntry(String key, Map<String, dynamic> data) {
    if (_cache.length >= AppConfig.maxCacheSize) {
      // Remove oldest entry
      _cache.remove(_cache.keys.first);
    }
    _cache[key] = _CacheEntry(data);
    _log('Cache hit stored: $key');
  }

  _CacheEntry? _getCacheEntry(String key) {
    final entry = _cache[key];
    if (entry != null && !entry.isExpired) {
      _log('Cache hit retrieved: $key');
      return entry;
    } else if (entry != null) {
      _cache.remove(key);
      _log('Cache entry expired: $key');
    }
    return null;
  }

  void clearCache() {
    _cache.clear();
    _log('Cache cleared');
  }

  // ── Token management ──

  Future<String?> getToken() async {
    try {
      final token = await _storage.read(key: AppConfig.tokenKey);
      return token;
    } catch (e) {
      _log('Error reading token: $e', level: 'ERROR');
      return null;
    }
  }

  Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: AppConfig.tokenKey, value: token);
      _log('Token saved successfully');
    } catch (e) {
      _log('Error saving token: $e', level: 'ERROR');
    }
  }

  Future<void> deleteToken() async {
    try {
      await _storage.delete(key: AppConfig.tokenKey);
      _log('Token deleted successfully');
    } catch (e) {
      _log('Error deleting token: $e', level: 'ERROR');
    }
  }

  Future<void> saveUserData(String userData) async {
    try {
      await _storage.write(key: AppConfig.userKey, value: userData);
      _log('User data saved successfully');
    } catch (e) {
      _log('Error saving user data: $e', level: 'ERROR');
    }
  }

  Future<String?> getUserData() async {
    try {
      return await _storage.read(key: AppConfig.userKey);
    } catch (e) {
      _log('Error reading user data: $e', level: 'ERROR');
      return null;
    }
  }

  Future<void> deleteUserData() async {
    try {
      await _storage.delete(key: AppConfig.userKey);
      _log('User data deleted successfully');
    } catch (e) {
      _log('Error deleting user data: $e', level: 'ERROR');
    }
  }

  // ── Headers ──

  Future<Map<String, String>> _buildHeaders({bool auth = false}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'GameVault/${AppConfig.appVersion}',
      'X-App-Version': AppConfig.appVersion,
    };

    if (auth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // ── Retry logic ──

  Future<T> _executeWithRetry<T>(
    Future<T> Function() operation, {
    required String operationName,
  }) async {
    int attempt = 0;
    Exception? lastException;

    while (attempt < AppConfig.maxRetries) {
      try {
        _log('$operationName - Attempt ${attempt + 1}/${AppConfig.maxRetries}');
        return await operation();
      } on ApiException catch (e) {
        lastException = e;

        // Don't retry on authentication or validation errors
        if (e.statusCode == 401 || e.statusCode == 403 || e.statusCode == 422) {
          _log(
            '$operationName - Not retrying error ${e.statusCode}',
            level: 'WARN',
          );
          rethrow;
        }

        // Don't retry if it's not a network error and not a timeout
        if (!e.isNetworkError && !e.isTimeout) {
          _log('$operationName - Not retrying non-network error', level: 'WARN');
          rethrow;
        }

        attempt++;
        if (attempt < AppConfig.maxRetries) {
          final waitTime =
              AppConfig.retryDelay * (1 << (attempt - 1)); // Exponential backoff
          _log(
            '$operationName - Retrying after ${waitTime.inMilliseconds}ms',
            level: 'WARN',
          );
          await Future.delayed(waitTime);
        }
      } catch (e) {
        lastException = e as Exception;
        rethrow;
      }
    }

    _log(
      '$operationName - Failed after ${AppConfig.maxRetries} attempts',
      level: 'ERROR',
    );
    throw lastException ?? Exception('Unknown error');
  }

  // ── Response handler ──

  Map<String, dynamic> _handleResponse(http.Response response) {
    Map<String, dynamic> body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      _log(
        'Failed to decode response: ${response.statusCode}',
        level: 'ERROR',
      );
      throw ApiException(
        'Unexpected server response (${response.statusCode})',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final message = body['message'] as String? ??
        body['error'] as String? ??
        'Request failed (${response.statusCode})';

    _log('API Error ${response.statusCode}: $message', level: 'ERROR');

    if (response.statusCode == 401) {
      // Session expired
      deleteToken();
      deleteUserData();
      throw ApiException(
        'Session expired. Please login again.',
        statusCode: 401,
        body: body,
      );
    }

    if (response.statusCode == 429) {
      // Rate limited
      throw ApiException(
        'Too many requests. Please try again later.',
        statusCode: 429,
        body: body,
      );
    }

    throw ApiException(message, statusCode: response.statusCode, body: body);
  }

  // ── HTTP methods ──

  Future<Map<String, dynamic>> get(
    String path, {
    bool auth = false,
    Map<String, String>? queryParams,
    bool useCache = true,
  }) async {
    return _executeWithRetry(
      () async {
        var uri = Uri.parse('$_baseUrl$path');
        if (queryParams != null && queryParams.isNotEmpty) {
          uri = uri.replace(queryParameters: queryParams);
        }

        final cacheKey = '$path?${queryParams?.toString() ?? ''}';

        // Check cache for GET requests
        if (useCache) {
          final cached = _getCacheEntry(cacheKey);
          if (cached != null) {
            return cached.data;
          }
        }

        try {
          final headers = await _buildHeaders(auth: auth);
          _log('GET $path');

          final response = await _client.get(uri, headers: headers).timeout(
                AppConfig.requestTimeout,
                onTimeout: () {
                  _log('GET $path - Timeout', level: 'ERROR');
                  throw TimeoutException('Request timeout');
                },
              );

          final data = _handleResponse(response);

          // Cache successful GET responses
          if (useCache) {
            _setCacheEntry(cacheKey, data);
          }

          return data;
        } on SocketException catch (e) {
          throw ApiException(
            'No internet connection. Please check your network.',
            isNetworkError: true,
          );
        } on TimeoutException catch (e) {
          throw ApiException(
            'Request timeout. Please check your connection and try again.',
            isTimeout: true,
          );
        } on http.ClientException catch (e) {
          throw ApiException(
            'Network error. Please try again.',
            isNetworkError: true,
          );
        }
      },
      operationName: 'GET $path',
    );
  }

  Future<Map<String, dynamic>> post(
    String path, {
    bool auth = false,
    Map<String, dynamic>? body,
  }) async {
    return _executeWithRetry(
      () async {
        try {
          final uri = Uri.parse('$_baseUrl$path');
          final headers = await _buildHeaders(auth: auth);
          final bodyJson = body != null ? jsonEncode(body) : null;

          _log('POST $path');

          final response = await _client
              .post(uri, headers: headers, body: bodyJson)
              .timeout(
                AppConfig.requestTimeout,
                onTimeout: () {
                  _log('POST $path - Timeout', level: 'ERROR');
                  throw TimeoutException('Request timeout');
                },
              );

          // Clear cache on POST (data mutation)
          clearCache();

          return _handleResponse(response);
        } on SocketException catch (e) {
          throw ApiException(
            'No internet connection. Please check your network.',
            isNetworkError: true,
          );
        } on TimeoutException catch (e) {
          throw ApiException(
            'Request timeout. Please check your connection and try again.',
            isTimeout: true,
          );
        } on http.ClientException catch (e) {
          throw ApiException(
            'Network error. Please try again.',
            isNetworkError: true,
          );
        }
      },
      operationName: 'POST $path',
    );
  }

  Future<Map<String, dynamic>> put(
    String path, {
    bool auth = false,
    Map<String, dynamic>? body,
  }) async {
    return _executeWithRetry(
      () async {
        try {
          final uri = Uri.parse('$_baseUrl$path');
          final headers = await _buildHeaders(auth: auth);
          final bodyJson = body != null ? jsonEncode(body) : null;

          _log('PUT $path');

          final response = await _client
              .put(uri, headers: headers, body: bodyJson)
              .timeout(
                AppConfig.requestTimeout,
                onTimeout: () {
                  _log('PUT $path - Timeout', level: 'ERROR');
                  throw TimeoutException('Request timeout');
                },
              );

          // Clear cache on PUT (data mutation)
          clearCache();

          return _handleResponse(response);
        } on SocketException catch (e) {
          throw ApiException(
            'No internet connection. Please check your network.',
            isNetworkError: true,
          );
        } on TimeoutException catch (e) {
          throw ApiException(
            'Request timeout. Please check your connection and try again.',
            isTimeout: true,
          );
        } on http.ClientException catch (e) {
          throw ApiException(
            'Network error. Please try again.',
            isNetworkError: true,
          );
        }
      },
      operationName: 'PUT $path',
    );
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    bool auth = false,
  }) async {
    return _executeWithRetry(
      () async {
        try {
          final uri = Uri.parse('$_baseUrl$path');
          final headers = await _buildHeaders(auth: auth);

          _log('DELETE $path');

          final response = await _client.delete(uri, headers: headers).timeout(
                AppConfig.requestTimeout,
                onTimeout: () {
                  _log('DELETE $path - Timeout', level: 'ERROR');
                  throw TimeoutException('Request timeout');
                },
              );

          // Clear cache on DELETE (data mutation)
          clearCache();

          return _handleResponse(response);
        } on SocketException catch (e) {
          throw ApiException(
            'No internet connection. Please check your network.',
            isNetworkError: true,
          );
        } on TimeoutException catch (e) {
          throw ApiException(
            'Request timeout. Please check your connection and try again.',
            isTimeout: true,
          );
        } on http.ClientException catch (e) {
          throw ApiException(
            'Network error. Please try again.',
            isNetworkError: true,
          );
        }
      },
      operationName: 'DELETE $path',
    );
  }

  /// Get API base URL (useful for debugging)
  String getApiUrl() => _baseUrl;

  /// Set new API URL at runtime
  void setApiUrl(String url) {
    AppConfig.setCustomApiUrl(url);
    clearCache(); // Clear cache when switching servers
    _log('API URL changed to: $url');
  }
}
