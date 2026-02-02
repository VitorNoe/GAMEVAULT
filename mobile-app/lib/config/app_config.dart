/// Application configuration constants
class AppConfig {
  AppConfig._();

  /// App name
  static const String appName = 'GameVault';

  /// App version
  static const String appVersion = '1.0.0';

  /// API Base URL - Change this to your backend URL
  /// For local development: http://10.0.2.2:3001/api (Android emulator)
  /// For physical device: use your computer's IP address
  static const String apiBaseUrl = 'http://10.0.2.2:3001/api';

  /// Alternative URLs for different environments
  static const String localApiUrl = 'http://10.0.2.2:3001/api';
  static const String productionApiUrl = 'https://your-production-url.com/api';

  /// Request timeout duration
  static const Duration requestTimeout = Duration(seconds: 30);

  /// Token storage key
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  /// Pagination
  static const int defaultPageSize = 20;
}
