import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../products/domain/models/product.dart';
import 'cart_state.dart';

class CartCubit extends Cubit<CartState> {
  CartCubit() : super(CartState.initial());

  void addItem(Product product) {
    final updatedItems = Map<String, CartItem>.from(state.items);
    if (updatedItems.containsKey(product.id)) {
      final currentItem = updatedItems[product.id]!;
      updatedItems[product.id] = currentItem.copyWith(quantity: currentItem.quantity + 1);
    } else {
      updatedItems[product.id] = CartItem(product: product, quantity: 1);
    }
    emit(state.copyWith(items: updatedItems));
  }

  void removeItem(Product product) {
    final updatedItems = Map<String, CartItem>.from(state.items);
    if (updatedItems.containsKey(product.id)) {
      final currentItem = updatedItems[product.id]!;
      if (currentItem.quantity <= 1) {
        updatedItems.remove(product.id);
      } else {
        updatedItems[product.id] = currentItem.copyWith(quantity: currentItem.quantity - 1);
      }
      emit(state.copyWith(items: updatedItems));
    }
  }

  void updateQuantity(Product product, int quantity) {
    final updatedItems = Map<String, CartItem>.from(state.items);
    if (quantity <= 0) {
      updatedItems.remove(product.id);
    } else {
      updatedItems[product.id] = CartItem(product: product, quantity: quantity);
    }
    emit(state.copyWith(items: updatedItems));
  }

  void clear() {
    emit(CartState.initial());
  }
}
