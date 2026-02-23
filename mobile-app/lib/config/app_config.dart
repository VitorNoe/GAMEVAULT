class AppConfig {
  AppConfig._();

  static const String appName = 'GameVault';
  static const String appVersion = '1.0.0';
  static const bool isDebug = true;

  /// Codespace public URL for the backend API.
  /// This URL is accessible from any device (including Android emulators)
  /// without needing 10.0.2.2 or localhost workarounds.
  static const String codespaceApiUrl =
      'https://organic-waddle-v6pqv4rj459g2wpj7-3001.app.github.dev/api';

  /// Returns the API base URL.
  /// In debug mode, uses the Codespace public URL so the Android emulator
  /// can reach the backend running in GitHub Codespaces.
  static String get apiBaseUrl {
    if (isDebug) {
      return codespaceApiUrl;
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
