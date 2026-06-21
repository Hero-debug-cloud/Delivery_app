import 'dart:io';

class NetworkUtils {
  // If testing on a physical device, set this to your computer's local IP address.
  // We detected your Mac's current local IP as '10.188.188.112'.
  // For Android emulator, use '10.0.2.2'.
  static const String _androidHost = '10.188.188.112'; 
  
  /// Returns the API base URL depending on the platform.
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://$_androidHost:8000';
    }
    return 'http://localhost:8000';
  }

  /// Resolves localhost URLs to the appropriate host depending on the platform.
  /// This is crucial for loading images/docs from local MinIO/S3 when running on Android emulator.
  static String resolveUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (Platform.isAndroid && url.contains('localhost')) {
      return url.replaceAll('localhost', _androidHost);
    }
    return url;
  }
}
