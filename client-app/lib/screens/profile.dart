import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Profile'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Profile Header
              const CircleAvatar(
                radius: 48,
                backgroundColor: Color(0xFFE2E8F0),
                child: Icon(Icons.person, size: 56, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Sarah Connor',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF020617),
                ),
              ),
              const Text(
                'ID: DVR-301 • Store: Central Hub',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),

              // Account Details List
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
                      title: 'Phone Number',
                      value: '+91 99999 11111',
                    ),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    _buildProfileTile(
                      icon: Icons.motorcycle_outlined,
                      title: 'Vehicle',
                      value: 'Scooter',
                    ),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    _buildProfileTile(
                      icon: Icons.badge_outlined,
                      title: 'License Number',
                      value: 'KA-03-2023-0098765',
                    ),
                  ],
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
              const SizedBox(height: 32),

              // Logout Button
              ElevatedButton.icon(
                onPressed: () {
                  context.go('/login');
                },
                icon: const Icon(Icons.logout),
                label: const Text('Log Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
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
          Column(
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
}
