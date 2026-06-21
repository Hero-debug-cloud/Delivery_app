import 'package:dio/dio.dart';
import '../../domain/models/customer_address.dart';

class AddressRemoteSource {
  final Dio _dio;

  AddressRemoteSource(this._dio);

  Future<List<CustomerAddress>> getAddresses() async {
    final response = await _dio.get('/customer/addresses');

    if (response.statusCode == 200) {
      final data = response.data['data'] as List;
      return data.map((json) => CustomerAddress.fromJson(json)).toList();
    } else {
      throw Exception(response.data['message'] ?? 'Failed to load addresses');
    }
  }

  Future<CustomerAddress> createAddress(Map<String, dynamic> data) async {
    final response = await _dio.post('/customer/addresses', data: data);

    if (response.statusCode == 201) {
      return CustomerAddress.fromJson(response.data['data'] as Map<String, dynamic>);
    } else {
      throw Exception(response.data['message'] ?? 'Failed to create address');
    }
  }

  Future<CustomerAddress> updateAddress(String id, Map<String, dynamic> data) async {
    final response = await _dio.patch('/customer/addresses/$id', data: data);

    if (response.statusCode == 200) {
      return CustomerAddress.fromJson(response.data['data'] as Map<String, dynamic>);
    } else {
      throw Exception(response.data['message'] ?? 'Failed to update address');
    }
  }

  Future<void> deleteAddress(String id) async {
    final response = await _dio.delete('/customer/addresses/$id');

    if (response.statusCode != 200) {
      throw Exception(response.data['message'] ?? 'Failed to delete address');
    }
  }
}
