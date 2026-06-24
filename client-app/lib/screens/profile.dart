import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../main.dart';
import '../features/auth/presentation/bloc/auth_cubit.dart';

class ProfileScreen extends StatefulWidget {
  final bool isEmbedded;
  const ProfileScreen({super.key, this.isEmbedded = false});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _profileData;
  String? _errorMessage;
  bool _isUploadingPic = false;
  final _picker = ImagePicker();

  String _getInitials(String name) {
    if (name.isEmpty) return "";
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return "";
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length >= 2 ? 2 : parts[0].length).toUpperCase();
    }
    final first = parts[0][0];
    final last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  }

  Future<void> _pickAndUploadProfilePic() async {
    final authCubit = context.read<AuthCubit>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    try {
      final source = await showModalBottomSheet<ImageSource>(
        context: context,
        builder: (ctx) => SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Take Photo'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      );

      if (source == null) return;

      final pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 60,
        maxWidth: 600,
      );

      if (pickedFile == null) return;

      setState(() {
        _isUploadingPic = true;
      });

      MultipartFile multipartFile;
      if (kIsWeb) {
        final bytes = await pickedFile.readAsBytes();
        multipartFile = MultipartFile.fromBytes(
          bytes,
          filename: pickedFile.name,
        );
      } else {
        multipartFile = await MultipartFile.fromFile(
          pickedFile.path,
          filename: pickedFile.name,
        );
      }

      final formData = FormData.fromMap({
        'file': multipartFile,
      });

      final uploadResponse = await LogiRouteApp.dio.post(
        '/upload',
        data: formData,
      );

      if (uploadResponse.statusCode == 200 && uploadResponse.data != null) {
        final key = uploadResponse.data['key'] as String;

        final updateResponse = await LogiRouteApp.dio.patch(
          '/delivery-partners/me/profile',
          data: {
            'profilePictureUrl': key,
          },
        );

        if (updateResponse.statusCode == 200) {
          setState(() {
            _profileData = updateResponse.data['profile'] as Map<String, dynamic>;
          });
          await authCubit.checkAuth();
          scaffoldMessenger.showSnackBar(const SnackBar(
            content: Text("Profile picture updated successfully!"),
            backgroundColor: Colors.green,
          ));
        } else {
          throw Exception('Failed to update profile picture on server');
        }
      } else {
        throw Exception('Upload failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("Failed to upload profile picture: $e"),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingPic = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await LogiRouteApp.dio.get('/delivery-partners/me/profile');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _profileData = response.data['profile'] as Map<String, dynamic>;
            _isLoading = false;
          });
        }
      } else {
        throw Exception("Failed to load profile details");
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateProfile(String name, String email) async {
    final authCubit = context.read<AuthCubit>();
    final response = await LogiRouteApp.dio.patch(
      '/delivery-partners/me/profile',
      data: {
        'name': name,
        'email': email,
      },
    );

    if (response.statusCode == 200) {
      if (mounted) {
        setState(() {
          _profileData = response.data['profile'] as Map<String, dynamic>;
        });
      }
      // Sync global AuthCubit state
      await authCubit.updateProfile(name: name, email: email);
    } else {
      throw Exception(response.data['message'] ?? "Server error");
    }
  }

  void _showDocumentPreview(BuildContext context, String title, String? imageUrl) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                  ),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: imageUrl != null && imageUrl.isNotEmpty
                        ? Image.network(
                            imageUrl,
                            fit: BoxFit.contain,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const SizedBox(
                                height: 250,
                                child: Center(child: CircularProgressIndicator()),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) => const SizedBox(
                              height: 250,
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.broken_image, size: 48, color: Color(0xFFEF4444)),
                                    SizedBox(height: 8),
                                    Text("Failed to load document preview", style: TextStyle(color: Color(0xFF64748B))),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : const SizedBox(
                            height: 250,
                            child: Center(child: Text("Document image not uploaded", style: TextStyle(color: Color(0xFF64748B)))),
                          ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(120, 40),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text("Close"),
                  ),
                ],
              ),
            ),
            Positioned(
              right: 12,
              top: 12,
              child: IconButton(
                icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                onPressed: () => Navigator.pop(ctx),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditProfileSheet(BuildContext context) {
    if (_profileData == null) return;

    final nameController = TextEditingController(text: _profileData!['name']);
    final emailController = TextEditingController(text: _profileData!['email'] ?? '');
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
          ),
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Edit Profile Details',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        final name = nameController.text.trim();
                        final email = emailController.text.trim();

                        if (name.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                            content: Text("Name cannot be empty"),
                            backgroundColor: Colors.red,
                          ));
                          return;
                        }

                        final navigator = Navigator.of(ctx);
                        final scaffoldMessenger = ScaffoldMessenger.of(context);

                        setModalState(() {
                          isSaving = true;
                        });

                        try {
                          await _updateProfile(name, email);
                          navigator.pop();
                        } catch (e) {
                          scaffoldMessenger.showSnackBar(SnackBar(
                            content: Text("Failed to update profile: $e"),
                            backgroundColor: Colors.red,
                          ));
                        } finally {
                          setModalState(() {
                            isSaving = false;
                          });
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileTile({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB), size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF020617),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2563EB),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildDocumentTile({required String title, required String? imageUrl}) {
    final bool hasImage = imageUrl != null && imageUrl.isNotEmpty;
    return InkWell(
      onTap: () => _showDocumentPreview(context, title, imageUrl),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(8),
              ),
              clipBehavior: Clip.antiAlias,
              child: hasImage
                  ? Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.document_scanner, color: Color(0xFF64748B)),
                    )
                  : const Icon(Icons.document_scanner, color: Color(0xFF64748B)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF020617)),
                  ),
                  const SizedBox(height: 2),
                  const Row(
                    children: [
                      Icon(Icons.verified, size: 14, color: Color(0xFF16A34A)),
                      SizedBox(width: 4),
                      Text(
                        'Verified & Read-only',
                        style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.visibility_outlined, size: 20, color: Color(0xFF64748B)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const SizedBox(
        height: 300,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return SizedBox(
        height: 300,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF475569)),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _fetchProfile,
                  child: const Text("Retry"),
                )
              ],
            ),
          ),
        ),
      );
    }

    if (_profileData == null) {
      return const SizedBox(
        height: 300,
        child: Center(child: Text("No profile data found")),
      );
    }

    final String name = _profileData!['name'] ?? 'Not Set';
    final String? email = _profileData!['email'];
    final String phone = _profileData!['phone'] ?? 'Not Set';
    final String onboardingStatus = _profileData!['onboardingStatus'] ?? 'pending';
    final String? profilePictureUrl = _profileData!['profilePictureUrl'];
    final String driverId = _profileData!['id'];
    final String displayId = "DVR-${driverId.substring(0, 8).toUpperCase()}";

    final String? storeName = _profileData!['store']?['name'];
    final String? storeAddress = _profileData!['store']?['address'];

    final String vehicleType = _profileData!['vehicleType'] ?? 'N/A';
    final String vehicleNumber = _profileData!['vehicleNumber'] ?? 'N/A';
    final String licenseNumber = _profileData!['licenseNumber'] ?? 'N/A';
    final String licenseExpiry = _profileData!['licenseExpiry'] ?? 'N/A';

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Profile Header
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: const Color(0xFF2563EB),
                  backgroundImage: profilePictureUrl != null && profilePictureUrl.isNotEmpty
                      ? NetworkImage(profilePictureUrl)
                      : null,
                  child: profilePictureUrl == null || profilePictureUrl.isEmpty
                      ? Text(
                          _getInitials(name),
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: InkWell(
                    onTap: _isUploadingPic ? null : _pickAndUploadProfilePic,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Color(0xFF2563EB),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: _isUploadingPic
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(
                              Icons.camera_alt,
                              color: Colors.white,
                              size: 16,
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            name,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF020617),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'ID: $displayId • Store: ${storeName ?? "Not Assigned"}',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.verified, size: 14, color: Color(0xFF059669)),
                  const SizedBox(width: 4),
                  Text(
                    'STATUS: ${onboardingStatus.toUpperCase()}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Duty stats
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatColumn('Total Jobs', '182'),
                  const SizedBox(
                    height: 40,
                    child: VerticalDivider(color: Color(0xFFE2E8F0)),
                  ),
                  _buildStatColumn('SLA Rate', '99.1%'),
                  const SizedBox(
                    height: 40,
                    child: VerticalDivider(color: Color(0xFFE2E8F0)),
                  ),
                  _buildStatColumn('Rating', '4.95 ★'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Account Details List
          const Text(
            'Account Details',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                _buildProfileTile(
                  icon: Icons.phone_outlined,
                  title: 'Phone Number (Verified)',
                  value: phone,
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                _buildProfileTile(
                  icon: Icons.email_outlined,
                  title: 'Email Address',
                  value: email ?? 'Not Set (Tap edit to add)',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Active Hub details
          if (storeName != null) ...[
            const Text(
              'Active Center / Warehouse',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildProfileTile(
                    icon: Icons.storefront_outlined,
                    title: 'Center Name',
                    value: storeName,
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  _buildProfileTile(
                    icon: Icons.location_on_outlined,
                    title: 'Center Address',
                    value: storeAddress ?? '',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Vehicle & License details
          const Text(
            'Vehicle & License',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                _buildProfileTile(
                  icon: Icons.motorcycle_outlined,
                  title: 'Vehicle Type',
                  value: vehicleType.toUpperCase(),
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                _buildProfileTile(
                  icon: Icons.tag_outlined,
                  title: 'Vehicle Plate Number',
                  value: vehicleNumber,
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                _buildProfileTile(
                  icon: Icons.badge_outlined,
                  title: 'License Number',
                  value: licenseNumber,
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                _buildProfileTile(
                  icon: Icons.calendar_today_outlined,
                  title: 'License Expiry',
                  value: licenseExpiry,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Uploaded Documents
          const Text(
            'Verified Documents',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildDocumentTile(
                  title: 'Driving License (Front)',
                  imageUrl: _profileData!['licenseFrontUrl'],
                ),
                const SizedBox(height: 12),
                _buildDocumentTile(
                  title: 'Driving License (Back)',
                  imageUrl: _profileData!['licenseBackUrl'],
                ),
                const SizedBox(height: 12),
                _buildDocumentTile(
                  title: 'Identity Proof',
                  imageUrl: _profileData!['identityProofImage'],
                ),
                const SizedBox(height: 12),
                _buildDocumentTile(
                  title: 'Vehicle Plate Photo',
                  imageUrl: _profileData!['vehiclePlateImage'],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Edit Profile Button
          ElevatedButton.icon(
            onPressed: () => _showEditProfileSheet(context),
            icon: const Icon(Icons.edit_outlined),
            label: const Text('Edit Name & Email', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
          const SizedBox(height: 12),

          // Logout Button
          OutlinedButton.icon(
            onPressed: () {
              context.read<AuthCubit>().logout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('Log Out Shift & Account', style: TextStyle(fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFFCA5A5)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isEmbedded) {
      return _buildBody();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Profile'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: _buildBody(),
      ),
    );
  }
}
