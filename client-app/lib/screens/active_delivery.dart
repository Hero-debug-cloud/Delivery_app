import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ActiveDeliveryScreen extends StatefulWidget {
  final String orderId;

  const ActiveDeliveryScreen({super.key, required this.orderId});

  @override
  State<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends State<ActiveDeliveryScreen> {
  // Cycle: arrived_at_store -> picked_up -> arrived_at_customer
  String _step = 'arrived_at_store';

  String _getButtonText() {
    switch (_step) {
      case 'arrived_at_store': return 'Mark: Arrived at Store';
      case 'picked_up': return 'Mark: Picked Up Package';
      case 'arrived_at_customer': return 'Mark: Arrived at Dropoff';
      default: return 'Complete Delivery';
    }
  }

  void _handleStepProgress() {
    setState(() {
      if (_step == 'arrived_at_store') {
        _step = 'picked_up';
      } else if (_step == 'picked_up') {
        _step = 'arrived_at_customer';
      } else if (_step == 'arrived_at_customer') {
        // Redirect to PIN validation screen
        context.go('/delivery/${widget.orderId}/complete');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Active Order ${widget.orderId}'),
        centerTitle: true,
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
                  const Icon(Icons.map, size: 64, color: Color(0xFF94A3B8)),
                  const SizedBox(height: 12),
                  Text(
                    'Simulated GPS Routing Engine (OSRM Baseline)',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Active location tracking pings sent every 10s',
                    style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
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
                              ? 'Navigate to Central Hub Store' 
                              : 'Navigate to Rachel Zane (Dropoff)',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Head north on MG Road, turn left in 250m',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
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
                  // Order Summary Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Deliver To:',
                        style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                      ),
                      Text(
                        'Rachel Zane • ORD-9281',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('Address:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      Text('Flat 505, Park Avenue Residences', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
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
                    onPressed: _handleStepProgress,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
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
