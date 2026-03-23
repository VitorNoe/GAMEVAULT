import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

enum ApiEnvironment {
  emulator,
  localDevice,
  production,
}

class AppConfig {
  AppConfig._();

  static const String appName = 'GameVault';
  static const String appVersion = '1.0.0';
  static const bool isDebug = true;

  // ── API Configuration ──
  
  /// Current API environment
  static ApiEnvironment _environment = ApiEnvironment.emulator;
  
  /// The API base URL used at runtime.
  /// Defaults to [_getDefaultApiUrl] based on environment
  static String _apiBaseUrl = _getDefaultApiUrl();

  /// Get default API URL based on current environment
  static String _getDefaultApiUrl() {
    switch (_environment) {
      case ApiEnvironment.emulator:
        if (kIsWeb) {
          return 'http://localhost:3000/api';
        } else if (Platform.isAndroid) {
          // Android Emulator uses 10.0.2.2 to access host localhost
          return 'http://10.0.2.2:3000/api';
        }
        // iOS Simulator, Windows, macOS, Linux desktop apps can use localhost directly
        return 'http://127.0.0.1:3000/api';
      case ApiEnvironment.localDevice:
        // For real devices on same network, use your machine's IP
        // ATENÇÃO: Se for testar no seu celular físico (Android/iOS), 
        // mude este IP para o IP da sua máquina na rede Wi-Fi (ex: 192.168.0.X)
        return 'http://192.168.1.100:3000/api';
      case ApiEnvironment.production:
        return 'https://api.gamevault.com/api';
    }
  }

  /// Returns the current API base URL.
  static String get apiBaseUrl => _apiBaseUrl;

  /// Set the API environment and update base URL accordingly
  static void setEnvironment(ApiEnvironment environment) {
    _environment = environment;
    _apiBaseUrl = _getDefaultApiUrl();
  }

  /// Override the API base URL at runtime for local device development.
  /// Pass your local machine IP address (e.g., '192.168.1.100')
  static void setLocalDeviceUrl(String ipAddress) {
    _environment = ApiEnvironment.localDevice;
    _apiBaseUrl = 'http://$ipAddress:3000/api';
  }

  /// Override the API base URL completely.
  static void setCustomApiUrl(String url) {
    _apiBaseUrl = url;
  }

  static const String emulatorApiUrl = 'http://10.0.2.2:3000/api';
  static const String productionApiUrl = 'https://api.gamevault.com/api';

  /// Request timeout - increased to handle slow connections
  static const Duration requestTimeout = Duration(seconds: 30);
  
  /// Retry configuration
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(milliseconds: 500);
  
  /// Token storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String lastSyncKey = 'last_sync_timestamp';
  
  /// Pagination defaults
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // ── Collection status values ──
  static const List<String> collectionStatuses = [
    'playing',
    'completed',
    'paused',
    'abandoned',
    'not_started',
    'wishlist',
    'backlog',
  ];

  /// Collection format values
  static const List<String> collectionFormats = ['physical', 'digital'];
  
  // ── API Response Timeouts (ms) ──
  static const int connectionTimeout = 30000;
  static const int readTimeout = 30000;
  static const int writeTimeout = 30000;
  
  // ── Cache Configuration ──
  static const Duration cacheExpiration = Duration(hours: 1);
  static const int maxCacheSize = 50; // Max items per cache bucket
}
