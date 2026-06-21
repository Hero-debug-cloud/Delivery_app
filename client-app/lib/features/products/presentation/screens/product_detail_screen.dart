import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../cart/presentation/bloc/cart_cubit.dart';
import '../../../cart/presentation/bloc/cart_state.dart';
import '../bloc/product_cubit.dart';
import '../bloc/product_state.dart';
import '../../domain/models/product.dart';
import '../../../../core/network_utils.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late ProductCubit _detailCubit;
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _detailCubit = ProductCubit(context.read<ProductCubit>().repository);
    _detailCubit.loadProductDetail(widget.productId);
  }

  @override
  void dispose() {
    _detailCubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF020617)),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Product Details',
          style: TextStyle(color: Color(0xFF020617), fontWeight: FontWeight.bold),
        ),
        actions: [
          BlocBuilder<CartCubit, CartState>(
            builder: (context, state) {
              return Badge(
                isLabelVisible: state.itemCount > 0,
                label: Text('${state.itemCount}'),
                backgroundColor: const Color(0xFF16A34A),
                child: IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF020617)),
                  onPressed: () {
                    if (state.itemCount > 0) {
                      context.push('/cart');
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Your cart is empty.'),
                          backgroundColor: Color(0xFF64748B),
                        ),
                      );
                    }
                  },
                ),
              );
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: BlocBuilder<ProductCubit, ProductState>(
        bloc: _detailCubit,
        builder: (context, state) {
          if (state is ProductLoading) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF16A34A)),
            );
          }

          if (state is ProductDetailLoaded) {
            final prod = state.product;

            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Large Product Image Carousel (Zepto/Blinkit style)
                        Center(
                          child: Container(
                            height: 240,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Stack(
                              children: [
                                if (prod.images.isNotEmpty) ...[
                                  PageView.builder(
                                    itemCount: prod.images.length,
                                    onPageChanged: (index) {
                                      setState(() {
                                        _currentImageIndex = index;
                                      });
                                    },
                                    itemBuilder: (context, index) {
                                      return Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Image.network(
                                          NetworkUtils.resolveUrl(prod.images[index]),
                                          fit: BoxFit.contain,
                                          errorBuilder: (_, __, ___) => const Icon(
                                            Icons.restaurant,
                                            size: 80,
                                            color: Color(0xFFCBD5E1),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  // Dot Indicators Overlay
                                  if (prod.images.length > 1)
                                    Positioned(
                                      bottom: 12,
                                      left: 0,
                                      right: 0,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: List.generate(
                                          prod.images.length,
                                          (index) => AnimatedContainer(
                                            duration: const Duration(milliseconds: 250),
                                            margin: const EdgeInsets.symmetric(horizontal: 4),
                                            width: _currentImageIndex == index ? 16 : 6,
                                            height: 6,
                                            decoration: BoxDecoration(
                                              color: _currentImageIndex == index
                                                  ? const Color(0xFF16A34A) // Premium Zepto Green
                                                  : const Color(0xFFCBD5E1),
                                              borderRadius: BorderRadius.circular(3),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                ] else ...[
                                  const Center(
                                    child: Icon(
                                      Icons.restaurant,
                                      size: 80,
                                      color: Color(0xFFCBD5E1),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Veg / Non-Veg Indicator
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: prod.isVeg ? const Color(0xFFEFF6FF) : const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: prod.isVeg ? const Color(0xFFBFDBFE) : const Color(0xFFFCA5A5),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      border: Border.all(
                                        color: prod.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                                        width: 1.5,
                                      ),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Container(
                                      width: 4,
                                      height: 4,
                                      decoration: BoxDecoration(
                                        color: prod.isVeg ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    prod.isVeg ? 'Veg' : 'Non-Veg',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: prod.isVeg ? const Color(0xFF2563EB) : const Color(0xFFDC2626),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (prod.storeName != null) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Text(
                                  prod.storeName!,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                                ),
                              ),
                            ]
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Title
                        Text(
                          prod.name,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF020617),
                          ),
                        ),
                        const SizedBox(height: 4),

                        // Size
                        if (prod.unitSize != null)
                          Text(
                            prod.unitSize!,
                            style: const TextStyle(
                              fontSize: 15,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        const SizedBox(height: 20),

                        const Divider(color: Color(0xFFE2E8F0)),
                        const SizedBox(height: 16),

                        // Description Heading
                        const Text(
                          'Product Details',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF020617),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          prod.description ?? 'No detailed description available for this item.',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF475569),
                            height: 1.5,
                          ),
                        ),
                        if (prod.brand != null || prod.shelfLife != null || prod.origin != null || prod.ingredients != null) ...[
                          const SizedBox(height: 24),
                          const Text(
                            'Product Highlights',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF020617),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              children: [
                                if (prod.brand != null && prod.brand!.isNotEmpty)
                                  _buildHighlightRow('Brand', prod.brand!, isLast: prod.shelfLife == null && prod.origin == null && prod.ingredients == null),
                                if (prod.shelfLife != null && prod.shelfLife!.isNotEmpty)
                                  _buildHighlightRow('Shelf Life', prod.shelfLife!, isLast: prod.origin == null && prod.ingredients == null),
                                if (prod.origin != null && prod.origin!.isNotEmpty)
                                  _buildHighlightRow('Country of Origin', prod.origin!, isLast: prod.ingredients == null),
                                if (prod.ingredients != null && prod.ingredients!.isNotEmpty)
                                  _buildHighlightRow('Ingredients', prod.ingredients!, isLast: true),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                // Floating Action Bar at the Bottom
                _buildBottomActionBar(context, prod),
              ],
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

  Widget _buildBottomActionBar(BuildContext context, Product prod) {
    final cartCubit = context.read<CartCubit>();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, -4),
          )
        ],
        border: const Border(top: BorderSide(color: Color(0xFFEFF6FF))),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Retail Price',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                Text(
                  '₹${prod.displayPrice.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF020617),
                  ),
                ),
              ],
            ),
            BlocBuilder<CartCubit, CartState>(
              builder: (context, state) {
                final isInCart = state.items.containsKey(prod.id);
                if (!isInCart) {
                  return SizedBox(
                    width: 160,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => cartCubit.addItem(prod),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text('Add to Cart'),
                    ),
                  );
                }

                final quantity = state.items[prod.id]!.quantity;
                return Container(
                  width: 160,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF16A34A),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove, color: Colors.white),
                        onPressed: () => cartCubit.removeItem(prod),
                      ),
                      Text(
                        '$quantity',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add, color: Colors.white),
                        onPressed: () => cartCubit.addItem(prod),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHighlightRow(String label, String value, {bool isLast = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF020617),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
