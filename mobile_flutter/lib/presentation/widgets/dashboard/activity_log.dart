import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final activityLogProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getRecentActivity(limit: 10);
});

class ActivityLogWidget extends ConsumerWidget {
  const ActivityLogWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityAsync = ref.watch(activityLogProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.history, size: 20, color: Colors.grey),
                SizedBox(width: 8),
                Text(
                  'Activity Log',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            activityAsync.when(
              data: (activities) {
                if (activities.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No recent activity'),
                    ),
                  );
                }
                return Column(
                  children: activities.map((activity) {
                    final type = activity['type'] ?? 'activity';
                    final user = activity['userName'] ?? 'System';
                    final description = activity['description'] ?? activity['notes'] ?? 'Activity';
                    final timestamp = activity['createdAt'] != null
                        ? DateTime.parse(activity['createdAt'])
                        : DateTime.now();
                    
                    IconData icon;
                    Color iconColor;
                    switch (type.toLowerCase()) {
                      case 'email':
                        icon = Icons.email;
                        iconColor = Colors.blue;
                        break;
                      case 'call':
                        icon = Icons.phone;
                        iconColor = Colors.green;
                        break;
                      case 'meeting':
                        icon = Icons.event;
                        iconColor = Colors.purple;
                        break;
                      case 'task':
                        icon = Icons.task;
                        iconColor = Colors.orange;
                        break;
                      default:
                        icon = Icons.circle;
                        iconColor = Colors.grey;
                    }
                    
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 16,
                        backgroundColor: iconColor.withOpacity(0.1),
                        child: Icon(icon, size: 16, color: iconColor),
                      ),
                      title: Text(
                        description,
                        style: const TextStyle(fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '$user • ${_formatTimeAgo(timestamp)}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Text('Error: $error'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
