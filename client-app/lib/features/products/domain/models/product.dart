class Product {
  final String id;
  final String storeId;
  final String? storeName;
  final String name;
  final String? description;
  final int price; // stored in cents/paise (integer)
  final String? unitSize;
  final String? category;
  final String? categoryId;
  final String? categoryName;
  final String? imageUrl;
  final List<String> images;
  final bool isFeatured;
  final bool isVeg;
  final bool inStock;
  final String? brand;
  final String? shelfLife;
  final String? origin;
  final String? ingredients;

  const Product({
    required this.id,
    required this.storeId,
    this.storeName,
    required this.name,
    this.description,
    required this.price,
    this.unitSize,
    this.category,
    this.categoryId,
    this.categoryName,
    this.imageUrl,
    this.images = const [],
    required this.isFeatured,
    required this.isVeg,
    required this.inStock,
    this.brand,
    this.shelfLife,
    this.origin,
    this.ingredients,
  });

  double get displayPrice => price / 100.0;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      storeId: json['storeId'] as String,
      storeName: json['storeName'] as String?,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: json['price'] as int,
      unitSize: json['unitSize'] as String?,
      category: json['category'] as String?,
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
      imageUrl: json['imageUrl'] as String?,
      images: json['images'] != null
          ? List<String>.from(json['images'] as List)
          : (json['imageUrl'] != null ? [json['imageUrl'] as String] : const []),
      isFeatured: json['isFeatured'] as bool? ?? false,
      isVeg: json['isVeg'] as bool? ?? true,
      inStock: json['inStock'] as bool? ?? true,
      brand: json['brand'] as String?,
      shelfLife: json['shelfLife'] as String?,
      origin: json['origin'] as String?,
      ingredients: json['ingredients'] as String?,
    );
  }
}
