import 'dart:io' show Platform;

/// Application configuration constants
class AppConfig {
  AppConfig._();

  /// App name
  static const String appName = 'GameVault';

  /// App version
  static const String appVersion = '1.0.0';

  /// Debug mode flag
  static const bool isDebug = true; // Set to false for production

  /// API Base URL
  /// Para emulador Android: http://10.0.2.2:3001/api
  /// Para dispositivo físico: use o IP do seu computador
  /// Para produção: use a URL do servidor
  static String get apiBaseUrl {
    if (isDebug) {
      // Detecta se está rodando no Android
      try {
        if (Platform.isAndroid) {
          // Emulador Android usa 10.0.2.2 para acessar o localhost do host
          return 'http://10.0.2.2:3001/api';
        }
      } catch (_) {
        // Se não conseguir detectar, assume web ou outro
      }
      // Para iOS Simulator ou Web, use localhost
      return 'http://localhost:3001/api';
    }
    return productionApiUrl;
  }

  /// URL para desenvolvimento local (altere para seu IP se usar dispositivo físico)
  static const String localApiUrl = 'http://10.0.2.2:3001/api';
  
  /// URL de produção
  static const String productionApiUrl = 'https://your-production-url.com/api';

  /// Request timeout duration
  static const Duration requestTimeout = Duration(seconds: 30);

  /// Token storage key
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  /// Pagination
  static const int defaultPageSize = 20;
}
