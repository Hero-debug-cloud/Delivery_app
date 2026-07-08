import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../main.dart';

class CustomerOrderTrackingScreen extends StatefulWidget {
  final String trackingToken;

  const CustomerOrderTrackingScreen({super.key, required this.trackingToken});

  @override
  State<CustomerOrderTrackingScreen> createState() => _CustomerOrderTrackingScreenState();
}

class _CustomerOrderTrackingScreenState extends State<CustomerOrderTrackingScreen> {
  dynamic _orderDetails;
  bool _isLoading = true;
  Timer? _pollingTimer;
  final MapController _mapController = MapController();
  final List<Marker> _markers = [];

  Future<void> _fetchTrackingDetails() async {
    try {
      final response = await LogiRouteApp.dio.get('/track/${widget.trackingToken}');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        setState(() {
          _orderDetails = data;
          _isLoading = false;
        });
        _updateMapMarkers();
      }
    } catch (e) {
      debugPrint('[Tracking] Error fetching details: $e');
    }
  }

  void _updateMapMarkers() {
    if (_orderDetails == null) return;

    final store = _orderDetails['store'];
    final destLat = _orderDetails['deliveryLatitude'] as double;
    final destLng = _orderDetails['deliveryLongitude'] as double;
    final driver = _orderDetails['driver'];

    final List<Marker> newMarkers = [];

    // Customer Dropoff Point (Red Pin)
    newMarkers.add(
      Marker(
        point: LatLng(destLat, destLng),
        width: 45,
        height: 45,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.red, width: 3),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: const Icon(Icons.person_pin_circle, color: Colors.red, size: 24),
        ),
      ),
    );

    // Store Location (Blue Pin)
    double? storeLat;
    double? storeLng;
    if (store != null) {
      storeLat = store['latitude'] as double;
      storeLng = store['longitude'] as double;
      newMarkers.add(
        Marker(
          point: LatLng(storeLat, storeLng),
          width: 45,
          height: 45,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.blue, width: 3),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
              ],
            ),
            child: const Icon(Icons.store, color: Colors.blue, size: 20),
          ),
        ),
      );
    }

    // Driver Current Location (Green/Motorcycle Pin)
    double? driverLat;
    double? driverLng;
    if (driver != null && driver['latitude'] != null && driver['longitude'] != null) {
      driverLat = driver['latitude'] as double;
      driverLng = driver['longitude'] as double;
      newMarkers.add(
        Marker(
          point: LatLng(driverLat, driverLng),
          width: 45,
          height: 45,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.green, width: 3),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
              ],
            ),
            child: const Icon(Icons.motorcycle, color: Colors.green, size: 22),
          ),
        ),
      );
    }

    setState(() {
      _markers.clear();
      _markers.addAll(newMarkers);
    });

    // Auto-fit bounds
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final List<LatLng> points = [
        LatLng(destLat, destLng),
        if (storeLat != null && storeLng != null) LatLng(storeLat, storeLng),
        if (driverLat != null && driverLng != null) LatLng(driverLat, driverLng),
      ];

      if (points.length >= 2) {
        final bounds = LatLngBounds.fromPoints(points);
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: bounds,
            padding: const EdgeInsets.all(50),
          ),
        );
      }
    });
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (_orderDetails != null) {
        final status = _orderDetails['status'];
        final bool isDone = status == 'delivered' || status == 'failed';
        if (isDone) {
          timer.cancel();
          return;
        }
      }
      _fetchTrackingDetails();
    });
  }

  @override
  void initState() {
    super.initState();
    _fetchTrackingDetails().then((_) {
      _startPolling();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  String _formatStatus(String status) {
    return status.toUpperCase().replaceAll('_', ' ');
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'created':
        return Colors.blueGrey;
      case 'assigned':
      case 'accepted':
        return Colors.indigo;
      case 'picked_up':
      case 'in_transit':
        return Colors.amber[800]!;
      case 'delivered':
        return Colors.green;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildTimelineStep(String label, bool completed, bool isLast, IconData icon, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: completed ? color : const Color(0xFFE2E8F0),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 14, color: completed ? Colors.white : const Color(0xFF94A3B8)),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: completed ? color.withOpacity(0.5) : const Color(0xFFE2E8F0),
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4.0),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: completed ? FontWeight.bold : FontWeight.normal,
                color: completed ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineCard(List<dynamic> events, String currentStatus) {
    final eventTypes = events.map((e) => e['eventType'] as String).toSet();

    final bool isCreated = eventTypes.contains('created') || currentStatus != 'created';
    final bool isAssigned = eventTypes.contains('driver_accepted') || eventTypes.contains('driver_assigned') || currentStatus == 'assigned' || currentStatus == 'accepted';
    final bool isReachedStore = eventTypes.contains('reached_store');
    final bool isPickedUp = eventTypes.contains('picked_up') || currentStatus == 'picked_up';
    final bool isTransit = eventTypes.contains('out_for_delivery') || currentStatus == 'in_transit';
    final bool isReachedLocation = eventTypes.contains('reached_location');
    final bool isDelivered = currentStatus == 'delivered';
    final bool isFailed = currentStatus == 'failed';

    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'DELIVERY MILESTONES',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 16),
            _buildTimelineStep('Order Placed', isCreated, false, Icons.receipt_long, Colors.blueGrey),
            _buildTimelineStep('Courier Dispatched / Assigned', isAssigned, false, Icons.person, Colors.indigo),
            _buildTimelineStep('Courier Reached Store', isReachedStore, false, Icons.store, Colors.yellow[800]!),
            _buildTimelineStep('Order Picked Up', isPickedUp, false, Icons.shopping_bag, Colors.cyan),
            _buildTimelineStep('Out for Delivery', isTransit, false, Icons.local_shipping, Colors.amber[800]!),
            _buildTimelineStep('Courier Reached Your Location', isReachedLocation, false, Icons.pin_drop, Colors.orange),
            if (isFailed)
              _buildTimelineStep('Delivery Cancelled', true, true, Icons.cancel, Colors.red)
            else
              _buildTimelineStep('Delivered Successfully', isDelivered, true, Icons.check_circle, Colors.green),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Track Order')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_orderDetails == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Track Order')),
        body: const Center(child: Text('Failed to load tracking details.')),
      );
    }

    final String status = _orderDetails['status'];
    final double destLat = _orderDetails['deliveryLatitude'] as double;
    final double destLng = _orderDetails['deliveryLongitude'] as double;
    final List<dynamic> events = _orderDetails['events'] ?? [];
    final String pin = _orderDetails['proofPin'] ?? '----';

    final bool isCompleted = status == 'delivered' || status == 'failed';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Track ID: ${_orderDetails['orderId'].toString().substring(0, 8).toUpperCase()}',
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // 1. Live Tracking Map View
          Expanded(
            flex: 4,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: LatLng(destLat, destLng),
                    initialZoom: 14,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.logiroute.client_app',
                    ),
                    MarkerLayer(
                      markers: _markers,
                    ),
                  ],
                ),
                Positioned(
                  top: 16,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _getStatusColor(status),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatStatus(status),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(status),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Details & Timeline Bottom Sheet Panel
          Expanded(
            flex: 5,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Verification PIN banner (highly visible)
                  if (!isCompleted)
                    Card(
                      color: const Color(0xFFFFFBEB),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFFDE68A)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'RECEIPT VERIFICATION PIN',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFB45309)),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Share this code with the driver',
                                  style: TextStyle(fontSize: 12, color: Color(0xFFB45309)),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(color: const Color(0xFFFDE68A)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                pin,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'monospace',
                                  letterSpacing: 2,
                                  color: Color(0xFF92400E),
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),

                  // Courier Details (if assigned)
                  if (_orderDetails['driver'] != null) ...[
                    Card(
                      color: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Color(0xFFEFF6FF),
                          child: Icon(Icons.person, color: Color(0xFF2563EB)),
                        ),
                        title: Text(
                          _orderDetails['driver']['name'] ?? 'Delivery Agent',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        subtitle: Text(
                          'Phone: ${_orderDetails['driver']['phone']}',
                          style: const TextStyle(fontSize: 12),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.phone_in_talk, color: Color(0xFF16A34A)),
                          onPressed: () {
                            // Dial driver
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Timeline Step Indicator
                  _buildTimelineCard(events, status),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
