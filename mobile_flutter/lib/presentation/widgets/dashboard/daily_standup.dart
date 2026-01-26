import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final todaysTasksProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getTodaysTasks();
});

final todaysMeetingsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getTodaysMeetings();
});

class DailyStandupWidget extends ConsumerWidget {
  const DailyStandupWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(todaysTasksProvider);
    final meetingsAsync = ref.watch(todaysMeetingsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 20, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  'Daily Standup - ${DateFormat('EEEE, MMMM d').format(DateTime.now())}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Today's Tasks
            tasksAsync.when(
              data: (tasks) => _buildSection(
                context,
                'Tasks Due Today',
                tasks.length,
                Icons.task,
                Colors.orange,
                tasks.take(3).map((t) => t['title'] ?? 'Untitled Task').toList(),
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const SizedBox(),
            ),
            const SizedBox(height: 12),
            // Today's Meetings/Calls
            meetingsAsync.when(
              data: (meetings) => _buildSection(
                context,
                'Meetings/Calls Today',
                meetings.length,
                Icons.event,
                Colors.blue,
                meetings.take(3).map((m) => m['subject'] ?? 'Meeting').toList(),
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const SizedBox(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    int count,
    IconData icon,
    Color color,
    List<String> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ),
          ],
        ),
        if (items.isNotEmpty) ...[
          const SizedBox(height: 8),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(left: 24, top: 4),
                child: Text(
                  '• $item',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              )),
        ],
      ],
    );
  }
}
