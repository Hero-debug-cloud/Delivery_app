import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../main.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  final String orderId;

  const ActiveDeliveryScreen({super.key, required this.orderId});

  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  Map<String, dynamic>? _orderDetails;
  bool _isLoading = true;
  String _step = 'arrived_at_store'; // arrived_at_store -> picked_up -> arrived_at_customer
  bool _isUpdating = false;

  Future<void> _fetchOrderDetails() async {
    try {
      final response = await LogiRouteApp.dio.get('/orders/active');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'];
        if (data != null && data['id'] == widget.orderId) {
          setState(() {
            _orderDetails = data;
            
            // Resolve step from server order status and events logs
            final String status = data['status'];
            final List<dynamic> events = data['events'] ?? [];
            final eventTypes = events.map((e) => e['eventType'] as String).toSet();

            if (status == 'picked_up') {
              _step = 'arrived_at_customer';
            } else if (status == 'in_transit') {
              _step = 'arrived_at_customer';
            } else if (eventTypes.contains('reached_store')) {
              _step = 'picked_up';
            } else {
              _step = 'arrived_at_store';
            }
            
            _isLoading = false;
          });
        } else {
          // If active order not matching, maybe it was finished. Go back.
          if (mounted) {
            context.go('/dashboard');
          }
        }
      }
    } catch (e) {
      debugPrint('[ActiveDelivery] Error fetching details: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
  }

  String _getButtonText() {
    switch (_step) {
      case 'arrived_at_store': return 'Mark: Arrived at Store';
      case 'picked_up': return 'Mark: Picked Up Package';
      case 'arrived_at_customer': return 'Mark: Arrived at Dropoff';
      default: return 'Complete Delivery';
    }
  }

  Future<void> _handleStepProgress() async {
    if (_isUpdating) return;
    setState(() => _isUpdating = true);

    try {
      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 5),
        );
      } catch (e) {
        debugPrint('[ActiveDelivery] Geolocator error: $e');
      }

      if (_step == 'arrived_at_store') {
        final res = await LogiRouteApp.dio.post(
          '/orders/${widget.orderId}/reached-store',
          data: {
            'latitude': pos?.latitude ?? 0.0,
            'longitude': pos?.longitude ?? 0.0,
          },
        );
        if (res.statusCode == 200) {
          setState(() {
            _step = 'picked_up';
          });
        }
      } else if (_step == 'picked_up') {
        // Progress to picked_up and out_for_delivery
        final res1 = await LogiRouteApp.dio.post('/orders/${widget.orderId}/picked-up');
        if (res1.statusCode == 200) {
          await LogiRouteApp.dio.post('/orders/${widget.orderId}/out-for-delivery');
          setState(() {
            _step = 'arrived_at_customer';
          });
        }
      } else if (_step == 'arrived_at_customer') {
        final res = await LogiRouteApp.dio.post(
          '/orders/${widget.orderId}/reached-location',
          data: {
            'latitude': pos?.latitude ?? 0.0,
            'longitude': pos?.longitude ?? 0.0,
          },
        );
        if (res.statusCode == 200) {
          if (mounted) {
            context.go('/delivery/${widget.orderId}/complete');
          }
        }
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Failed to progress step: $e';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to progress step: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUpdating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Order ${widget.orderId.substring(0, 8).toUpperCase()}')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_orderDetails == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Active Delivery')),
        body: const Center(child: Text('Active job not found or completed.')),
      );
    }

    final storeName = _orderDetails!['storeName'] ?? 'Store Hub';
    final storeAddress = _orderDetails!['storeAddress'] ?? '';
    final customerName = _orderDetails!['customerName'] ?? 'Customer';
    final customerAddress = _orderDetails!['deliveryAddress'] ?? '';
    final customerPhone = _orderDetails!['customerPhone'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Active Order ${widget.orderId.substring(0, 8).toUpperCase()}'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: Stack(
        children: [
          // Google Map Simulation background
          Container(
            color: const Color(0xFFE2E8F0),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.navigation, size: 64, color: Color(0xFF2563EB)),
                  const SizedBox(height: 12),
                  const Text(
                    'Simulated GPS Routing Engine Active',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Active location tracking pings sent every 10s',
                    style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Text(
                      'STATUS: ${_orderDetails!['status'].toString().toUpperCase()}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                  )
                ],
              ),
            ),
          ),

          // Navigation Instructions Floating Banner
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Card(
              color: const Color(0xFF0F172A),
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                child: Row(
                  children: [
                    const Icon(Icons.navigation, color: Color(0xFF3B82F6), size: 28),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _step == 'arrived_at_store' 
                              ? 'Navigate to Store: $storeName' 
                              : 'Navigate to Customer: $customerName',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _step == 'arrived_at_store' 
                              ? storeAddress
                              : customerAddress,
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ),
          ),

          // Bottom Action Panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, -4),
                  )
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Store Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Store Pickup:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      Text(storeName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF020617))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  
                  // Customer Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Deliver To:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      Text('$customerName (Ph: $customerPhone)', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF020617))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Address:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      Expanded(
                        child: Text(
                          customerAddress, 
                          textAlign: TextAlign.end,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24, color: Color(0xFFE2E8F0)),
                  
                  // Status Badge
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Text(
                        'CURRENT STEP: ${_step.replaceAll("_", " ").toUpperCase()}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Big Action Button
                  ElevatedButton(
                    onPressed: _isUpdating ? null : _handleStepProgress,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _isUpdating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            _getButtonText(),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
