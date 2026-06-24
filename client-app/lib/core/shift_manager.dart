import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:battery_plus/battery_plus.dart';
import '../main.dart';

class ShiftManager extends ChangeNotifier {
  static final ShiftManager instance = ShiftManager._();
  ShiftManager._();

  final Battery _battery = Battery();

  bool _isOnline = false;
  Map<String, dynamic>? _selectedStore;
  double? _distanceToSelectedStore;
  Position? _currentPosition;
  bool _isSimulated = false;

  Timer? _telemetryTimer;
  double _simulatedAngle = 0.0;

  bool get isOnline => _isOnline;
  Map<String, dynamic>? get selectedStore => _selectedStore;
  double? get distanceToSelectedStore => _distanceToSelectedStore;
  Position? get currentPosition => _currentPosition;
  bool get isSimulated => _isSimulated;

  void initialize({required bool online, Map<String, dynamic>? store}) {
    _isOnline = online;
    _selectedStore = store;
    if (_isOnline) {
      _startTelemetry();
    } else {
      _stopTelemetry();
    }
    notifyListeners();
  }

  void goOnline(Map<String, dynamic> store, double distance, Position position, bool simulated) {
    _selectedStore = store;
    _distanceToSelectedStore = distance;
    _currentPosition = position;
    _isOnline = true;
    _isSimulated = simulated;
    _simulatedAngle = 0.0;
    _startTelemetry();
    notifyListeners();
  }

  void goOffline() {
    _isOnline = false;
    _selectedStore = null;
    _distanceToSelectedStore = null;
    _isSimulated = false;
    _stopTelemetry();
    notifyListeners();
  }

  void updatePosition(Position position, double distance) {
    _currentPosition = position;
    _distanceToSelectedStore = distance;
    notifyListeners();
  }

  void _startTelemetry() {
    _telemetryTimer?.cancel();
    // Perform initial immediate ping
    _sendTelemetryPing();
    
    // Schedule periodic pings every 10 seconds
    _telemetryTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _sendTelemetryPing();
    });
  }

  void _stopTelemetry() {
    _telemetryTimer?.cancel();
    _telemetryTimer = null;
  }

  Future<void> _sendTelemetryPing() async {
    if (!_isOnline) return;

    if (_isSimulated && _selectedStore != null) {
      // Simulate circular driver movement around the warehouse for testing
      _simulatedAngle += 0.15;
      final storeLat = (_selectedStore!['latitude'] as num).toDouble();
      final storeLng = (_selectedStore!['longitude'] as num).toDouble();
      
      _currentPosition = Position(
        latitude: storeLat + 0.00025 * math.cos(_simulatedAngle),
        longitude: storeLng + 0.00025 * math.sin(_simulatedAngle),
        timestamp: DateTime.now(),
        accuracy: 5.0,
        altitude: 0.0,
        altitudeAccuracy: 0.0,
        heading: (_simulatedAngle * 180 / math.pi) % 360,
        headingAccuracy: 0.0,
        speed: 5.0, // 18 km/h
        speedAccuracy: 0.0,
      );
      
      _distanceToSelectedStore = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        storeLat,
        storeLng,
      );
      notifyListeners();
    } else {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        _currentPosition = position;
        if (_selectedStore != null) {
          final storeLat = (_selectedStore!['latitude'] as num).toDouble();
          final storeLng = (_selectedStore!['longitude'] as num).toDouble();
          _distanceToSelectedStore = Geolocator.distanceBetween(
            position.latitude,
            position.longitude,
            storeLat,
            storeLng,
          );
        }
        notifyListeners();
      } catch (e) {
        debugPrint("[Telemetry] Geolocator error: $e");
      }
    }

    if (_currentPosition != null) {
      try {
        final double speedKmh = _currentPosition!.speed * 3.6;
        
        int batteryLevel = 82; // fallback default
        try {
          batteryLevel = await _battery.batteryLevel;
          debugPrint("[Telemetry] Battery level queried successfully: $batteryLevel%");
        } catch (e) {
          debugPrint("[Telemetry] Battery query failed: $e");
          print("[Telemetry] CRITICAL ERROR: Failed to get battery level. Did you rebuild the app? Error: $e");
        }
        
        await LogiRouteApp.dio.post(
          '/locations/ping',
          data: {
            'latitude': _currentPosition!.latitude,
            'longitude': _currentPosition!.longitude,
            'speed': speedKmh.clamp(0.0, 150.0),
            'battery': batteryLevel,
          },
        );
      } catch (e) {
        debugPrint("[Telemetry] Failed to post telemetry ping: $e");
      }
    }
  }

  @override
  void dispose() {
    _stopTelemetry();
    super.dispose();
  }
}
