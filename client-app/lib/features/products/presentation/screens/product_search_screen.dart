import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../cart/presentation/bloc/cart_cubit.dart';
import '../../../cart/presentation/bloc/cart_state.dart';
import '../../../cart/presentation/widgets/bottom_cart_sheet.dart';
import '../bloc/product_cubit.dart';
import '../bloc/product_state.dart';
import '../../domain/models/product.dart';

class ProductSearchScreen extends StatefulWidget {
  const ProductSearchScreen({super.key});

  @override
  State<ProductSearchScreen> createState() => _ProductSearchScreenState();
}

class _ProductSearchScreenState extends State<ProductSearchScreen> {
  final _searchController = TextEditingController();
  late ProductCubit _searchCubit;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _searchCubit = ProductCubit(context.read<ProductCubit>().repository);
    _searchCubit.searchProducts('');
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    _searchCubit.close();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      if (mounted) {
        _searchCubit.searchProducts(query);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF020617)),
          onPressed: () => context.pop(),
        ),
        title: Container(
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
          ),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search for grocery items...',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Color(0xFF64748B), size: 18),
                      onPressed: () {
                        _searchController.clear();
                        _searchCubit.searchProducts('');
                        setState(() {});
                      },
                    )
                  : null,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
            style: const TextStyle(color: Color(0xFF020617), fontSize: 15),
          ),
        ),
      ),
      bottomNavigationBar: const BottomCartSheet(),
      body: BlocBuilder<ProductCubit, ProductState>(
        bloc: _searchCubit,
        builder: (context, state) {
          if (state is ProductLoading) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF16A34A)),
            );
          }

          if (state is ProductSearchLoaded) {
            final results = state.results;

            if (_searchController.text.trim().isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search, size: 64, color: Color(0xFFCBD5E1)),
                    SizedBox(height: 12),
                    Text(
                      'Type something to search...',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 15),
                    ),
                  ],
                ),
              );
            }

            if (results.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search_off, size: 64, color: Color(0xFFCBD5E1)),
                    SizedBox(height: 12),
                    Text(
                      'No products match your search.',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 15),
                    ),
                  ],
                ),
              );
            }

            return GridView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: results.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.72,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemBuilder: (context, index) {
                final prod = results[index];
                return _SearchProductGridCard(prod: prod);
              },
            );
          }

          if (state is ProductError) {
            return Center(
              child: Text(
                'Error: ${state.message}',
                style: const TextStyle(color: Color(0xFFDC2626)),
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _SearchProductGridCard extends StatelessWidget {
  final Product prod;
  const _SearchProductGridCard({required this.prod});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: () => context.push('/products/${prod.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  Container(
                    height: 105,
                    width: double.infinity,
                    alignment: Alignment.center,
                    child: prod.imageUrl != null
                        ? Image.network(
                            prod.imageUrl!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.restaurant,
                              size: 40,
                              color: Color(0xFFCBD5E1),
                            ),
                          )
                        : const Icon(
                            Icons.restaurant,
                            size: 40,
                            color: Color(0xFFCBD5E1),
                          ),
                  ),
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(
                          color: prod.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: prod.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                prod.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF020617),
                ),
              ),
              Text(
                prod.unitSize ?? '',
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF64748B),
                ),
              ),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '₹${prod.displayPrice.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF020617),
                    ),
                  ),
                  _AddToCartButton(product: prod),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Reusable Add To Cart Button duplicate for search (bound to globally available CartCubit)
class _AddToCartButton extends StatelessWidget {
  final Product product;
  const _AddToCartButton({required this.product});

  @override
  Widget build(BuildContext context) {
    final cartCubit = context.read<CartCubit>();

    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        final isInCart = state.items.containsKey(product.id);
        if (!isInCart) {
          return SizedBox(
            height: 32,
            child: OutlinedButton(
              onPressed: () => cartCubit.addItem(product),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF16A34A),
                side: const BorderSide(color: Color(0xFF16A34A), width: 1.5),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              child: const Text('ADD'),
            ),
          );
        }

        final quantity = state.items[product.id]!.quantity;
        return Container(
          height: 32,
          decoration: BoxDecoration(
            color: const Color(0xFF16A34A),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: () => cartCubit.removeItem(product),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(Icons.remove, size: 14, color: Colors.white),
                ),
              ),
              Text(
                '$quantity',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              GestureDetector(
                onTap: () => cartCubit.addItem(product),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Icon(Icons.add, size: 14, color: Colors.white),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
