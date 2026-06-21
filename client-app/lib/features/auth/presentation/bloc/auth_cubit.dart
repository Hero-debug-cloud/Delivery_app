import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/auth_repository.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _repository;

  AuthCubit(this._repository) : super(const AuthInitial());

  Future<void> checkAuth() async {
    emit(const AuthLoading());
    try {
      final user = await _repository.getStoredUser();
      if (user != null) {
        emit(AuthAuthenticated(user: user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } catch (_) {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> requestOtp(String phone) async {
    emit(const AuthLoading());
    try {
      await _repository.requestOtp(phone);
      emit(AuthOtpSent(phone: phone));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> verifyOtp(String phone, String otp, {String? role}) async {
    emit(const AuthLoading());
    try {
      final user = await _repository.verifyOtp(phone, otp, role: role);
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      emit(AuthError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } finally {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> updateProfile({String? name, String? email}) async {
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      final updatedUser = await _repository.updateProfile(name: name, email: email);
      emit(AuthAuthenticated(user: updatedUser));
    } else {
      throw Exception("User is not authenticated");
    }
  }
}
