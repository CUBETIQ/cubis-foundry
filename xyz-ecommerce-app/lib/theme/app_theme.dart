import 'package:flutter/material.dart';

class AppTheme {
  static const Color ink = Color(0xFF17151E);
  static const Color plum = Color(0xFF42263B);
  static const Color blush = Color(0xFFF4E7E6);
  static const Color shell = Color(0xFFF8F3EF);
  static const Color card = Color(0xFFFFFCFA);
  static const Color gold = Color(0xFFB37A3B);
  static const Color berry = Color(0xFF8E3257);
  static const Color moss = Color(0xFF55684D);

  static ThemeData get lightTheme {
    final baseBody = ThemeData(brightness: Brightness.light).textTheme;
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: berry,
        brightness: Brightness.light,
        primary: berry,
        secondary: gold,
        surface: card,
      ),
      scaffoldBackgroundColor: shell,
      textTheme: baseBody.copyWith(
        headlineLarge: const TextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          height: 1.05,
          color: ink,
        ),
        headlineMedium: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        headlineSmall: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        titleLarge: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: ink,
        ),
        titleMedium: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        bodyLarge: const TextStyle(fontSize: 15, height: 1.55, color: ink),
        bodyMedium: const TextStyle(
          fontSize: 13,
          height: 1.55,
          color: Color(0xFF5F5865),
        ),
        labelLarge: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.2,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: ink,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: card,
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 16,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: card,
        indicatorColor: berry.withValues(alpha: 0.12),
        labelTextStyle: const WidgetStatePropertyAll(
          TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: card,
        selectedColor: berry.withValues(alpha: 0.14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        labelStyle: const TextStyle(fontWeight: FontWeight.w700),
        side: BorderSide.none,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: berry,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          minimumSize: const Size.fromHeight(56),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return berry;
          return Colors.white;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return berry.withValues(alpha: 0.35);
          }
          return const Color(0xFFD9CDD0);
        }),
      ),
    );
  }
}
