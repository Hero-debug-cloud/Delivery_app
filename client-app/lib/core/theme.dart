import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors (Primary Palette)
  static const Color primary50 = Color(0xFFEFF6FF);
  static const Color primary100 = Color(0xFFDBEAFE);
  static const Color primary200 = Color(0xFFBFDBFE);
  static const Color primary500 = Color(0xFF3B82F6);
  static const Color primary600 = Color(0xFF2563EB);
  static const Color primary700 = Color(0xFF1D4ED8);
  static const Color primary900 = Color(0xFF1E3A8A);

  // Neutral Palette
  static const Color neutral50 = Color(0xFFF8FAFC);
  static const Color neutral100 = Color(0xFFF1F5F9);
  static const Color neutral200 = Color(0xFFE2E8F0);
  static const Color neutral300 = Color(0xFFCBD5E1);
  static const Color neutral400 = Color(0xFF94A3B8);
  static const Color neutral500 = Color(0xFF64748B);
  static const Color neutral600 = Color(0xFF475569);
  static const Color neutral700 = Color(0xFF334155);
  static const Color neutral800 = Color(0xFF1E293B);
  static const Color neutral900 = Color(0xFF0F172A);
  static const Color neutral950 = Color(0xFF020617);
  static const Color white = Color(0xFFFFFFFF);

  // Semantic Palette
  static const Color success50 = Color(0xFFF0FDF4);
  static const Color success600 = Color(0xFF16A34A);
  static const Color warning50 = Color(0xFFFFFBEB);
  static const Color warning500 = Color(0xFFF59E0B);
  static const Color error50 = Color(0xFFFEF2F2);
  static const Color error300 = Color(0xFFFCA5A5);
  static const Color error600 = Color(0xFFDC2626);
  static const Color info50 = Color(0xFFEFF6FF);
  static const Color info600 = Color(0xFF2563EB);

  // Logistics Status Colors
  static const Color statusPending = Color(0xFF64748B);
  static const Color statusAssigned = Color(0xFF2563EB);
  static const Color statusAccepted = Color(0xFF7C3AED);
  static const Color statusPickedUp = Color(0xFF0891B2);
  static const Color statusInTransit = Color(0xFFF59E0B);
  static const Color statusDelivered = Color(0xFF16A34A);
  static const Color statusFailed = Color(0xFFDC2626);
  static const Color statusOffline = Color(0xFF94A3B8);
  static const Color statusOnline = Color(0xFF16A34A);
  static const Color statusBusy = Color(0xFFF59E0B);
}

class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double full = 999.0;

  static BorderRadius get borderRadiusSm => BorderRadius.circular(sm);
  static BorderRadius get borderRadiusMd => BorderRadius.circular(md);
  static BorderRadius get borderRadiusLg => BorderRadius.circular(lg);
  static BorderRadius get borderRadiusXl => BorderRadius.circular(xl);
  static BorderRadius get borderRadiusFull => BorderRadius.circular(full);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Inter',
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.primary600,
        onPrimary: AppColors.white,
        secondary: AppColors.primary500,
        onSecondary: AppColors.white,
        error: AppColors.error600,
        onError: AppColors.white,
        surface: AppColors.neutral50,
        onSurface: AppColors.neutral950,
        outline: AppColors.neutral300,
      ),
      scaffoldBackgroundColor: AppColors.neutral50,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primary600,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: 'Inter',
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppColors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderRadiusMd,
          side: const BorderSide(color: AppColors.neutral200),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary600,
          foregroundColor: AppColors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderRadiusMd,
          ),
          textStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary600,
          side: const BorderSide(color: AppColors.primary200),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderRadiusMd,
          ),
          textStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        border: OutlineInputBorder(
          borderRadius: AppRadius.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.neutral200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.neutral200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderRadiusSm,
          borderSide: const BorderSide(color: AppColors.primary600, width: 2),
        ),
      ),
    );
  }
}
