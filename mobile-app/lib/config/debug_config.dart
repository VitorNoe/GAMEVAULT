import 'dart:io' show Platform;

import 'app_config.dart';

class DebugConfig {
  DebugConfig._();

  /// Returns the API URL for debugging.
  /// Pass a [customIp] to target a specific host.
  /// By default returns the URL configured in [AppConfig].
  static String getApiUrl({String? customIp, int port = 3000}) {
    if (customIp != null) return 'http://$customIp:$port/api';
    return AppConfig.apiBaseUrl;
  }

  /// Convenience: configure [AppConfig] with a custom IP at startup.
  static void configureApiUrl({String? customIp, int port = 3000}) {
    if (customIp != null) {
      AppConfig.setCustomApiUrl('http://$customIp:$port/api');
    }
  }

  // ignore: avoid_print
  static void printDebugInfo() {
    try {
      // ignore: avoid_print
      print('=== GameVault Debug ===');
      // ignore: avoid_print
      print('Platform: ${Platform.operatingSystem}');
      // ignore: avoid_print
      print('API URL: ${getApiUrl()}');
      // ignore: avoid_print
      print('=======================');
    } catch (e) {
      // ignore: avoid_print
      print('Debug info not available: $e');
    }
  }
}
