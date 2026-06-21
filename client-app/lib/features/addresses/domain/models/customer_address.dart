class CustomerAddress {
  final String id;
  final String customerId;
  final String label;
  final String address;
  final double latitude;
  final double longitude;
  final bool isDefault;
  final String? recipientName;
  final String? recipientPhone;

  const CustomerAddress({
    required this.id,
    required this.customerId,
    required this.label,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.isDefault,
    this.recipientName,
    this.recipientPhone,
  });

  factory CustomerAddress.fromJson(Map<String, dynamic> json) {
    return CustomerAddress(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      label: json['label'] as String,
      address: json['address'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      isDefault: json['isDefault'] as bool? ?? false,
      recipientName: json['recipientName'] as String?,
      recipientPhone: json['recipientPhone'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'isDefault': isDefault,
      'recipientName': recipientName,
      'recipientPhone': recipientPhone,
    };
  }

  CustomerAddress copyWith({
    String? id,
    String? customerId,
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    bool? isDefault,
    String? recipientName,
    String? recipientPhone,
  }) {
    return CustomerAddress(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      label: label ?? this.label,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isDefault: isDefault ?? this.isDefault,
      recipientName: recipientName ?? this.recipientName,
      recipientPhone: recipientPhone ?? this.recipientPhone,
    );
  }
}
