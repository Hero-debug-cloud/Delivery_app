import '../../domain/models/customer_address.dart';
import '../sources/address_remote_source.dart';

class AddressRepository {
  final AddressRemoteSource _remoteSource;

  AddressRepository(this._remoteSource);

  Future<List<CustomerAddress>> getAddresses() async {
    try {
      return await _remoteSource.getAddresses();
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<CustomerAddress> createAddress(CustomerAddress address) async {
    try {
      return await _remoteSource.createAddress(address.toJson());
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<CustomerAddress> updateAddress(String id, Map<String, dynamic> data) async {
    try {
      return await _remoteSource.updateAddress(id, data);
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> deleteAddress(String id) async {
    try {
      await _remoteSource.deleteAddress(id);
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }
}
