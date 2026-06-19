import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/theme.dart';
import 'screens/login.dart';
import 'screens/dashboard.dart';
import 'screens/order_detail.dart';
import 'screens/active_delivery.dart';
import 'screens/pin_entry.dart';
import 'screens/profile.dart';

void main() {
  runApp(const LogiRouteApp());
}

class LogiRouteApp extends StatelessWidget {
  const LogiRouteApp({super.key});

  static final GoRouter _router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DriverDashboardScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final orderId = state.pathParameters['id'] ?? 'Unknown';
          return OrderDetailScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/delivery/:id',
        builder: (context, state) {
          final orderId = state.pathParameters['id'] ?? 'Unknown';
          return ActiveDeliveryScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/delivery/:id/complete',
        builder: (context, state) {
          final orderId = state.pathParameters['id'] ?? 'Unknown';
          return PinEntryScreen(orderId: orderId);
        },
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'LogiRoute Mobile',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
      theme: AppTheme.lightTheme,
    );
  }
}
