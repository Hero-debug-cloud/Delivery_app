import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import '../core/shift_manager.dart';
import '../main.dart';

class GoLiveScreen extends StatefulWidget {
  const GoLiveScreen({super.key});

  @override
  State<GoLiveScreen> createState() => _GoLiveScreenState();
}

class _GoLiveScreenState extends State<GoLiveScreen> {
  Position? _currentPosition;
  bool _loadingLocation = true;
  bool _loadingStores = true;
  List<dynamic> _stores = [];
  Map<String, dynamic>? _selectedStore;
  double? _distanceToSelectedStore; // in meters
  String? _errorMessage;
  bool _isSimulated = false;
  bool _isSavingStatus = false;

  @override
  void initState() {
    super.initState();
    _initLocationAndStores();
  }

  Future<void> _initLocationAndStores() async {
    setState(() {
      _loadingLocation = true;
      _loadingStores = true;
      _errorMessage = null;
    });

    try {
      final hasPermission = await _handleLocationPermission();
      if (!hasPermission) {
        setState(() {
          _loadingLocation = false;
          _loadingStores = false;
          _errorMessage = "Location permission denied. Please grant location access.";
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentPosition = position;
        _loadingLocation = false;
      });

      await _fetchStores();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _loadingLocation = false;
        _loadingStores = false;
      });
    }
  }

  Future<bool> _handleLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Location services are disabled. Please enable them.')));
      }
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permissions are denied')));
        }
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Location permissions are permanently denied.')));
      }
      return false;
    }

    return true;
  }

  Future<void> _fetchStores() async {
    try {
      final response = await LogiRouteApp.dio.get('/stores?limit=100');
      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>;
        setState(() {
          _stores = data;
          _loadingStores = false;
        });
        _calculateDistancesAndSort();
      } else {
        throw Exception("Failed to load stores: status code ${response.statusCode}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Failed to load stores. Make sure server is running. ${e.toString()}";
        _loadingStores = false;
      });
    }
  }

  void _calculateDistancesAndSort() {
    if (_currentPosition == null || _stores.isEmpty) return;

    final updatedStores = List<dynamic>.from(_stores);
    for (var store in updatedStores) {
      final double lat = (store['latitude'] as num).toDouble();
      final double lng = (store['longitude'] as num).toDouble();

      final double distance = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        lat,
        lng,
      );
      store['distance'] = distance;
    }

    // Sort by distance ascending
    updatedStores.sort((a, b) => (a['distance'] as double).compareTo(b['distance'] as double));

    setState(() {
      _stores = updatedStores;
    });

    if (_selectedStore != null) {
      final found = _stores.firstWhere(
        (element) => element['id'] == _selectedStore!['id'],
        orElse: () => null,
      );
      if (found != null) {
        setState(() {
          _selectedStore = found;
          _distanceToSelectedStore = found['distance'] as double;
        });
      }
    }
  }

  void _simulateLocationNearSelectedStore() {
    if (_selectedStore == null) return;
    
    final double storeLat = (_selectedStore!['latitude'] as num).toDouble();
    final double storeLng = (_selectedStore!['longitude'] as num).toDouble();
    
    setState(() {
      _isSimulated = true;
      _currentPosition = Position(
        latitude: storeLat + 0.00008, // approx 9 meters away
        longitude: storeLng,
        timestamp: DateTime.now(),
        accuracy: 5.0,
        altitude: 0.0,
        altitudeAccuracy: 0.0,
        heading: 0.0,
        headingAccuracy: 0.0,
        speed: 0.0,
        speedAccuracy: 0.0,
      );
    });

    _calculateDistancesAndSort();
  }

  String _formatTime12h(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) return "";
    try {
      final parts = timeStr.split(':');
      final hour = int.parse(parts[0]);
      final minute = parts[1];
      final ampm = hour >= 12 ? "PM" : "AM";
      final displayHour = hour % 12 == 0 ? 12 : hour % 12;
      return "$displayHour:$minute $ampm";
    } catch (e) {
      return timeStr;
    }
  }

  Future<void> _goOnline() async {
    if (_selectedStore == null || _currentPosition == null) return;
    
    setState(() {
      _isSavingStatus = true;
    });

    try {
      final response = await LogiRouteApp.dio.patch(
        '/delivery-partners/me/status',
        data: {
          'status': 'online',
          'storeId': _selectedStore!['id'],
        },
      );

      if (response.statusCode == 200) {
        ShiftManager.instance.goOnline(
          _selectedStore!,
          _distanceToSelectedStore ?? 0.0,
          _currentPosition!,
          _isSimulated,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text("Shift Started. You are now ONLINE."),
            backgroundColor: Colors.green,
          ));
          context.pop();
        }
      } else {
        throw Exception("Server returned status ${response.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("Failed to update status on server: $e"),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingStatus = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isWithinGeofence = _distanceToSelectedStore != null && _distanceToSelectedStore! <= 100.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Go Online'),
      ),
      body: _loadingLocation || _loadingStores
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Color(0xFF2563EB)),
                  SizedBox(height: 16),
                  Text(
                    "Locating nearest dispatch hubs...",
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            )
          : _errorMessage != null && _stores.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 14, color: Colors.redAccent),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _initLocationAndStores,
                          child: const Text("Retry Connection"),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_selectedStore == null) ...[
                          const Row(
                            children: [
                              Icon(Icons.storefront, color: Color(0xFF2563EB), size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Select Your Store Hub',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF020617),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Stores are sorted by proximity to your current location.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 16),
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _stores.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final store = _stores[index];
                              final double dist = store['distance'] as double? ?? 0.0;
                              final String distanceText = dist >= 1000
                                  ? '${(dist / 1000).toStringAsFixed(2)} km'
                                  : '${dist.toStringAsFixed(0)} m';
                              final String timings = 'Hours: ${_formatTime12h(store['openingTime'])} - ${_formatTime12h(store['closingTime'])}';

                              return InkWell(
                                onTap: () {
                                  setState(() {
                                    _selectedStore = store;
                                    _distanceToSelectedStore = dist;
                                    _isSimulated = false;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEFF6FF),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.store, color: Color(0xFF2563EB)),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              store['name'],
                                              style: const TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF020617),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              store['address'],
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: Color(0xFF64748B),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              timings,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF059669),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            distanceText,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF2563EB),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          const Icon(Icons.chevron_right, size: 16, color: Color(0xFF94A3B8)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ] else ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Selected Dispatch Hub',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF020617),
                                ),
                              ),
                              TextButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _selectedStore = null;
                                    _distanceToSelectedStore = null;
                                    _isSimulated = false;
                                  });
                                },
                                icon: const Icon(Icons.swap_horiz, size: 16),
                                label: const Text('Change Hub', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.store, color: Color(0xFF2563EB), size: 24),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _selectedStore!['name'],
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _selectedStore!['address'],
                                        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Hours: ${_formatTime12h(_selectedStore!['openingTime'])} - ${_formatTime12h(_selectedStore!['closingTime'])}',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Geofence Card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: isWithinGeofence
                                  ? const Color(0xFFECFDF5)
                                  : const Color(0xFFFFF1F2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isWithinGeofence
                                    ? const Color(0xFFA7F3D0)
                                    : const Color(0xFFFECDD3),
                              ),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isWithinGeofence ? Icons.check_circle : Icons.warning,
                                      color: isWithinGeofence ? const Color(0xFF059669) : const Color(0xFFE11D48),
                                      size: 24,
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      isWithinGeofence ? 'Within Range' : 'Out of Range',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: isWithinGeofence ? const Color(0xFF065F46) : const Color(0xFF9F1239),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  _distanceToSelectedStore != null
                                      ? 'Your distance: ${_distanceToSelectedStore!.toStringAsFixed(1)} meters from the store.'
                                      : 'Calculating distance...',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isWithinGeofence ? const Color(0xFF047857) : const Color(0xFFBE123C),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isWithinGeofence
                                      ? 'Geofence criteria met (<= 100m). You can now go online.'
                                      : 'You must be within 100m of the store. Please move closer.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isWithinGeofence ? const Color(0xFF065F46).withOpacity(0.8) : const Color(0xFF9F1239).withOpacity(0.8),
                                  ),
                                ),
                                if (!isWithinGeofence) ...[
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: _simulateLocationNearSelectedStore,
                                    icon: const Icon(Icons.location_searching, size: 16),
                                    label: const Text('Simulate Location (10m from Store)', style: TextStyle(fontSize: 12)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF020617),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),

                          // Start Shift Button
                          ElevatedButton(
                            onPressed: (isWithinGeofence && !_isSavingStatus) ? _goOnline : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: const Color(0xFF94A3B8),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: _isSavingStatus
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text(
                                    'Go Online / Start Shift',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }
}
