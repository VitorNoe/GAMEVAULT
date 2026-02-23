import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

/// Custom API exception with status code and message.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? body;

  ApiException(this.message, {this.statusCode, this.body});

  @override
  String toString() => message;
}

/// Singleton HTTP client for communicating with the GameVault API.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final http.Client _client = http.Client();

  String get _baseUrl => AppConfig.apiBaseUrl;

  // ── Token management ──

  Future<String?> getToken() async {
    try {
      return await _storage.read(key: AppConfig.tokenKey);
    } catch (e) {
      debugPrint('Error reading token: $e');
      return null;
    }
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConfig.tokenKey, value: token);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: AppConfig.tokenKey);
  }

  Future<void> saveUserData(String userData) async {
    await _storage.write(key: AppConfig.userKey, value: userData);
  }

  Future<String?> getUserData() async {
    try {
      return await _storage.read(key: AppConfig.userKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteUserData() async {
    await _storage.delete(key: AppConfig.userKey);
  }

  // ── Headers ──

  Future<Map<String, String>> _buildHeaders({bool auth = false}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // ── Response handler ──

  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final message =
        body['message'] as String? ?? 'Request failed (${response.statusCode})';

    if (response.statusCode == 401) {
      deleteToken();
      deleteUserData();
      throw ApiException('Session expired. Please login again.',
          statusCode: 401, body: body);
    }

    throw ApiException(message, statusCode: response.statusCode, body: body);
  }

  // ── HTTP methods ──

  Future<Map<String, dynamic>> get(
    String path, {
    bool auth = false,
    Map<String, String>? queryParams,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$path').replace(queryParameters: queryParams);
      final headers = await _buildHeaders(auth: auth);
      final response = await _client
          .get(uri, headers: headers)
          .timeout(AppConfig.requestTimeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No internet connection. Please check your network.');
    } on http.ClientException {
      throw ApiException('Network error. Please try again.');
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    bool auth = false,
    Map<String, dynamic>? body,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$path');
      final headers = await _buildHeaders(auth: auth);
      final response = await _client
          .post(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(AppConfig.requestTimeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No internet connection. Please check your network.');
    } on http.ClientException {
      throw ApiException('Network error. Please try again.');
    }
  }

  Future<Map<String, dynamic>> put(
    String path, {
    bool auth = false,
    Map<String, dynamic>? body,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$path');
      final headers = await _buildHeaders(auth: auth);
      final response = await _client
          .put(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(AppConfig.requestTimeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No internet connection. Please check your network.');
    } on http.ClientException {
      throw ApiException('Network error. Please try again.');
    }
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    bool auth = false,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$path');
      final headers = await _buildHeaders(auth: auth);
      final response = await _client
          .delete(uri, headers: headers)
          .timeout(AppConfig.requestTimeout);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('No internet connection. Please check your network.');
    } on http.ClientException {
      throw ApiException('Network error. Please try again.');
    }
  }
}
