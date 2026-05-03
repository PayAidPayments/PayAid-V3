import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/activity_log.dart';

/// Enhanced recent activity widget that uses the activity log
class EnhancedRecentActivityWidget extends ConsumerWidget {
  const EnhancedRecentActivityWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const ActivityLogWidget();
  }
}
