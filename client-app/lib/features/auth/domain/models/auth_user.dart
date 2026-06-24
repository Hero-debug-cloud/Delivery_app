class DriverProfile {
  final String id;
  final String? storeId;
  final String? vehicleType;
  final String? vehicleNumber;
  final String onboardingStatus;
  final String status;
  final String? rejectionReason;
  final String? licenseNumber;
  final String? licenseExpiry;
  final String? licenseFrontUrl;
  final String? licenseBackUrl;
  final String? vehiclePlateImage;
  final String? identityProofType;
  final String? identityProofNumber;
  final String? identityProofImage;
  final String? profilePictureUrl;
  final Map<String, dynamic>? store;

  const DriverProfile({
    required this.id,
    this.storeId,
    this.vehicleType,
    this.vehicleNumber,
    required this.onboardingStatus,
    required this.status,
    this.rejectionReason,
    this.licenseNumber,
    this.licenseExpiry,
    this.licenseFrontUrl,
    this.licenseBackUrl,
    this.vehiclePlateImage,
    this.identityProofType,
    this.identityProofNumber,
    this.identityProofImage,
    this.profilePictureUrl,
    this.store,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      id: json['id'] as String,
      storeId: json['storeId'] as String?,
      vehicleType: json['vehicleType'] as String?,
      vehicleNumber: json['vehicleNumber'] as String?,
      onboardingStatus: json['onboardingStatus'] as String,
      status: json['status'] as String? ?? 'offline',
      rejectionReason: json['rejectionReason'] as String?,
      licenseNumber: json['licenseNumber'] as String?,
      licenseExpiry: json['licenseExpiry'] as String?,
      licenseFrontUrl: json['licenseFrontUrl'] as String?,
      licenseBackUrl: json['licenseBackUrl'] as String?,
      vehiclePlateImage: json['vehiclePlateImage'] as String?,
      identityProofType: json['identityProofType'] as String?,
      identityProofNumber: json['identityProofNumber'] as String?,
      identityProofImage: json['identityProofImage'] as String?,
      profilePictureUrl: json['profilePictureUrl'] as String?,
      store: json['store'] as Map<String, dynamic>?,
    );
  }
}

class AuthUser {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String role;
  final DriverProfile? driverProfile;

  const AuthUser({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    required this.role,
    this.driverProfile,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      role: json['role'] as String,
      driverProfile: json['driverProfile'] != null
          ? DriverProfile.fromJson(json['driverProfile'] as Map<String, dynamic>)
          : null,
    );
  }
}
