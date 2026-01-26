import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final pipelineSnapshotProvider = FutureProvider.autoDispose<Map<String, int>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getPipelineSnapshot();
});

class PipelineSnapshotWidget extends ConsumerWidget {
  const PipelineSnapshotWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshotAsync = ref.watch(pipelineSnapshotProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.timeline, size: 20, color: Colors.purple),
                SizedBox(width: 8),
                Text(
                  'Pipeline Snapshot',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            snapshotAsync.when(
              data: (snapshot) {
                if (snapshot.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No deals in pipeline'),
                    ),
                  );
                }
                return Column(
                  children: snapshot.entries.map((entry) {
                    final stage = entry.key;
                    final count = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              stage,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.purple.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '$count',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.purple,
                              ),
                            ),
                          ),
                        ],
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
}
