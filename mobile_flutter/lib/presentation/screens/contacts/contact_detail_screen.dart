import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:payaid_crm/data/repositories/contact_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final contactDetailProvider = FutureProvider.family<dynamic, String>((ref, contactId) async {
  final repository = ref.watch(contactRepositoryProvider);
  return await repository.getContact(contactId);
});

class ContactDetailScreen extends ConsumerWidget {
  final String contactId;
  
  const ContactDetailScreen({
    super.key,
    required this.contactId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contactAsync = ref.watch(contactDetailProvider(contactId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit contact
            },
          ),
        ],
      ),
      body: contactAsync.when(
        data: (contact) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Contact Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.blue.shade100,
                          child: Text(
                            contact.name.substring(0, 1).toUpperCase(),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          contact.name,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (contact.title != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            contact.title!,
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                        if (contact.company != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            contact.company!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Quick Actions
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: contact.phone != null
                            ? () async {
                                final uri = Uri.parse('tel:${contact.phone}');
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri);
                                }
                              }
                            : null,
                        icon: const Icon(Icons.phone),
                        label: const Text('Call'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: contact.email != null
                            ? () async {
                                final uri = Uri.parse('mailto:${contact.email}');
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri);
                                }
                              }
                            : null,
                        icon: const Icon(Icons.email),
                        label: const Text('Email'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: contact.phone != null
                            ? () async {
                                final uri = Uri.parse('https://wa.me/${contact.phone}');
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri);
                                }
                              }
                            : null,
                        icon: const Icon(Icons.chat),
                        label: const Text('WhatsApp'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Contact Information
                const Text(
                  'Contact Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      if (contact.email != null)
                        ListTile(
                          leading: const Icon(Icons.email),
                          title: const Text('Email'),
                          subtitle: Text(contact.email!),
                        ),
                      if (contact.phone != null)
                        ListTile(
                          leading: const Icon(Icons.phone),
                          title: const Text('Phone'),
                          subtitle: Text(contact.phone!),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Deals Section
                const Text(
                  'Deals',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                // TODO: Show deals for this contact
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No deals found'),
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
