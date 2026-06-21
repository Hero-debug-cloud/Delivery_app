import '../../../products/domain/models/product.dart';

class CartItem {
  final Product product;
  final int quantity;

  const CartItem({
    required this.product,
    required this.quantity,
  });

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }

  double get totalOriginalPrice => product.displayPrice * quantity;
}

class CartState {
  final Map<String, CartItem> items;

  const CartState({required this.items});

  factory CartState.initial() => const CartState(items: {});

  int get itemCount => items.values.fold(0, (sum, item) => sum + item.quantity);

  double get itemTotal => items.values.fold(0.0, (sum, item) => sum + item.totalOriginalPrice);

  double get deliveryFee => itemTotal > 0 && itemTotal < 15.0 ? 3.0 : 0.0; // Mock delivery fee structure

  double get handlingCharge => itemTotal > 0 ? 1.50 : 0.0; // Mock handling fee

  double get grandTotal => itemTotal + deliveryFee + handlingCharge;

  CartState copyWith({Map<String, CartItem>? items}) {
    return CartState(
      items: items ?? this.items,
    );
  }
}
