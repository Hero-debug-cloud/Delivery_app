import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../bloc/address_cubit.dart';
import '../../domain/models/customer_address.dart';
import '../../../auth/presentation/bloc/auth_cubit.dart';
import '../../../auth/presentation/bloc/auth_state.dart';

class AddEditAddressScreen extends StatefulWidget {
  final CustomerAddress? addressToEdit;

  const AddEditAddressScreen({super.key, this.addressToEdit});

  @override
  State<AddEditAddressScreen> createState() => _AddEditAddressScreenState();
}

class _AddEditAddressScreenState extends State<AddEditAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _addressController;
  late TextEditingController _customLabelController;
  late TextEditingController _recipientNameController;
  late TextEditingController _recipientPhoneController;

  String _selectedLabel = 'Home';
  double _latitude = 12.9716; // default Bangalore lat
  double _longitude = 77.5946; // default Bangalore lng
  bool _isDefault = false;

  bool _isLocating = false;
  bool _isSearching = false;

  List<dynamic> _searchResults = [];
  final FocusNode _searchFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    final edit = widget.addressToEdit;

    _addressController = TextEditingController(text: edit?.address ?? '');
    _customLabelController = TextEditingController();
    _recipientNameController = TextEditingController(text: edit?.recipientName ?? '');
    _recipientPhoneController = TextEditingController(text: edit?.recipientPhone ?? '');

    if (edit != null) {
      _latitude = edit.latitude;
      _longitude = edit.longitude;
      _isDefault = edit.isDefault;

      if (['Home', 'Work'].contains(edit.label)) {
        _selectedLabel = edit.label;
      } else {
        _selectedLabel = 'Other';
        _customLabelController.text = edit.label;
      }
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _customLabelController.dispose();
    _recipientNameController.dispose();
    _recipientPhoneController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  // 1. Get Device GPS Location
  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _isLocating = false;
      });

      // Reverse geocode to get street address
      _reverseGeocode(position.latitude, position.longitude);
    } catch (e) {
      setState(() => _isLocating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not get GPS: $e'), backgroundColor: Colors.red),
      );
    }
  }

  // 2. Geosearch using OpenStreetMap Nominatim
  Future<void> _searchAddress(String query) async {
    if (query.trim().length < 3) return;

    setState(() => _isSearching = true);

    try {
      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(query)}&format=json&limit=5'),
        headers: {'User-Agent': 'LogiRoute_Flutter_App'},
      );

      if (response.statusCode == 200) {
        final List results = json.decode(response.body);
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
      } else {
        setState(() => _isSearching = false);
      }
    } catch (e) {
      setState(() => _isSearching = false);
    }
  }

  // 3. Reverse geocode coordinates to text address
  Future<void> _reverseGeocode(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json'),
        headers: {'User-Agent': 'LogiRoute_Flutter_App'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final displayName = data['display_name'] as String?;
        if (displayName != null) {
          setState(() {
            _addressController.text = displayName;
          });
        }
      }
    } catch (_) {}
  }

  void _saveAddress() {
    if (!_formKey.currentState!.validate()) return;

    final finalLabel = _selectedLabel == 'Other'
        ? (_customLabelController.text.trim().isEmpty ? 'Other' : _customLabelController.text.trim())
        : _selectedLabel;

    final edit = widget.addressToEdit;

    final nameText = _recipientNameController.text.trim();
    final phoneText = _recipientPhoneController.text.trim();
    final recipientName = nameText.isEmpty ? null : nameText;
    final recipientPhone = phoneText.isEmpty ? null : phoneText;

    if (edit == null) {
      // Create new
      final newAddress = CustomerAddress(
        id: '',
        customerId: '',
        label: finalLabel,
        address: _addressController.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        isDefault: _isDefault,
        recipientName: recipientName,
        recipientPhone: recipientPhone,
      );
      context.read<AddressCubit>().addAddress(newAddress);
    } else {
      // Edit existing
      final updateData = {
        'label': finalLabel,
        'address': _addressController.text.trim(),
        'latitude': _latitude,
        'longitude': _longitude,
        'isDefault': _isDefault,
        'recipientName': recipientName,
        'recipientPhone': recipientPhone,
      };
      context.read<AddressCubit>().updateCustomerAddress(edit.id, updateData);
    }

    // Go back
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final edit = widget.addressToEdit;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF020617)),
          onPressed: () => context.pop(),
        ),
        title: Text(
          edit == null ? 'Add Address' : 'Edit Address',
          style: const TextStyle(color: Color(0xFF020617), fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Label Selector
                const Text(
                  'Address Label',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Row(
                  children: ['Home', 'Work', 'Other'].map((label) {
                    final isSelected = _selectedLabel == label;
                    return Padding(
                      padding: const EdgeInsets.only(right: 12.0),
                      child: ChoiceChip(
                        label: Text(label),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedLabel = label);
                          }
                        },
                        selectedColor: const Color(0xFF16A34A).withOpacity(0.15),
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                          fontWeight: FontWeight.bold,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(
                            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                if (_selectedLabel == 'Other') ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _customLabelController,
                    decoration: InputDecoration(
                      hintText: 'e.g., Friend\'s House, Gym',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                    validator: (v) {
                      if (_selectedLabel == 'Other' && (v == null || v.trim().isEmpty)) {
                        return 'Please name your custom label';
                      }
                      return null;
                    },
                  ),
                ],
                const SizedBox(height: 24),

                // 2. Coordinate Map Card (Aesthetics + Dynamic Visual Coordination Pin)
                const Text(
                  'Delivery Location Pin',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      // Radar Coordinate visual card
                      Container(
                        height: 120,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Concentric Radar Rings
                            Center(
                              child: Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF16A34A).withOpacity(0.15), width: 1.5),
                                ),
                              ),
                            ),
                            Center(
                              child: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFF16A34A).withOpacity(0.3), width: 1.5),
                                ),
                              ),
                            ),
                            // Map Pin Icon
                            const Center(
                              child: Icon(
                                Icons.location_on,
                                size: 36,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                            Positioned(
                              bottom: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'GPS: ${_latitude.toStringAsFixed(5)}, ${_longitude.toStringAsFixed(5)}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isLocating ? null : _getCurrentLocation,
                              icon: _isLocating
                                  ? const SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF16A34A)),
                                    )
                                  : const Icon(Icons.my_location, size: 16),
                              label: Text(_isLocating ? 'Locating...' : 'Use Current GPS'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF16A34A),
                                side: const BorderSide(color: Color(0xFF16A34A)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 3. Search Autocomplete (OpenStreetMap Nominatim API integration)
                const Text(
                  'Search Location or Landmarks',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  focusNode: _searchFocusNode,
                  decoration: InputDecoration(
                    hintText: 'Search for colony, sector, city...',
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                    suffixIcon: _isSearching
                        ? const Padding(
                            padding: EdgeInsets.all(12.0),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF16A34A)),
                            ),
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                  onChanged: (val) => _searchAddress(val),
                ),
                if (_searchResults.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Container(
                    constraints: const BoxConstraints(maxHeight: 180),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: _searchResults.length,
                      separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      itemBuilder: (context, index) {
                        final result = _searchResults[index];
                        final name = result['display_name'] as String;
                        return ListTile(
                          title: Text(
                            name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12),
                          ),
                          onTap: () {
                            setState(() {
                              _latitude = double.parse(result['lat'] as String);
                              _longitude = double.parse(result['lon'] as String);
                              _addressController.text = name;
                              _searchResults.clear();
                            });
                            _searchFocusNode.unfocus();
                          },
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 24),

                // 4. Address Details Input
                const Text(
                  'Address Details (Flat/House No., Building, Street)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _addressController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Enter complete address description',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Address details are required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // 4.5. Recipient Details Input
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recipient Contact Info',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                    ),
                    TextButton.icon(
                      onPressed: () {
                        final authState = context.read<AuthCubit>().state;
                        if (authState is AuthAuthenticated) {
                          setState(() {
                            _recipientNameController.text = authState.user.name;
                            _recipientPhoneController.text = authState.user.phone ?? '';
                          });
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Profile details not found')),
                          );
                        }
                      },
                      icon: const Icon(Icons.person_outline, size: 16, color: Color(0xFF16A34A)),
                      label: const Text(
                        'Use Profile Details',
                        style: TextStyle(color: Color(0xFF16A34A), fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _recipientNameController,
                  decoration: InputDecoration(
                    hintText: 'Recipient\'s Name',
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: const Icon(Icons.person, color: Color(0xFF64748B)),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _recipientPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    hintText: 'Recipient\'s Phone Number',
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: const Icon(Icons.phone, color: Color(0xFF64748B)),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Default Toggle
                SwitchListTile(
                  title: const Text(
                    'Set as Default Address',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF020617)),
                  ),
                  subtitle: const Text(
                    'This address will be selected automatically during checkout',
                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                  value: _isDefault,
                  onChanged: (val) {
                    setState(() => _isDefault = val);
                  },
                  activeColor: const Color(0xFF16A34A),
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 32),

                // 6. Save Button
                ElevatedButton(
                  onPressed: _saveAddress,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    edit == null ? 'Save Address' : 'Save Changes',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
