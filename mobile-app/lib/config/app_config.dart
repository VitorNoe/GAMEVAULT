import 'dart:io' show Platform;

class AppConfig {
  AppConfig._();

  static const String appName = 'GameVault';
  static const String appVersion = '1.0.0';
  static const bool isDebug = true;

  /// Returns the API base URL based on the platform.
  /// Android emulators use 10.0.2.2 to reach the host machine's localhost.
  static String get apiBaseUrl {
    if (isDebug) {
      try {
        if (Platform.isAndroid) {
          return 'http://10.0.2.2:3001/api';
        }
        if (Platform.isIOS) {
          return 'http://localhost:3001/api';
        }
      } catch (_) {}
      return 'http://localhost:3001/api';
    }
    return productionApiUrl;
  }

  static const String localApiUrl = 'http://10.0.2.2:3001/api';
  static const String productionApiUrl = 'https://your-production-url.com/api';

  static const Duration requestTimeout = Duration(seconds: 30);
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const int defaultPageSize = 20;

  // Collection status values
  static const List<String> collectionStatuses = [
    'playing',
    'completed',
    'paused',
    'abandoned',
    'not_started',
    'wishlist',
    'backlog',
  ];

  // Collection format values
  static const List<String> collectionFormats = ['physical', 'digital'];
}
