import 'package:flutter/material.dart';

import '../models/habit_models.dart';
import '../theme/app_theme.dart';

class HabitTrackerHomeShell extends StatefulWidget {
  const HabitTrackerHomeShell({
    super.key,
    required this.habits,
    required this.completedToday,
    required this.quietHoursEnabled,
    required this.dailyReflectionEnabled,
    required this.onToggleHabit,
    required this.onQuietHoursChanged,
    required this.onDailyReflectionChanged,
  });

  final List<HabitTask> habits;
  final Set<String> completedToday;
  final bool quietHoursEnabled;
  final bool dailyReflectionEnabled;
  final ValueChanged<String> onToggleHabit;
  final ValueChanged<bool> onQuietHoursChanged;
  final ValueChanged<bool> onDailyReflectionChanged;

  @override
  State<HabitTrackerHomeShell> createState() => _HabitTrackerHomeShellState();
}

class _HabitTrackerHomeShellState extends State<HabitTrackerHomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      _DashboardTab(
        habits: widget.habits,
        completedToday: widget.completedToday,
        onToggleHabit: widget.onToggleHabit,
      ),
      _ProgressTab(
        habits: widget.habits,
        completedToday: widget.completedToday,
      ),
      _ProfileTab(
        habits: widget.habits,
        quietHoursEnabled: widget.quietHoursEnabled,
        dailyReflectionEnabled: widget.dailyReflectionEnabled,
        onQuietHoursChanged: widget.onQuietHoursChanged,
        onDailyReflectionChanged: widget.onDailyReflectionChanged,
      ),
    ];

    return Scaffold(
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_customize_outlined),
            selectedIcon: Icon(Icons.dashboard_customize_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights_rounded),
            label: 'Progress',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: _index == 0
          ? FloatingActionButton(
              onPressed: () {},
              backgroundColor: AppTheme.accent,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add_rounded),
            )
          : null,
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab({
    required this.habits,
    required this.completedToday,
    required this.onToggleHabit,
  });

  final List<HabitTask> habits;
  final Set<String> completedToday;
  final ValueChanged<String> onToggleHabit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final insights = buildInsightCards(habits, completedToday);
    final percent = (completionRatio(habits, completedToday) * 100).round();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sanctuary', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('Home Dashboard', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              gradient: const LinearGradient(
                colors: [AppTheme.accent, Color(0xFF2D9B98)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT RHYTHM',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$percent',
                      style: theme.textTheme.headlineLarge?.copyWith(
                        color: Colors.white,
                        fontSize: 44,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Text(
                        'completed today',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Your spirit is finding its rhythm. You have created enough signal to feel momentum without making the app feel punitive.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: insights
                .take(2)
                .map(
                  (card) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: card.title == insights.first.title ? 10 : 0,
                      ),
                      child: _InsightTile(card: card),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Today\'s Habits', style: theme.textTheme.titleLarge),
              Text('Edit list', style: theme.textTheme.bodyMedium),
            ],
          ),
          const SizedBox(height: 14),
          ...habits.map(
            (habit) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _HabitCard(
                habit: habit,
                isDone: completedToday.contains(habit.id),
                onToggle: () => onToggleHabit(habit.id),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFFC68561),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'The secret of your future is hidden in your daily routine.',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Use the dashboard to notice rhythm, not perfection.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressTab extends StatelessWidget {
  const _ProgressTab({required this.habits, required this.completedToday});

  final List<HabitTask> habits;
  final Set<String> completedToday;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final completion = completionRatio(habits, completedToday);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sanctuary', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('Progress & Insights', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('CURRENT MOMENTUM', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 10),
                Text(
                  '${(completion * 100).round()}%',
                  style: theme.textTheme.headlineLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Large enough to feel meaningful, small enough to be repeatable tomorrow.',
                  style: theme.textTheme.bodyLarge,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('Weekly Flow', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(7, (index) {
                final label = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
                final value = habits.fold<int>(
                  0,
                  (sum, habit) => sum + habit.weeklyPattern[index],
                );
                final active = value >= 3;
                return Column(
                  children: [
                    Container(
                      width: 22,
                      height: 110,
                      decoration: BoxDecoration(
                        color: active
                            ? AppTheme.accent
                            : AppTheme.accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(label, style: theme.textTheme.bodyMedium),
                  ],
                );
              }),
            ),
          ),
          const SizedBox(height: 18),
          Text('Sphere of Influence', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          ...[
            ('Mindfulness', 0.82, AppTheme.accent),
            ('Fitness', 0.74, AppTheme.clay),
            ('Growth', 0.68, const Color(0xFF5D7FBD)),
          ].map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.$1, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: LinearProgressIndicator(
                        value: item.$2,
                        minHeight: 10,
                        backgroundColor: const Color(0xFFE3DED5),
                        color: item.$3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(item.$2 * 100).round()}% resilience score',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({
    required this.habits,
    required this.quietHoursEnabled,
    required this.dailyReflectionEnabled,
    required this.onQuietHoursChanged,
    required this.onDailyReflectionChanged,
  });

  final List<HabitTask> habits;
  final bool quietHoursEnabled;
  final bool dailyReflectionEnabled;
  final ValueChanged<bool> onQuietHoursChanged;
  final ValueChanged<bool> onDailyReflectionChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sanctuary', style: theme.textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('Profile & Settings', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Row(
              children: [
                Container(
                  width: 66,
                  height: 66,
                  decoration: BoxDecoration(
                    color: AppTheme.sand,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    color: AppTheme.ink,
                    size: 34,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Alex Rivera', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        '5-day active streak',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Designing calmer rituals for busy weekdays.',
                        style: theme.textTheme.bodyLarge,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('Preferences', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          _PreferenceTile(
            title: 'Quiet hours',
            subtitle: 'Mute prompts after 9:30 PM',
            value: quietHoursEnabled,
            onChanged: onQuietHoursChanged,
          ),
          const SizedBox(height: 12),
          _PreferenceTile(
            title: 'Daily reflection prompt',
            subtitle: 'Keep the evening journal cue visible',
            value: dailyReflectionEnabled,
            onChanged: onDailyReflectionChanged,
          ),
          const SizedBox(height: 18),
          Text('Practice balance', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Column(
              children: habits
                  .map(
                    (habit) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: habit.accent.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(habit.icon, color: habit.accent),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  habit.category,
                                  style: theme.textTheme.titleMedium,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  habit.insight,
                                  style: theme.textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _InsightTile extends StatelessWidget {
  const _InsightTile({required this.card});

  final InsightCardData card;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(card.title, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 10),
          Text(card.value, style: theme.textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(card.caption, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _HabitCard extends StatelessWidget {
  const _HabitCard({
    required this.habit,
    required this.isDone,
    required this.onToggle,
  });

  final HabitTask habit;
  final bool isDone;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: habit.accent.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(habit.icon, color: habit.accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(habit.title, style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${habit.minutes} min • ${habit.subtitle}',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filledTonal(
            onPressed: onToggle,
            style: IconButton.styleFrom(
              backgroundColor: isDone
                  ? habit.accent.withValues(alpha: 0.16)
                  : const Color(0xFFF1EEE7),
            ),
            icon: Icon(
              isDone
                  ? Icons.check_circle_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: isDone ? habit.accent : const Color(0xFF8F968F),
            ),
          ),
        ],
      ),
    );
  }
}

class _PreferenceTile extends StatelessWidget {
  const _PreferenceTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(subtitle, style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
