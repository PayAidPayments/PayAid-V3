import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';

final personalForecastProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return await repository.getPersonalForecast();
});

class PersonalForecastWidget extends ConsumerWidget {
  const PersonalForecastWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final forecastAsync = ref.watch(personalForecastProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.trending_up, size: 20, color: Colors.green),
                SizedBox(width: 8),
                Text(
                  'Personal Forecast',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            forecastAsync.when(
              data: (forecast) {
                final base = forecast['base'] as num? ?? 0;
                final confidence = forecast['confidence'] as num? ?? 0;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'You\'re tracking to ₹${(base / 100000).toStringAsFixed(1)}L this quarter',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text(
                          'Confidence: ',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Text(
                          '${confidence.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
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
