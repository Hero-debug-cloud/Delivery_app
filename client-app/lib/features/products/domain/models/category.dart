class ProductCategory {
  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final bool isActive;

  const ProductCategory({
    required this.id,
    required this.name,
    this.description,
    this.imageUrl,
    required this.isActive,
  });

  factory ProductCategory.fromJson(Map<String, dynamic> json) {
    return ProductCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
