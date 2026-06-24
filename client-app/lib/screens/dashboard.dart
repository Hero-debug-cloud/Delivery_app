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

  @override
  void initState() {
    super.initState();
    ShiftManager.instance.addListener(_onShiftChanged);
    
    // Sync initial state from user profile on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initShiftState();
    });
  }

  @override
  void dispose() {
    ShiftManager.instance.removeListener(_onShiftChanged);
    super.dispose();
  }

  void _onShiftChanged() {
    if (mounted) {
      setState(() {});
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
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'My Active Tasks',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
          ),
          const SizedBox(height: 6),
          const Text(
            'Keep track of your assigned drops, pickups, and SLA timings.',
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
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
              children: [
                const Icon(Icons.assignment, size: 48, color: Color(0xFF94A3B8)),
                const SizedBox(height: 12),
                const Text(
                  'No active tasks',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                ),
                const SizedBox(height: 4),
                Text(
                  isLive
                      ? 'Waiting for new courier dispatches from the warehouse dispatcher...'
                      : 'You are currently offline. Start your shift to receive delivery jobs.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
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
