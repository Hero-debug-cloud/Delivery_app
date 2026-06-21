import '../../domain/models/category.dart';
import '../../domain/models/product.dart';
import '../sources/product_remote_source.dart';

class ProductRepository {
  final ProductRemoteSource _remoteSource;

  ProductRepository(this._remoteSource);

  Future<List<ProductCategory>> getCategories() async {
    try {
      return await _remoteSource.getCategories();
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<List<Product>> getProducts({
    String? categoryId,
    String? search,
    bool? isFeatured,
    int limit = 50,
  }) async {
    try {
      return await _remoteSource.getProducts(
        categoryId: categoryId,
        search: search,
        isFeatured: isFeatured,
        limit: limit,
      );
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<Product> getProductById(String id) async {
    try {
      return await _remoteSource.getProductById(id);
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }
}
