import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../cart/presentation/bloc/cart_cubit.dart';
import '../../../cart/presentation/bloc/cart_state.dart';
import '../../../cart/presentation/widgets/bottom_cart_sheet.dart';
import '../bloc/product_cubit.dart';
import '../bloc/product_state.dart';
import '../../domain/models/product.dart';
import '../../domain/models/category.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  String? _selectedCategoryId;
  String _selectedCategoryName = 'All Categories';

  @override
  void initState() {
    super.initState();
    context.read<ProductCubit>().loadHomeData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF16A34A), // Rich Veg Green
        elevation: 0,
        toolbarHeight: 65,
        title: Row(
          children: [
            const Icon(Icons.location_on, color: Colors.white, size: 28),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Text(
                        'Delivery to Home',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                    ],
                  ),
                  const Text(
                    '505 Park Avenue, Sector 3, Bangalore',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFFDCFCE7),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle, color: Colors.white, size: 28),
            onPressed: () => context.push('/customer-profile'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      bottomNavigationBar: const BottomCartSheet(),
      body: RefreshIndicator(
        onRefresh: () => context.read<ProductCubit>().loadHomeData(),
        color: const Color(0xFF16A34A),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search Bar Header (Tapping routes to dedicated search screen)
              GestureDetector(
                onTap: () => context.push('/search'),
                child: Container(
                  color: const Color(0xFF16A34A),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.search, color: Color(0xFF64748B)),
                        SizedBox(width: 12),
                        Text(
                          'Search "milk", "bread" or "veggies"...',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Mock Coupon Banner
              Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  height: 110,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF15803D), Color(0xFF22C55E)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -10,
                        bottom: -10,
                        child: Icon(
                          Icons.shopping_basket_outlined,
                          size: 130,
                          color: Colors.white.withOpacity(0.12),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text(
                              'Get 20% OFF',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'On all fresh fruits and green vegetables',
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFFDCFCE7),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),

              // Categories Grid section
              BlocBuilder<ProductCubit, ProductState>(
                builder: (context, state) {
                  if (state is ProductLoading) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: CircularProgressIndicator(color: Color(0xFF16A34A)),
                      ),
                    );
                  }

                  if (state is ProductError) {
                    return Container(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Error loading products: ${state.message}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Color(0xFFDC2626)),
                      ),
                    );
                  }

                  if (state is ProductHomeLoaded) {
                    final categories = state.categories;
                    final featured = state.featuredProducts;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Categories List
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Text(
                            'Shop By Category',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF020617),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: categories.length > 8 ? 8 : categories.length,
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 4,
                              childAspectRatio: 0.8,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                            ),
                            itemBuilder: (context, index) {
                              final cat = categories[index];
                              return _buildCategoryCard(context, cat);
                            },
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Selected Category View or Featured Products
                        if (_selectedCategoryId != null) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _selectedCategoryName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF020617),
                                  ),
                                ),
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _selectedCategoryId = null;
                                      _selectedCategoryName = 'All Categories';
                                    });
                                  },
                                  child: const Text(
                                    'Clear Filter',
                                    style: TextStyle(color: Color(0xFF16A34A)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          _CategoryProductsLoader(categoryId: _selectedCategoryId!),
                        ] else ...[
                          // Featured Items Scroll
                          if (featured.isNotEmpty) ...[
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: const [
                                  Text(
                                    'Trending & Featured',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF020617),
                                    ),
                                  ),
                                  Text(
                                    'Fresh items daily',
                                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              height: 240,
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                scrollDirection: Axis.horizontal,
                                itemCount: featured.length,
                                itemBuilder: (context, index) {
                                  final prod = featured[index];
                                  return _buildProductCard(context, prod);
                                },
                              ),
                            ),
                          ],
                        ],
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              const SizedBox(height: 80), // spacer for bottom cart sheet
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, ProductCategory cat) {
    final isSelected = _selectedCategoryId == cat.id;

    return GestureDetector(
      onTap: () {
        setState(() {
          if (_selectedCategoryId == cat.id) {
            _selectedCategoryId = null;
            _selectedCategoryName = 'All Categories';
          } else {
            _selectedCategoryId = cat.id;
            _selectedCategoryName = cat.name;
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFF1F5F9),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: cat.imageUrl != null
                    ? Image.network(
                        cat.imageUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.grid_view_rounded,
                          size: 32,
                          color: Color(0xFF16A34A),
                        ),
                      )
                    : const Icon(
                        Icons.grid_view_rounded,
                        size: 32,
                        color: Color(0xFF16A34A),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0, left: 4, right: 4),
              child: Text(
                cat.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF020617),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, Product prod) {
    return Container(
      width: 145,
      margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: () => context.push('/products/${prod.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image with Veg tag overlay
              Stack(
                children: [
                  Container(
                    height: 100,
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

              // Title
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
              const SizedBox(height: 2),

              // Size
              Text(
                prod.unitSize ?? '',
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF64748B),
                ),
              ),
              const Spacer(),

              // Price + Cart Button
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

// Widget to load products under a category asynchronously
class _CategoryProductsLoader extends StatefulWidget {
  final String categoryId;
  const _CategoryProductsLoader({required this.categoryId});

  @override
  State<_CategoryProductsLoader> createState() => _CategoryProductsLoaderState();
}

class _CategoryProductsLoaderState extends State<_CategoryProductsLoader> {
  late ProductCubit _categoryCubit;

  @override
  void initState() {
    super.initState();
    // Using a separate cubit instance so it does not overwrite the main page home state
    _categoryCubit = ProductCubit(context.read<ProductCubit>().repository);
    _categoryCubit.loadCategoryProducts(widget.categoryId);
  }

  @override
  void didUpdateWidget(covariant _CategoryProductsLoader oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.categoryId != widget.categoryId) {
      _categoryCubit.loadCategoryProducts(widget.categoryId);
    }
  }

  @override
  void dispose() {
    _categoryCubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProductCubit, ProductState>(
      bloc: _categoryCubit,
      builder: (context, state) {
        if (state is ProductLoading) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: CircularProgressIndicator(color: Color(0xFF16A34A)),
            ),
          );
        }

        if (state is ProductListLoaded) {
          final list = state.products;
          if (list.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Text('No products found in this category'),
              ),
            );
          }

          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: list.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.72,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemBuilder: (context, index) {
              final prod = list[index];
              return _GridProductCard(prod: prod);
            },
          );
        }

        return const SizedBox.shrink();
      },
    );
  }
}

class _GridProductCard extends StatelessWidget {
  final Product prod;
  const _GridProductCard({required this.prod});

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
                    height: 110,
                    width: double.infinity,
                    alignment: Alignment.center,
                    child: prod.imageUrl != null
                        ? Image.network(
                            prod.imageUrl!,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.restaurant,
                              size: 44,
                              color: Color(0xFFCBD5E1),
                            ),
                          )
                        : const Icon(
                            Icons.restaurant,
                            size: 44,
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
                      fontSize: 15,
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

// Interactive Add To Cart Button Component
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
