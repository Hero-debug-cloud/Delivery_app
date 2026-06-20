import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'core/theme.dart';
import 'features/auth/data/sources/auth_remote_source.dart';
import 'features/auth/data/repositories/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_cubit.dart';
import 'features/auth/presentation/bloc/auth_state.dart';
import 'features/auth/presentation/screens/phone_input_screen.dart';
import 'features/auth/presentation/screens/otp_verify_screen.dart';
import 'screens/dashboard.dart';
import 'screens/order_detail.dart';
import 'screens/active_delivery.dart';
import 'screens/pin_entry.dart';
import 'screens/profile.dart';
import 'screens/onboarding.dart';
import 'screens/onboarding_review.dart';

void main() {
  runApp(const LogiRouteApp());
}

class CookieInterceptor extends Interceptor {
  String? _cookie;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_cookie != null) {
      options.headers['Cookie'] = _cookie;
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final rawCookies = response.headers['set-cookie'];
    if (rawCookies != null && rawCookies.isNotEmpty) {
      for (final rawCookie in rawCookies) {
        if (rawCookie.startsWith('logiroute_session=')) {
          _cookie = rawCookie.split(';').first;
          break;
        }
      }
    }
    super.onResponse(response, handler);
  }
}

class LogiRouteApp extends StatelessWidget {
  const LogiRouteApp({super.key});

  static final dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:8000',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  )..interceptors.add(CookieInterceptor());

  static const _secureStorage = FlutterSecureStorage();
  static final _authRemoteSource = AuthRemoteSource(dio);
  static final _authRepository = AuthRepository(
    _authRemoteSource,
    _secureStorage,
  );

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthCubit>(
      create: (_) => AuthCubit(_authRepository)..checkAuth(),
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          return MaterialApp.router(
            title: 'LogiRoute Mobile',
            debugShowCheckedModeBanner: false,
            routerConfig: _buildRouter(context, state),
            theme: AppTheme.lightTheme,
          );
        },
      ),
    );
  }

  GoRouter _buildRouter(BuildContext context, AuthState state) {
    final isAuthenticated = state is AuthAuthenticated;

    return GoRouter(
      initialLocation: isAuthenticated ? '/dashboard' : '/login',
      redirect: (ctx, routerState) {
        final authCubit = context.read<AuthCubit>();
        final authState = authCubit.state;
        final authed = authState is AuthAuthenticated;
        final goingToAuth =
            routerState.matchedLocation == '/login' ||
            routerState.matchedLocation == '/otp-verify';

        if (!authed) {
          if (!goingToAuth) return '/login';
          return null;
        }

        // Check onboarding status
        final user = (authState as AuthAuthenticated).user;
        final onboardingStatus = user.driverProfile?.onboardingStatus ?? 'pending';

        if (onboardingStatus == 'pending' || onboardingStatus == 'rejected') {
          if (routerState.matchedLocation != '/onboarding') {
            return '/onboarding';
          }
          return null;
        } else if (onboardingStatus == 'submitted') {
          if (routerState.matchedLocation != '/onboarding-review') {
            return '/onboarding-review';
          }
          return null;
        } else if (onboardingStatus == 'approved') {
          final isRestrictedScreen =
              routerState.matchedLocation == '/login' ||
              routerState.matchedLocation == '/otp-verify' ||
              routerState.matchedLocation == '/onboarding' ||
              routerState.matchedLocation == '/onboarding-review';
          if (isRestrictedScreen) return '/dashboard';
          return null;
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (ctx, state) => const PhoneInputScreen(),
        ),
        GoRoute(
          path: '/otp-verify',
          builder: (ctx, state) {
            final phone = state.extra as String? ?? '';
            return OtpVerifyScreen(phone: phone);
          },
        ),
        GoRoute(
          path: '/onboarding',
          builder: (ctx, state) => const DriverOnboardingScreen(),
        ),
        GoRoute(
          path: '/onboarding-review',
          builder: (ctx, state) => const OnboardingReviewScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (ctx, state) => const DriverDashboardScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (ctx, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/orders/:id',
          builder: (ctx, state) {
            final orderId = state.pathParameters['id'] ?? 'Unknown';
            return OrderDetailScreen(orderId: orderId);
          },
        ),
        GoRoute(
          path: '/delivery/:id',
          builder: (ctx, state) {
            final orderId = state.pathParameters['id'] ?? 'Unknown';
            return ActiveDeliveryScreen(orderId: orderId);
          },
        ),
        GoRoute(
          path: '/delivery/:id/complete',
          builder: (ctx, state) {
            final orderId = state.pathParameters['id'] ?? 'Unknown';
            return PinEntryScreen(orderId: orderId);
          },
        ),
      ],
    );
  }
}
