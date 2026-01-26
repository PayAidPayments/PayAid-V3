import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/data/models/deal_model.dart';
import 'package:payaid_crm/data/models/contact_model.dart';

class DashboardRepository {
  final ApiClient _apiClient;
  
  DashboardRepository(this._apiClient);
  
  /// Get dashboard summary data
  Future<Map<String, dynamic>> getDashboardSummary() async {
    final response = await _apiClient.get('/api/crm/dashboard/summary');
    return Map<String, dynamic>.from(response.data['data']);
  }
  
  /// Get today's tasks
  Future<List<Map<String, dynamic>>> getTodaysTasks() async {
    final response = await _apiClient.get('/api/crm/tasks', queryParameters: {
      'status': 'pending',
      'dueToday': 'true',
    });
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => Map<String, dynamic>.from(json)).toList();
  }
  
  /// Get today's meetings/calls
  Future<List<Map<String, dynamic>>> getTodaysMeetings() async {
    final response = await _apiClient.get('/api/crm/interactions', queryParameters: {
      'type': 'meeting',
      'today': 'true',
    });
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => Map<String, dynamic>.from(json)).toList();
  }
  
  /// Get pipeline snapshot (deals by stage)
  Future<Map<String, int>> getPipelineSnapshot() async {
    final response = await _apiClient.get('/api/crm/deals/pipeline-snapshot');
    return Map<String, int>.from(response.data['data']);
  }
  
  /// Get personal forecast
  Future<Map<String, dynamic>> getPersonalForecast() async {
    final response = await _apiClient.get('/api/crm/analytics/revenue-forecast');
    final forecast = response.data['data']['combinedForecast'];
    return {
      'base': forecast['base'],
      'conservative': forecast['conservative'],
      'upside': forecast['upside'],
      'confidence': forecast['confidence'],
    };
  }
  
  /// Get top deals closing this week
  Future<List<DealModel>> getTopDealsThisWeek() async {
    final now = DateTime.now();
    final nextWeek = now.add(const Duration(days: 7));
    
    final response = await _apiClient.get('/api/crm/deals', queryParameters: {
      'expectedCloseDateFrom': now.toIso8601String(),
      'expectedCloseDateTo': nextWeek.toIso8601String(),
      'limit': '5',
      'sortBy': 'value',
      'sortOrder': 'desc',
    });
    
    final List<dynamic> data = response.data['data'] ?? response.data['deals'] ?? [];
    return data.map((json) => DealModel.fromJson(json)).toList();
  }
  
  /// Get recent activity log
  Future<List<Map<String, dynamic>>> getRecentActivity({int limit = 10}) async {
    final response = await _apiClient.get('/api/crm/activity/recent', queryParameters: {
      'limit': limit.toString(),
    });
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => Map<String, dynamic>.from(json)).toList();
  }
}
