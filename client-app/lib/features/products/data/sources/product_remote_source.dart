import 'package:dio/dio.dart';
import '../../domain/models/category.dart';
import '../../domain/models/product.dart';

class ProductRemoteSource {
  final Dio _dio;

  ProductRemoteSource(this._dio);

  Future<List<ProductCategory>> getCategories() async {
    final response = await _dio.get(
      '/categories',
      queryParameters: {'isActive': true, 'limit': 100},
    );

    if (response.statusCode == 200) {
      final data = response.data['data'] as List;
      return data.map((json) => ProductCategory.fromJson(json)).toList();
    } else {
      throw Exception(response.data['message'] ?? 'Failed to load categories');
    }
  }

  Future<List<Product>> getProducts({
    String? categoryId,
    String? search,
    bool? isFeatured,
    int limit = 50,
  }) async {
    final response = await _dio.get(
      '/products',
      queryParameters: {
        if (categoryId != null) 'categoryId': categoryId,
        if (search != null && search.isNotEmpty) 'search': search,
        if (isFeatured != null) 'isFeatured': isFeatured,
        'limit': limit,
        'inStock': true,
      },
    );

    if (response.statusCode == 200) {
      final data = response.data['data'] as List;
      return data.map((json) => Product.fromJson(json)).toList();
    } else {
      throw Exception(response.data['message'] ?? 'Failed to load products');
    }
  }

  Future<Product> getProductById(String id) async {
    final response = await _dio.get('/products/$id');

    if (response.statusCode == 200) {
      return Product.fromJson(response.data['data'] as Map<String, dynamic>);
    } else {
      throw Exception(response.data['message'] ?? 'Failed to load product detail');
    }
  }
}
