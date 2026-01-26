import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/data/models/contact_model.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';

class ContactRepository {
  final ApiClient _apiClient;
  
  ContactRepository(this._apiClient);
  
  Future<List<ContactModel>> getContacts({
    String? search,
    String? stage,
    int? limit,
    int? offset,
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/crm/contacts',
        queryParameters: {
          if (search != null) 'search': search,
          if (stage != null) 'stage': stage,
          if (limit != null) 'limit': limit,
          if (offset != null) 'offset': offset,
        },
      );
      
      final List<dynamic> data = response.data['data'] ?? [];
      final contacts = data.map((json) => ContactModel.fromJson(json)).toList();
      
      // Cache for offline access
      await LocalStorage.saveContacts(data);
      
      return contacts;
    } catch (e) {
      // Return cached data if available
      final cached = LocalStorage.getContacts();
      if (cached != null) {
        return cached.map((json) => ContactModel.fromJson(json)).toList();
      }
      rethrow;
    }
  }
  
  Future<ContactModel> getContact(String id) async {
    final response = await _apiClient.get('/api/crm/contacts/$id');
    return ContactModel.fromJson(response.data['data']);
  }
  
  Future<ContactModel> createContact(Map<String, dynamic> data) async {
    final response = await _apiClient.post(
      '/api/crm/contacts',
      data: data,
    );
    return ContactModel.fromJson(response.data['data']);
  }
  
  Future<ContactModel> updateContact(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(
      '/api/crm/contacts/$id',
      data: data,
    );
    return ContactModel.fromJson(response.data['data']);
  }
}
