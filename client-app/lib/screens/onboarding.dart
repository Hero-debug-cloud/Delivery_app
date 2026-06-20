import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../core/theme.dart';
import '../features/auth/presentation/bloc/auth_cubit.dart';
import '../features/auth/presentation/bloc/auth_state.dart';
import '../main.dart';

class DriverOnboardingScreen extends StatefulWidget {
  const DriverOnboardingScreen({super.key});

  @override
  State<DriverOnboardingScreen> createState() => _DriverOnboardingScreenState();
}

class _DriverOnboardingScreenState extends State<DriverOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _vehicleNumberController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _licenseExpiryController = TextEditingController();
  final _identityNumberController = TextEditingController();

  String _vehicleType = 'motorcycle';
  String _identityType = 'Aadhaar';

  // Map of upload item key to upload states: key (S3 key), localPath, isUploading
  final Map<String, String?> _uploadedKeys = {};
  final Map<String, String?> _localPreviews = {};
  final Map<String, bool> _uploadingStates = {};

  bool _isSubmitting = false;
  String? _submitError;
  bool _initialized = false;

  final _picker = ImagePicker();

  @override
  void dispose() {
    _nameController.dispose();
    _vehicleNumberController.dispose();
    _licenseNumberController.dispose();
    _licenseExpiryController.dispose();
    _identityNumberController.dispose();
    super.dispose();
  }

  void _initFormFields(AuthState state) {
    if (_initialized) return;
    if (state is AuthAuthenticated) {
      final user = state.user;
      _nameController.text = user.name;
      
      final profile = user.driverProfile;
      if (profile != null) {
        _vehicleType = profile.vehicleType ?? 'motorcycle';
        _vehicleNumberController.text = profile.vehicleNumber ?? '';
        _licenseNumberController.text = profile.licenseNumber ?? '';
        _licenseExpiryController.text = profile.licenseExpiry ?? '';
        _identityType = profile.identityProofType ?? 'Aadhaar';
        _identityNumberController.text = profile.identityProofNumber ?? '';

        // Prefill existing uploaded urls
        _uploadedKeys['profilePictureUrl'] = profile.profilePictureUrl;
        _uploadedKeys['licenseFrontUrl'] = profile.licenseFrontUrl;
        _uploadedKeys['licenseBackUrl'] = profile.licenseBackUrl;
        _uploadedKeys['vehiclePlateImage'] = profile.vehiclePlateImage;
        _uploadedKeys['identityProofImage'] = profile.identityProofImage;
      }
      _initialized = true;
    }
  }

  Future<void> _pickAndUploadImage(String fieldKey) async {
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
        imageQuality: 70, // Compress image to reduce upload size
        maxWidth: 1200,
      );

      if (pickedFile == null) return;

      setState(() {
        _uploadingStates[fieldKey] = true;
        _submitError = null;
        if (!kIsWeb) {
          _localPreviews[fieldKey] = pickedFile.path;
        }
      });

      // Prepare Multipart file upload payload
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

      final response = await LogiRouteApp.dio.post(
        '/upload',
        data: formData,
      );

      if (response.statusCode == 200 && response.data != null) {
        final key = response.data['key'] as String;
        final url = response.data['url'] as String?;

        setState(() {
          _uploadedKeys[fieldKey] = key;
          // Use either resolved public URL or local preview
          if (kIsWeb && url != null) {
            _localPreviews[fieldKey] = url;
          }
        });
      } else {
        throw Exception('Upload failed with status code ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error uploading image: $e');
      setState(() {
        _submitError = 'Failed to upload image. Please try again.';
      });
    } finally {
      setState(() {
        _uploadingStates[fieldKey] = false;
      });
    }
  }

  Widget _buildUploadBox(String title, String fieldKey) {
    final isUploading = _uploadingStates[fieldKey] ?? false;
    final s3Key = _uploadedKeys[fieldKey];
    final preview = _localPreviews[fieldKey] ?? s3Key; // Falls back to existing URL if present

    return Card(
      child: InkWell(
        onTap: isUploading ? null : () => _pickAndUploadImage(fieldKey),
        borderRadius: AppRadius.borderRadiusMd,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.neutral700,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.neutral100,
                  border: Border.all(color: AppColors.neutral200),
                  borderRadius: AppRadius.borderRadiusSm,
                ),
                child: isUploading
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Uploading to secure storage...',
                              style: TextStyle(fontSize: 11, color: AppColors.neutral500),
                            ),
                          ],
                        ),
                      )
                    : preview != null
                        ? ClipRRect(
                            borderRadius: AppRadius.borderRadiusSm,
                            child: preview.startsWith('http') || kIsWeb
                                ? Image.network(preview, fit: BoxFit.cover)
                                : Image.file(File(preview), fit: BoxFit.cover),
                          )
                        : const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate_outlined, color: AppColors.neutral400, size: 28),
                                SizedBox(height: 4),
                                Text(
                                  'Tap to capture document',
                                  style: TextStyle(fontSize: 12, color: AppColors.neutral500),
                                ),
                              ],
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitOnboarding() async {
    if (!_formKey.currentState!.validate()) return;

    // Check document checklist
    const requiredDocs = [
      'profilePictureUrl',
      'licenseFrontUrl',
      'licenseBackUrl',
      'vehiclePlateImage',
      'identityProofImage',
    ];

    for (final doc in requiredDocs) {
      if (_uploadedKeys[doc] == null || _uploadedKeys[doc]!.isEmpty) {
        setState(() {
          _submitError = 'Please upload all requested documents.';
        });
        return;
      }
    }

    setState(() {
      _isSubmitting = true;
      _submitError = null;
    });

    try {
      final data = {
        'name': _nameController.text.trim(),
        'vehicleType': _vehicleType,
        'vehicleNumber': _vehicleNumberController.text.trim(),
        'licenseNumber': _licenseNumberController.text.trim(),
        'licenseExpiry': _licenseExpiryController.text.trim(),
        'licenseFrontUrl': _uploadedKeys['licenseFrontUrl'],
        'licenseBackUrl': _uploadedKeys['licenseBackUrl'],
        'vehiclePlateImage': _uploadedKeys['vehiclePlateImage'],
        'identityProofType': _identityType,
        'identityProofNumber': _identityNumberController.text.trim(),
        'identityProofImage': _uploadedKeys['identityProofImage'],
        'profilePictureUrl': _uploadedKeys['profilePictureUrl'],
      };

      final response = await LogiRouteApp.dio.patch(
        '/delivery-partners/me/onboard',
        data: data,
      );

      if (response.statusCode == 200) {
        // Refresh auth state to trigger redirect to review status screen
        await context.read<AuthCubit>().checkAuth();
      } else {
        throw Exception(response.data['message'] ?? 'Failed to submit details');
      }
    } catch (e) {
      debugPrint('Submit onboarding error: $e');
      setState(() {
        _submitError = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        _initFormFields(state);

        final user = state is AuthAuthenticated ? state.user : null;
        final profile = user?.driverProfile;
        final isRejected = profile?.onboardingStatus == 'rejected';
        final reason = profile?.rejectionReason;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Partner Onboarding'),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout),
                onPressed: () => context.read<AuthCubit>().logout(),
              ),
            ],
          ),
          body: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(20.0),
              children: [
                if (isRejected && reason != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14.0),
                    decoration: BoxDecoration(
                      color: AppColors.error50,
                      border: Border.all(color: AppColors.error300),
                      borderRadius: AppRadius.borderRadiusMd,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.error_outline, color: AppColors.error600, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Application Needs Attention',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.error600,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Your application was rejected for the following reason:\n"$reason"\n\nPlease review your details, update the incorrect documents, and resubmit.',
                          style: const TextStyle(
                            color: AppColors.error600,
                            fontSize: 12.5,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                const Text(
                  'Upload Credentials',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.neutral900),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Please fill all details and upload clear images of your original documents.',
                  style: TextStyle(fontSize: 13, color: AppColors.neutral500),
                ),
                const SizedBox(height: 20),

                if (_submitError != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error50,
                      border: Border.all(color: AppColors.error300),
                      borderRadius: AppRadius.borderRadiusSm,
                    ),
                    child: Text(
                      _submitError!,
                      style: const TextStyle(color: AppColors.error600, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Driver Profile Name
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name (as in DL)',
                    hintText: 'Enter your full name',
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),

                // Vehicle Type Dropdown
                DropdownButtonFormField<String>(
                  value: _vehicleType,
                  decoration: const InputDecoration(labelText: 'Vehicle Type'),
                  items: const [
                    DropdownMenuItem(value: 'motorcycle', child: Text('Motorcycle / Scooter')),
                    DropdownMenuItem(value: 'bicycle', child: Text('Bicycle / Electric cycle')),
                    DropdownMenuItem(value: 'car', child: Text('Car')),
                    DropdownMenuItem(value: 'van', child: Text('Delivery Van')),
                  ],
                  onChanged: (v) => setState(() => _vehicleType = v!),
                ),
                const SizedBox(height: 16),

                // Vehicle Number
                TextFormField(
                  controller: _vehicleNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Vehicle License Plate Number',
                    hintText: 'e.g. KA03EX1234',
                  ),
                  textCapitalization: TextCapitalization.characters,
                  validator: (v) => v == null || v.trim().isEmpty ? 'Vehicle plate number is required' : null,
                ),
                const SizedBox(height: 24),

                const Divider(),
                const SizedBox(height: 16),
                const Text(
                  'Driving License Details',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.neutral800),
                ),
                const SizedBox(height: 12),

                // License Number
                TextFormField(
                  controller: _licenseNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Driving License (DL) Number',
                    hintText: 'e.g. DL1420110012345',
                  ),
                  textCapitalization: TextCapitalization.characters,
                  validator: (v) => v == null || v.trim().isEmpty ? 'Driving License number is required' : null,
                ),
                const SizedBox(height: 16),

                // License Expiry
                TextFormField(
                  controller: _licenseExpiryController,
                  decoration: const InputDecoration(
                    labelText: 'DL Expiry Date',
                    hintText: 'e.g. YYYY-MM-DD',
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'License expiry is required' : null,
                ),
                const SizedBox(height: 24),

                const Divider(),
                const SizedBox(height: 16),
                const Text(
                  'Identity Proof Details',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.neutral800),
                ),
                const SizedBox(height: 12),

                // ID Type Dropdown
                DropdownButtonFormField<String>(
                  value: _identityType,
                  decoration: const InputDecoration(labelText: 'ID Proof Document Type'),
                  items: const [
                    DropdownMenuItem(value: 'Aadhaar', child: Text('Aadhaar Card')),
                    DropdownMenuItem(value: 'SSN', child: Text('SSN (Social Security)')),
                    DropdownMenuItem(value: 'PAN', child: Text('PAN Card')),
                    DropdownMenuItem(value: 'Passport', child: Text('Passport')),
                  ],
                  onChanged: (v) => setState(() => _identityType = v!),
                ),
                const SizedBox(height: 16),

                // ID Number
                TextFormField(
                  controller: _identityNumberController,
                  decoration: const InputDecoration(
                    labelText: 'ID Card Number',
                    hintText: 'Enter ID number',
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Identity proof number is required' : null,
                ),
                const SizedBox(height: 28),

                const Text(
                  'Documents Verification Checklist',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.neutral800),
                ),
                const SizedBox(height: 12),

                // Upload grid items
                _buildUploadBox('Profile Picture', 'profilePictureUrl'),
                _buildUploadBox('Driving License Front Side', 'licenseFrontUrl'),
                _buildUploadBox('Driving License Back Side', 'licenseBackUrl'),
                _buildUploadBox('Vehicle Number Plate Image', 'vehiclePlateImage'),
                _buildUploadBox('Identity Proof Document (Aadhaar/SSN Front)', 'identityProofImage'),

                const SizedBox(height: 32),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitOnboarding,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary600,
                      shape: RoundedRectangleBorder(
                        borderRadius: AppRadius.borderRadiusMd,
                      ),
                    ),
                    child: _isSubmitting
                        ? const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(width: 12),
                              Text(
                                'Submitting Application...',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          )
                        : const Text(
                            'Submit Onboarding Details',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }
}
