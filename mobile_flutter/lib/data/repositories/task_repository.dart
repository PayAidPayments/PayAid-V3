import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';

class TaskRepository {
  final ApiClient _apiClient;
  
  TaskRepository(this._apiClient);
  
  Future<List<Map<String, dynamic>>> getTasks({
    String? status,
    String? contactId,
    String? dealId,
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/crm/tasks',
        queryParameters: {
          if (status != null) 'status': status,
          if (contactId != null) 'contactId': contactId,
          if (dealId != null) 'dealId': dealId,
        },
      );
      
      final List<dynamic> data = response.data['data'] ?? [];
      final tasks = data.map((json) => Map<String, dynamic>.from(json)).toList();
      
      // Cache for offline access
      await LocalStorage.saveTasks(tasks);
      
      return tasks;
    } catch (e) {
      // Return cached data if available
      final cached = LocalStorage.getTasks();
      if (cached != null) {
        return cached;
      }
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> createTask(Map<String, dynamic> data) async {
    final response = await _apiClient.post(
      '/api/crm/tasks',
      data: data,
    );
    return Map<String, dynamic>.from(response.data['data']);
  }
  
  Future<Map<String, dynamic>> updateTask(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(
      '/api/crm/tasks/$id',
      data: data,
    );
    return Map<String, dynamic>.from(response.data['data']);
  }
}
