import 'dart:io' show Platform;

class DebugConfig {
  DebugConfig._();

  static String getApiUrl({String? customIp, int port = 3001}) {
    if (customIp != null) return 'http://$customIp:$port/api';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:$port/api';
      if (Platform.isIOS) return 'http://localhost:$port/api';
    } catch (_) {}
    return 'http://localhost:$port/api';
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
