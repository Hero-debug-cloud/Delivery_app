import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/product_repository.dart';
import 'product_state.dart';

class ProductCubit extends Cubit<ProductState> {
  final ProductRepository repository;

  ProductCubit(this.repository) : super(const ProductInitial());

  Future<void> loadHomeData() async {
    emit(const ProductLoading());
    try {
      final categories = await repository.getCategories();
      final featured = await repository.getProducts(isFeatured: true, limit: 10);
      emit(ProductHomeLoaded(
        categories: categories,
        featuredProducts: featured,
      ));
    } catch (e) {
      emit(ProductError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> loadCategoryProducts(String categoryId) async {
    emit(const ProductLoading());
    try {
      final products = await repository.getProducts(categoryId: categoryId);
      emit(ProductListLoaded(products: products));
    } catch (e) {
      emit(ProductError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> searchProducts(String query) async {
    if (query.trim().isEmpty) {
      emit(const ProductSearchLoaded(results: []));
      return;
    }
    emit(const ProductLoading());
    try {
      final results = await repository.getProducts(search: query);
      emit(ProductSearchLoaded(results: results));
    } catch (e) {
      emit(ProductError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> loadProductDetail(String id) async {
    emit(const ProductLoading());
    try {
      final product = await repository.getProductById(id);
      emit(ProductDetailLoaded(product: product));
    } catch (e) {
      emit(ProductError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
