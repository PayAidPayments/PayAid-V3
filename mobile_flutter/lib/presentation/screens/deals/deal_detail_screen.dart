import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/data/repositories/deal_repository.dart';

final dealDetailProvider = FutureProvider.family<dynamic, String>((ref, dealId) async {
  final repository = ref.watch(dealRepositoryProvider);
  return await repository.getDeal(dealId);
});

class DealDetailScreen extends ConsumerWidget {
  final String dealId;
  
  const DealDetailScreen({
    super.key,
    required this.dealId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dealAsync = ref.watch(dealDetailProvider(dealId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Deal Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit deal
            },
          ),
        ],
      ),
      body: dealAsync.when(
        data: (deal) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Deal Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          deal.name,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Chip(
                          label: Text(deal.stage),
                          backgroundColor: Colors.blue.shade100,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Deal Value',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              '₹${deal.value.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Actions
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // TODO: Log activity
                        },
                        icon: const Icon(Icons.note_add),
                        label: const Text('Log Activity'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          // TODO: Update stage
                        },
                        icon: const Icon(Icons.swap_horiz),
                        label: const Text('Change Stage'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Deal Information
                const Text(
                  'Deal Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      if (deal.contactName != null)
                        ListTile(
                          leading: const Icon(Icons.person),
                          title: const Text('Contact'),
                          subtitle: Text(deal.contactName!),
                        ),
                      if (deal.expectedCloseDate != null)
                        ListTile(
                          leading: const Icon(Icons.calendar_today),
                          title: const Text('Expected Close Date'),
                          subtitle: Text(
                            deal.expectedCloseDate!.toString().split(' ')[0],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }
}
