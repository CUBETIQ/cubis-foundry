import 'package:flutter/material.dart';

class HabitTask {
  const HabitTask({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.minutes,
    required this.icon,
    required this.accent,
    required this.weeklyPattern,
    required this.insight,
  });

  final String id;
  final String title;
  final String subtitle;
  final String category;
  final int minutes;
  final IconData icon;
  final Color accent;
  final List<int> weeklyPattern;
  final String insight;
}

class InsightCardData {
  const InsightCardData({
    required this.title,
    required this.value,
    required this.caption,
  });

  final String title;
  final String value;
  final String caption;
}

List<HabitTask> buildSampleHabits() {
  return const [
    HabitTask(
      id: 'morning-reset',
      title: 'Morning Meditation',
      subtitle: 'Reset your pace before the day accelerates.',
      category: 'Mindfulness',
      minutes: 12,
      icon: Icons.self_improvement_rounded,
      accent: Color(0xFF0B7D7A),
      weeklyPattern: [1, 1, 1, 1, 0, 1, 1],
      insight: 'Your spirit is finding its rhythm.',
    ),
    HabitTask(
      id: 'mobility-walk',
      title: 'Daily Mobility Walk',
      subtitle: 'A low-friction movement block to keep momentum alive.',
      category: 'Fitness',
      minutes: 18,
      icon: Icons.directions_walk_rounded,
      accent: Color(0xFFEA8D63),
      weeklyPattern: [1, 1, 0, 1, 1, 0, 1],
      insight: 'Your energy improves when movement happens before noon.',
    ),
    HabitTask(
      id: 'read-20-pages',
      title: 'Read 20 Pages',
      subtitle: 'Trade a small scrolling loop for a richer input source.',
      category: 'Growth',
      minutes: 25,
      icon: Icons.menu_book_rounded,
      accent: Color(0xFF5D7FBD),
      weeklyPattern: [1, 0, 1, 1, 1, 1, 0],
      insight: 'Consistent reading is compounding into calmer evenings.',
    ),
    HabitTask(
      id: 'evening-reflection',
      title: 'Evening Reflection',
      subtitle: 'Capture what mattered before the day fades into blur.',
      category: 'Reflection',
      minutes: 10,
      icon: Icons.nights_stay_rounded,
      accent: Color(0xFF7A5E7B),
      weeklyPattern: [0, 1, 1, 0, 1, 1, 1],
      insight:
          'Reflection nights correlate with stronger next-day follow-through.',
    ),
  ];
}

int longestStreak(List<HabitTask> habits) {
  return habits
      .map(
        (habit) => habit.weeklyPattern
            .join()
            .split('0')
            .fold<int>(
              0,
              (best, group) => group.length > best ? group.length : best,
            ),
      )
      .fold<int>(0, (best, current) => current > best ? current : best);
}

double completionRatio(List<HabitTask> habits, Set<String> completedToday) {
  if (habits.isEmpty) return 0;
  return completedToday.length / habits.length;
}

List<InsightCardData> buildInsightCards(
  List<HabitTask> habits,
  Set<String> completedToday,
) {
  final percent = (completionRatio(habits, completedToday) * 100).round();
  return [
    InsightCardData(
      title: 'Daily Completion',
      value: '$percent%',
      caption: 'You are protecting your momentum window.',
    ),
    InsightCardData(
      title: 'Momentum',
      value: '${completedToday.length}/${habits.length}',
      caption: 'Small wins count when they happen in sequence.',
    ),
    InsightCardData(
      title: 'Weekly Flow',
      value: '${longestStreak(habits)} days',
      caption: 'Longest streak across active routines this week.',
    ),
  ];
}
