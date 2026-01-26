import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/data/models/deal_model.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final topDealsProvider = FutureProvider.autoDispose<List<DealModel>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getTopDealsThisWeek();
});

class TopDealsWidget extends ConsumerWidget {
  const TopDealsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dealsAsync = ref.watch(topDealsProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.star, size: 20, color: Colors.amber),
                SizedBox(width: 8),
                Text(
                  'Top Deals Closing This Week',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            dealsAsync.when(
              data: (deals) {
                if (deals.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No deals closing this week'),
                    ),
                  );
                }
                return Column(
                  children: deals.take(3).map((deal) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.trending_up, color: Colors.blue),
                      ),
                      title: Text(
                        deal.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        '${deal.stage} • ₹${(deal.value / 1000).toStringAsFixed(0)}k',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      trailing: const Icon(Icons.chevron_right, size: 20),
                      onTap: () {
                        context.push('/deals/${deal.id}');
                      },
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
}
