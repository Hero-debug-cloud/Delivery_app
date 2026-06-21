import 'dart:async';
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

import 'features/products/data/sources/product_remote_source.dart';
import 'features/products/data/repositories/product_repository.dart';
import 'features/products/presentation/bloc/product_cubit.dart';
import 'features/products/presentation/screens/customer_home_screen.dart';
import 'features/products/presentation/screens/product_search_screen.dart';
import 'features/products/presentation/screens/product_detail_screen.dart';
import 'features/products/presentation/screens/customer_profile_screen.dart';

import 'features/cart/presentation/bloc/cart_cubit.dart';
import 'features/cart/presentation/screens/cart_screen.dart';

import 'features/addresses/data/sources/address_remote_source.dart';
import 'features/addresses/data/repositories/address_repository.dart';
import 'features/addresses/presentation/bloc/address_cubit.dart';
import 'features/addresses/domain/models/customer_address.dart';
import 'features/addresses/presentation/screens/saved_addresses_screen.dart';
import 'features/addresses/presentation/screens/add_edit_address_screen.dart';

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
  final FlutterSecureStorage _secureStorage;
  String? _cookie;

  CookieInterceptor(this._secureStorage);

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    _cookie = await _secureStorage.read(key: 'session_cookie');
    if (_cookie != null) {
      options.headers['Cookie'] = _cookie;
    }
    super.onRequest(options, handler);
  }

  @override
  Future<void> onResponse(Response response, ResponseInterceptorHandler handler) async {
    final rawCookies = response.headers['set-cookie'];
    if (rawCookies != null && rawCookies.isNotEmpty) {
      for (final rawCookie in rawCookies) {
        if (rawCookie.startsWith('logiroute_session=')) {
          final cookie = rawCookie.split(';').first;
          _cookie = cookie;
          await _secureStorage.write(key: 'session_cookie', value: cookie);
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
  )..interceptors.add(CookieInterceptor(_secureStorage));

  static const _secureStorage = FlutterSecureStorage();
  static final _authRemoteSource = AuthRemoteSource(dio);
  static final _authRepository = AuthRepository(
    _authRemoteSource,
    _secureStorage,
  );

  static final _productRemoteSource = ProductRemoteSource(dio);
  static final _productRepository = ProductRepository(_productRemoteSource);

  static final _addressRemoteSource = AddressRemoteSource(dio);
  static final _addressRepository = AddressRepository(_addressRemoteSource);

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthCubit>(
          create: (_) => AuthCubit(_authRepository)..checkAuth(),
        ),
        BlocProvider<ProductCubit>(
          create: (_) => ProductCubit(_productRepository),
        ),
        BlocProvider<CartCubit>(
          create: (_) => CartCubit(),
        ),
        BlocProvider<AddressCubit>(
          create: (_) => AddressCubit(_addressRepository),
        ),
      ],
      child: const LogiRouteAppRouter(),
    );
  }
}

class LogiRouteAppRouter extends StatefulWidget {
  const LogiRouteAppRouter({super.key});

  @override
  State<LogiRouteAppRouter> createState() => _LogiRouteAppRouterState();
}

class _LogiRouteAppRouterState extends State<LogiRouteAppRouter> {
  late final GoRouter _router;
  late final GoRouterRefreshStream _refreshStream;

  @override
  void initState() {
    super.initState();
    final authCubit = context.read<AuthCubit>();
    _refreshStream = GoRouterRefreshStream(authCubit.stream);
    _router = _buildRouter(authCubit);
  }

  @override
  void dispose() {
    _refreshStream.dispose();
    super.dispose();
  }

  GoRouter _buildRouter(AuthCubit authCubit) {
    return GoRouter(
      initialLocation: '/login',
      refreshListenable: _refreshStream,
      redirect: (ctx, routerState) {
        final authState = authCubit.state;
        final goingToAuth =
            routerState.matchedLocation == '/login' ||
            routerState.matchedLocation == '/otp-verify';

        if (authState is! AuthAuthenticated) {
          if (!goingToAuth) return '/login';
          return null;
        }

        final user = authState.user;

        // Customer Redirection
        if (user.role == 'customer') {
          final isDriverOrAuthScreen =
              routerState.matchedLocation == '/login' ||
              routerState.matchedLocation == '/otp-verify' ||
              routerState.matchedLocation == '/onboarding' ||
              routerState.matchedLocation == '/onboarding-review' ||
              routerState.matchedLocation == '/dashboard' ||
              routerState.matchedLocation.startsWith('/delivery') ||
              routerState.matchedLocation.startsWith('/orders');
          
          if (isDriverOrAuthScreen) return '/home';
          return null;
        }

        // Driver Redirection
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
              routerState.matchedLocation == '/onboarding-review' ||
              routerState.matchedLocation == '/home' ||
              routerState.matchedLocation == '/customer-profile' ||
              routerState.matchedLocation == '/search' ||
              routerState.matchedLocation.startsWith('/products');
          
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
            final extra = state.extra;
            String phone = '';
            String role = 'delivery_partner';
            if (extra is String) {
              phone = extra;
            } else if (extra is Map<String, dynamic>) {
              phone = extra['phone'] as String? ?? '';
              role = extra['role'] as String? ?? 'delivery_partner';
            }
            return OtpVerifyScreen(phone: phone, role: role);
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
        // Customer Routes
        GoRoute(
          path: '/home',
          builder: (ctx, state) => const CustomerHomeScreen(),
        ),
        GoRoute(
          path: '/search',
          builder: (ctx, state) => const ProductSearchScreen(),
        ),
        GoRoute(
          path: '/products/:id',
          builder: (ctx, state) {
            final id = state.pathParameters['id'] ?? '';
            return ProductDetailScreen(productId: id);
          },
        ),
        GoRoute(
          path: '/customer-profile',
          builder: (ctx, state) => const CustomerProfileScreen(),
        ),
        GoRoute(
          path: '/cart',
          builder: (ctx, state) => const CartScreen(),
        ),
        GoRoute(
          path: '/saved-addresses',
          builder: (ctx, state) => const SavedAddressesScreen(),
        ),
        GoRoute(
          path: '/add-edit-address',
          builder: (ctx, state) {
            final extra = state.extra;
            if (extra is CustomerAddress) {
              return AddEditAddressScreen(addressToEdit: extra);
            }
            return const AddEditAddressScreen();
          },
        ),
      ],
    );
  }

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

class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
          (dynamic _) => notifyListeners(),
        );
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
