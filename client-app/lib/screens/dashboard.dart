import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../core/shift_manager.dart';
import '../features/auth/presentation/bloc/auth_cubit.dart';
import '../features/auth/presentation/bloc/auth_state.dart';
import '../main.dart';
import 'profile.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  bool _isEndingShift = false;
  int _currentTabIndex = 0;

  Timer? _tasksTimer;
  List<dynamic> _broadcasts = [];
  Map<String, dynamic>? _activeOrder;
  bool _isFetchingTasks = false;

  @override
  void initState() {
    super.initState();
    ShiftManager.instance.addListener(_onShiftChanged);
    
    // Sync initial state from user profile on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initShiftState();
      if (ShiftManager.instance.isOnline) {
        _startTasksPolling();
      }
    });
  }

  @override
  void dispose() {
    ShiftManager.instance.removeListener(_onShiftChanged);
    _tasksTimer?.cancel();
    super.dispose();
  }

  void _onShiftChanged() {
    if (mounted) {
      setState(() {});
      if (ShiftManager.instance.isOnline) {
        _startTasksPolling();
      } else {
        _stopTasksPolling();
      }
    }
  }

  void _startTasksPolling() {
    _tasksTimer?.cancel();
    _fetchTasks(); // fetch once immediately
    _tasksTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _fetchTasks();
    });
  }

  void _stopTasksPolling() {
    _tasksTimer?.cancel();
    _tasksTimer = null;
    setState(() {
      _broadcasts = [];
      _activeOrder = null;
    });
  }

  Future<void> _fetchTasks() async {
    if (_isFetchingTasks || !ShiftManager.instance.isOnline) return;
    _isFetchingTasks = true;

    try {
      // 1. Check for active delivery job
      final activeRes = await LogiRouteApp.dio.get('/orders/active');
      if (activeRes.statusCode == 200) {
        final activeData = activeRes.data['data'];
        if (activeData != null) {
          if (mounted) {
            setState(() {
              _activeOrder = activeData;
              _broadcasts = [];
            });
          }
          _isFetchingTasks = false;
          return;
        }
      }

      // 2. Fetch broadcasts if no active job
      final broadcastsRes = await LogiRouteApp.dio.get('/orders/broadcasts');
      if (broadcastsRes.statusCode == 200 && broadcastsRes.data['data'] != null) {
        if (mounted) {
          setState(() {
            _activeOrder = null;
            _broadcasts = broadcastsRes.data['data'] as List<dynamic>;
          });
        }
      }
    } catch (e) {
      debugPrint('[Tasks] Error fetching driver tasks: $e');
    } finally {
      _isFetchingTasks = false;
    }
  }

  Future<void> _acceptOrder(String orderId) async {
    try {
      final response = await LogiRouteApp.dio.post('/orders/$orderId/accept');
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Job accepted! Routing to delivery screen.'), backgroundColor: Colors.green),
          );
          context.go('/delivery/$orderId');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Missed! Another driver accepted this job.'),
            backgroundColor: Colors.red,
          ),
        );
        _fetchTasks();
      }
    }
  }

  Future<void> _ignoreOrder(String orderId) async {
    try {
      final response = await LogiRouteApp.dio.post('/orders/$orderId/ignore');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _broadcasts.removeWhere((b) => b['id'] == orderId);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order ignored.'), duration: Duration(seconds: 1)),
          );
        }
      }
    } catch (e) {
      debugPrint('[Tasks] Error ignoring order: $e');
    }
  }

  void _initShiftState() {
    final authCubit = context.read<AuthCubit>();
    final state = authCubit.state;
    if (state is AuthAuthenticated) {
      final profile = state.user.driverProfile;
      if (profile != null) {
        final bool isOnline = profile.status == 'online';
        if (isOnline && profile.store != null) {
          ShiftManager.instance.initialize(
            online: true,
            store: profile.store,
          );
        } else {
          ShiftManager.instance.initialize(online: false);
        }
      }
    }
  }

  Future<void> _goOffline() async {
    setState(() {
      _isEndingShift = true;
    });

    try {
      final response = await LogiRouteApp.dio.patch(
        '/delivery-partners/me/status',
        data: {
          'status': 'offline',
          'storeId': null,
        },
      );

      if (response.statusCode == 200) {
        ShiftManager.instance.goOffline();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text("Shift Ended. You are now OFFLINE."),
            backgroundColor: Colors.blueGrey,
          ));
        }
      } else {
        throw Exception("Server returned status ${response.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("Failed to go offline on server: $e"),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isEndingShift = false;
        });
      }
    }
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

  Widget _buildDashboardTab(bool isLive, ShiftManager shift) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isLive) ...[
            Card(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.sensors, color: Color(0xFF16A34A), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'ONLINE - LIVE',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                          ],
                        ),
                        if (_isEndingShift)
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        else
                          TextButton.icon(
                            onPressed: _goOffline,
                            icon: const Icon(Icons.power_settings_new, color: Colors.redAccent, size: 16),
                            label: const Text(
                              'Go Offline',
                              style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                      ],
                    ),
                    const Divider(height: 24, color: Color(0xFFE2E8F0)),
                    Row(
                      children: [
                        const Icon(Icons.store, size: 18, color: Color(0xFF2563EB)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            shift.selectedStore?['name'] ?? 'Hub Point',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 18, color: Color(0xFF059669)),
                        const SizedBox(width: 8),
                        Text(
                          'Shift hours: ${_formatTime12h(shift.selectedStore?['openingTime'])} - ${_formatTime12h(shift.selectedStore?['closingTime'])}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'GPS Lat: ${shift.currentPosition?.latitude.toStringAsFixed(6)}',
                            style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: Color(0xFF475569)),
                          ),
                          Text(
                            'GPS Lng: ${shift.currentPosition?.longitude.toStringAsFixed(6)}',
                            style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: Color(0xFF475569)),
                          ),
                          if (shift.isSimulated)
                            const Padding(
                              padding: EdgeInsets.only(top: 4),
                              child: Text(
                                '⚠️ Simulated location active (<= 10m from Hub).',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Card(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Duty Status: OFFLINE',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        Icon(Icons.power_settings_new, color: Color(0xFF94A3B8)),
                      ],
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/go-live'),
                      icon: const Icon(Icons.sensors, size: 18),
                      label: const Text('Start Shift / Go Live', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
          const Text(
            'Daily Announcements',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Column(
              children: [
                Icon(Icons.notifications_none, size: 40, color: Color(0xFF94A3B8)),
                SizedBox(height: 12),
                Text(
                  'No announcements today',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                ),
                SizedBox(height: 4),
                Text(
                  'Important dispatch broadcasts and center announcements will show up here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksTab(bool isLive) {
    if (!isLive) {
      return Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'My Active Tasks',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 56, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: const [
                  Icon(Icons.sensors_off, size: 48, color: Color(0xFF94A3B8)),
                  SizedBox(height: 12),
                  Text(
                    'You are Offline',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Go live on the Dashboard to start receiving orders.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'My Active Tasks',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
              ),
              if (_isFetchingTasks)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2563EB)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Accept broadcasts or manage your active assigned deliveries.',
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 20),
          
          if (_activeOrder != null) ...[
            // 1. Show Active Order
            Card(
              color: Colors.white,
              elevation: 2,
              shadowColor: Colors.black12,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFBFDBFE), width: 1.5),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'ACTIVE JOB ASSIGNED',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB), letterSpacing: 0.5),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _activeOrder!['status'].toString().toUpperCase(),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20, color: Color(0xFFE2E8F0)),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.store, size: 18, color: Color(0xFF64748B)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _activeOrder!['storeName'] ?? 'Pickup Store',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                              ),
                              Text(
                                _activeOrder!['storeAddress'] ?? '',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on, size: 18, color: Colors.redAccent),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _activeOrder!['customerName'] ?? 'Customer',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                              ),
                              Text(
                                _activeOrder!['deliveryAddress'] ?? '',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '₹${((_activeOrder!['grandTotal'] ?? 0) / 100).toStringAsFixed(2)} • ${_activeOrder!['paymentType'].toString().toUpperCase()}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            context.go('/delivery/${_activeOrder!['id']}');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                          child: const Text('Resume Job', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ] else if (_broadcasts.isEmpty) ...[
            // 2. No Active and No Broadcasts
            Container(
              padding: const EdgeInsets.symmetric(vertical: 56, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: const [
                  Icon(Icons.notifications_none, size: 48, color: Color(0xFF94A3B8)),
                  SizedBox(height: 12),
                  Text(
                    'No new broadcasts',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Waiting for new dispatches near your active hub...',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ] else ...[
            // 3. Render Broadcast Cards list
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _broadcasts.length,
              itemBuilder: (context, idx) {
                final job = _broadcasts[idx];
                final orderId = job['id'] as String;
                final grandTotal = (job['grandTotal'] as num) / 100;

                return Card(
                  color: Colors.white,
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'ORDER: ${orderId.substring(0, 8).toUpperCase()}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace'),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF3CD),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFFFEEBA)),
                              ),
                              child: const Text(
                                'BROADCAST ACTIVE',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF856404)),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20, color: Color(0xFFE2E8F0)),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.store, size: 16, color: Colors.grey),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                job['storeName'] ?? 'Hub Pickup',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.location_on, size: 16, color: Colors.redAccent),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                job['deliveryAddress'] ?? 'Delivery Destination',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '₹${grandTotal.toStringAsFixed(2)} • ${job['paymentType'].toString().toUpperCase()}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Row(
                              children: [
                                OutlinedButton(
                                  onPressed: () => _ignoreOrder(orderId),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.redAccent,
                                    side: const BorderSide(color: Color(0xFFFCA5A5)),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text('Ignore', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: () => _acceptOrder(orderId),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF16A34A),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    elevation: 0,
                                  ),
                                  child: const Text('Accept Job', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabBody(bool isLive, ShiftManager shift) {
    switch (_currentTabIndex) {
      case 0:
        return _buildDashboardTab(isLive, shift);
      case 1:
        return _buildTasksTab(isLive);
      case 2:
        return const ProfileScreen(isEmbedded: true);
      default:
        return _buildDashboardTab(isLive, shift);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shift = ShiftManager.instance;
    final bool isLive = shift.isOnline;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          _currentTabIndex == 0
              ? 'LogiRoute Dashboard'
              : _currentTabIndex == 1
                  ? 'My Tasks'
                  : 'My Profile',
        ),
        actions: _currentTabIndex == 0
            ? [
                IconButton(
                  icon: const Icon(Icons.person),
                  onPressed: () {
                    setState(() {
                      _currentTabIndex = 2;
                    });
                  },
                ),
              ]
            : null,
      ),
      body: SingleChildScrollView(
        child: _buildTabBody(isLive, shift),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        onTap: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: const Color(0xFF94A3B8),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Tasks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
