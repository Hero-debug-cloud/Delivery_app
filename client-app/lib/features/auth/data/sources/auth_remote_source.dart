import 'package:dio/dio.dart';
import '../../domain/models/auth_user.dart';

class AuthRemoteSource {
  final Dio _dio;

  AuthRemoteSource(this._dio);

  Future<void> requestOtp(String phone) async {
    final response = await _dio.post(
      '/auth/otp/request',
      data: {'phone': phone},
    );
    if (response.statusCode != 200) {
      throw Exception(response.data['error'] ?? 'Failed to send OTP');
    }
  }

  Future<AuthUser> verifyOtp(String phone, String otp) async {
    final response = await _dio.post(
      '/auth/otp/verify',
      data: {'phone': phone, 'otp': otp},
    );
    if (response.statusCode != 200) {
      final error = response.data['error'] ?? 'OTP verification failed';
      throw Exception(error);
    }
    return AuthUser.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  Future<AuthUser> getMe() async {
    final response = await _dio.get('/auth/me');
    if (response.statusCode != 200) {
      throw Exception('Not authenticated');
    }
    return AuthUser.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }
}
