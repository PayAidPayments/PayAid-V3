import 'package:flutter/material.dart';

class RecentActivityWidget extends StatelessWidget {
  const RecentActivityWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Activity',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.email, size: 20),
                ),
                title: const Text('Email sent to Rahul'),
                subtitle: const Text('2 hours ago'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.phone, size: 20),
                ),
                title: const Text('Call with Priya'),
                subtitle: const Text('5 hours ago'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.task, size: 20),
                ),
                title: const Text('Task completed: Follow up'),
                subtitle: const Text('1 day ago'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
