import 'dart:io' show Platform;

import 'app_config.dart';

class DebugConfig {
  DebugConfig._();

  /// Returns the API URL for debugging.
  /// Uses the Codespace public URL by default so the emulator can reach
  /// the backend running in GitHub Codespaces.
  static String getApiUrl({String? customIp, int port = 3001}) {
    // If a custom IP is provided, use it directly
    if (customIp != null) return 'http://$customIp:$port/api';
    // Default: use the Codespace URL configured in AppConfig
    return AppConfig.apiBaseUrl;
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
