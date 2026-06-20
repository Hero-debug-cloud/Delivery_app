import '../../domain/models/auth_user.dart';

abstract class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthOtpSent extends AuthState {
  final String phone;
  const AuthOtpSent({required this.phone});
}

class AuthAuthenticated extends AuthState {
  final AuthUser user;
  const AuthAuthenticated({required this.user});
}

class AuthError extends AuthState {
  final String message;
  const AuthError({required this.message});
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}
