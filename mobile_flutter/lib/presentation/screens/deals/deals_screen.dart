import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:payaid_crm/data/repositories/deal_repository.dart';
import 'package:payaid_crm/data/models/deal_model.dart';
import 'package:payaid_crm/presentation/widgets/common/swipeable_deal_card.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final dealsProvider = FutureProvider.autoDispose<List<DealModel>>((ref) async {
  final repository = ref.watch(dealRepositoryProvider);
  return await repository.getDeals();
});

class DealsScreen extends ConsumerWidget {
  const DealsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dealsAsync = ref.watch(dealsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Deals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to create deal
            },
          ),
        ],
      ),
      body: dealsAsync.when(
        data: (deals) {
          if (deals.isEmpty) {
            return const Center(
              child: Text('No deals found'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: deals.length,
            itemBuilder: (context, index) {
              final deal = deals[index];
              return SwipeableDealCard(
                deal: deal,
                onStageChanged: (newStage) async {
                  // Update deal stage
                  final repository = ref.read(dealRepositoryProvider);
                  try {
                    await repository.updateDealStage(deal.id, newStage);
                    // Refresh deals list
                    ref.invalidate(dealsProvider);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Deal moved to $newStage'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to update deal: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create deal
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
