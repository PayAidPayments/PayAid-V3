import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/metrics_card.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/quick_actions.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/recent_activity.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/daily_standup.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/pipeline_snapshot.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/personal_forecast.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/top_deals.dart';
import 'package:payaid_crm/presentation/widgets/dashboard/activity_log.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  Widget _buildWelcomeSection() {
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$greeting! 👋',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Here\'s what\'s happening today',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricsCards(WidgetRef ref) {
    // These would be fetched from API, for now using placeholders
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: MetricsCard(
                title: 'Deals',
                value: '12',
                subtitle: 'Active',
                icon: Icons.trending_up,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: MetricsCard(
                title: 'Revenue',
                value: '₹8.5L',
                subtitle: 'This month',
                icon: Icons.currency_rupee,
                color: Colors.green,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: MetricsCard(
                title: 'Tasks',
                value: '5',
                subtitle: 'Due today',
                icon: Icons.task_alt,
                color: Colors.orange,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: MetricsCard(
                title: 'Leads',
                value: '23',
                subtitle: 'Hot leads',
                icon: Icons.people,
                color: Colors.purple,
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              context.push('/settings');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh all dashboard data
          ref.invalidate(todaysTasksProvider);
          ref.invalidate(todaysMeetingsProvider);
          ref.invalidate(pipelineSnapshotProvider);
          ref.invalidate(personalForecastProvider);
          ref.invalidate(topDealsProvider);
          ref.invalidate(activityLogProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              _buildWelcomeSection(),
              const SizedBox(height: 24),
              // Daily Standup
              const DailyStandupWidget(),
              const SizedBox(height: 16),
              // Personal Forecast
              const PersonalForecastWidget(),
              const SizedBox(height: 16),
              // Metrics Cards
              _buildMetricsCards(ref),
              const SizedBox(height: 16),
              // Pipeline Snapshot
              const PipelineSnapshotWidget(),
              const SizedBox(height: 16),
              // Top Deals
              const TopDealsWidget(),
              const SizedBox(height: 16),
              // Quick Actions
              const QuickActionsWidget(),
              const SizedBox(height: 16),
              // Activity Log
              const ActivityLogWidget(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/contacts');
              break;
            case 2:
              context.go('/deals');
              break;
            case 3:
              context.go('/tasks');
              break;
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people),
            label: 'Contacts',
          ),
          NavigationDestination(
            icon: Icon(Icons.trending_up_outlined),
            selectedIcon: Icon(Icons.trending_up),
            label: 'Deals',
          ),
          NavigationDestination(
            icon: Icon(Icons.task_outlined),
            selectedIcon: Icon(Icons.task),
            label: 'Tasks',
          ),
        ],
      ),
    );
  }
}
