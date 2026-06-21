import '../../domain/models/category.dart';
import '../../domain/models/product.dart';

abstract class ProductState {
  const ProductState();
}

class ProductInitial extends ProductState {
  const ProductInitial();
}

class ProductLoading extends ProductState {
  const ProductLoading();
}

class ProductHomeLoaded extends ProductState {
  final List<ProductCategory> categories;
  final List<Product> featuredProducts;

  const ProductHomeLoaded({
    required this.categories,
    required this.featuredProducts,
  });
}

class ProductListLoaded extends ProductState {
  final List<Product> products;
  const ProductListLoaded({required this.products});
}

class ProductDetailLoaded extends ProductState {
  final Product product;
  const ProductDetailLoaded({required this.product});
}

class ProductSearchLoaded extends ProductState {
  final List<Product> results;
  const ProductSearchLoaded({required this.results});
}

class ProductError extends ProductState {
  final String message;
  const ProductError({required this.message});
}
