import 'package:flutter/material.dart';

class ContactListItem extends StatelessWidget {
  final dynamic contact;
  final VoidCallback onTap;

  const ContactListItem({
    super.key,
    required this.contact,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade100,
          child: Text(
            contact.name.substring(0, 1).toUpperCase(),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(contact.name),
        subtitle: contact.email != null
            ? Text(contact.email!)
            : contact.phone != null
                ? Text(contact.phone!)
                : null,
        trailing: contact.leadScore != null
            ? Chip(
                label: Text('${contact.leadScore}'),
                backgroundColor: _getScoreColor(contact.leadScore).withOpacity(0.2),
                labelStyle: TextStyle(
                  color: _getScoreColor(contact.leadScore),
                  fontWeight: FontWeight.bold,
                ),
              )
            : null,
        onTap: onTap,
      ),
    );
  }

  Color _getScoreColor(String? score) {
    if (score == null) return Colors.grey;
    final scoreValue = double.tryParse(score) ?? 0;
    if (scoreValue >= 75) return Colors.green;
    if (scoreValue >= 50) return Colors.orange;
    return Colors.grey;
  }
}
