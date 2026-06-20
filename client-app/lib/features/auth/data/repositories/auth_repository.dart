import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../sources/auth_remote_source.dart';
import '../../domain/models/auth_user.dart';

class AuthRepository {
  final AuthRemoteSource _remoteSource;
  final FlutterSecureStorage _secureStorage;

  static const _userIdKey = 'auth_user_id';
  static const _userRoleKey = 'auth_user_role';
  static const _userNameKey = 'auth_user_name';
  static const _userPhoneKey = 'auth_user_phone';

  AuthRepository(this._remoteSource, this._secureStorage);

  Future<void> requestOtp(String phone) async {
    await _remoteSource.requestOtp(phone);
  }

  Future<AuthUser> verifyOtp(String phone, String otp) async {
    final user = await _remoteSource.verifyOtp(phone, otp);
    // Store user info locally
    await _secureStorage.write(key: _userIdKey, value: user.id);
    await _secureStorage.write(key: _userRoleKey, value: user.role);
    await _secureStorage.write(key: _userNameKey, value: user.name);
    await _secureStorage.write(key: _userPhoneKey, value: user.phone);
    return user;
  }

  Future<AuthUser?> getStoredUser() async {
    final id = await _secureStorage.read(key: _userIdKey);
    if (id == null) return null;
    final name = await _secureStorage.read(key: _userNameKey) ?? '';
    final role = await _secureStorage.read(key: _userRoleKey) ?? '';
    final phone = await _secureStorage.read(key: _userPhoneKey);
    return AuthUser(id: id, name: name, phone: phone, role: role);
  }

  Future<void> logout() async {
    await _remoteSource.logout();
    await _secureStorage.deleteAll();
  }
}
