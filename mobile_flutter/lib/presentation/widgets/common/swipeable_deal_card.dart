import 'package:flutter/material.dart';
import 'package:payaid_crm/data/models/deal_model.dart';

/// Swipeable deal card for mobile - swipe left/right to change stage
class SwipeableDealCard extends StatelessWidget {
  final DealModel deal;
  final Function(String newStage)? onStageChanged;

  const SwipeableDealCard({
    super.key,
    required this.deal,
    this.onStageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Dismissible(
        key: Key(deal.id),
        background: Container(
          color: Colors.green,
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.only(left: 20),
          child: const Icon(Icons.check, color: Colors.white, size: 32),
        ),
        secondaryBackground: Container(
          color: Colors.blue,
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          child: const Icon(Icons.arrow_forward, color: Colors.white, size: 32),
        ),
        onDismissed: (direction) {
          // Determine next stage based on swipe direction
          if (direction == DismissDirection.endToStart) {
            // Swipe left = move to next stage
            _moveToNextStage();
          } else if (direction == DismissDirection.startToEnd) {
            // Swipe right = mark as won
            onStageChanged?.call('closed-won');
          }
        },
        child: ListTile(
          title: Text(
            deal.name,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text('${deal.stage} • ₹${(deal.value / 1000).toStringAsFixed(0)}k'),
          trailing: const Icon(Icons.chevron_right),
        ),
      ),
    );
  }

  void _moveToNextStage() {
    // Stage progression logic
    const stageProgression = {
      'lead': 'contacted',
      'contacted': 'demo',
      'demo': 'proposal',
      'proposal': 'negotiation',
      'negotiation': 'closed-won',
    };
    
    final nextStage = stageProgression[deal.stage.toLowerCase()] ?? deal.stage;
    onStageChanged?.call(nextStage);
  }
}
