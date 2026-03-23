import 'package:flutter/material.dart';

import 'models/habit_models.dart';
import 'screens/home_shell.dart';
import 'screens/onboarding_screen.dart';
import 'theme/app_theme.dart';

class HabitTrackerApp extends StatelessWidget {
  const HabitTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sanctuary Habit Tracker',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const HabitTrackerRoot(),
    );
  }
}

class HabitTrackerRoot extends StatefulWidget {
  const HabitTrackerRoot({super.key});

  @override
  State<HabitTrackerRoot> createState() => _HabitTrackerRootState();
}

class _HabitTrackerRootState extends State<HabitTrackerRoot> {
  final List<HabitTask> _habits = buildSampleHabits();
  final Set<String> _completedToday = {'morning-reset', 'read-20-pages'};
  bool _hasCompletedOnboarding = false;
  bool _quietHoursEnabled = true;
  bool _dailyReflectionEnabled = true;

  void _finishOnboarding() {
    setState(() {
      _hasCompletedOnboarding = true;
    });
  }

  void _toggleHabit(String habitId) {
    setState(() {
      if (_completedToday.contains(habitId)) {
        _completedToday.remove(habitId);
      } else {
        _completedToday.add(habitId);
      }
    });
  }

  void _setQuietHoursEnabled(bool value) {
    setState(() {
      _quietHoursEnabled = value;
    });
  }

  void _setDailyReflectionEnabled(bool value) {
    setState(() {
      _dailyReflectionEnabled = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasCompletedOnboarding) {
      return OnboardingScreen(onStartJourney: _finishOnboarding);
    }

    return HabitTrackerHomeShell(
      habits: _habits,
      completedToday: _completedToday,
      quietHoursEnabled: _quietHoursEnabled,
      dailyReflectionEnabled: _dailyReflectionEnabled,
      onToggleHabit: _toggleHabit,
      onQuietHoursChanged: _setQuietHoursEnabled,
      onDailyReflectionChanged: _setDailyReflectionEnabled,
    );
  }
}
