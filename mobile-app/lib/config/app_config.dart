class AppConfig {
  AppConfig._();

  static const String appName = 'GameVault';
  static const String appVersion = '1.0.0';
  static const bool isDebug = true;

  /// The API base URL used at runtime.
  /// Defaults to [_defaultApiUrl] but can be changed via [setApiBaseUrl].
  static String _apiBaseUrl = _defaultApiUrl;

  /// Default API URL.
  /// For Android emulators 10.0.2.2 maps to the host machine's localhost.
  /// Change this to your Codespace public URL or production URL as needed.
  static const String _defaultApiUrl = 'http://10.0.2.2:3000/api';

  /// Returns the current API base URL.
  static String get apiBaseUrl => _apiBaseUrl;

  /// Override the API base URL at runtime (e.g. from a settings screen or
  /// environment variable).  Call this before any network requests.
  static void setApiBaseUrl(String url) {
    _apiBaseUrl = url;
  }

  static const String localApiUrl = 'http://10.0.2.2:3000/api';
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
