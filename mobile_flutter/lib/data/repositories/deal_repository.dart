import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/data/models/deal_model.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';

class DealRepository {
  final ApiClient _apiClient;
  
  DealRepository(this._apiClient);
  
  Future<List<DealModel>> getDeals({
    String? stage,
    String? contactId,
    int? limit,
    int? offset,
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/crm/deals',
        queryParameters: {
          if (stage != null) 'stage': stage,
          if (contactId != null) 'contactId': contactId,
          if (limit != null) 'limit': limit,
          if (offset != null) 'offset': offset,
        },
      );
      
      final List<dynamic> data = response.data['data'] ?? [];
      final deals = data.map((json) => DealModel.fromJson(json)).toList();
      
      // Cache for offline access
      await LocalStorage.saveDeals(data);
      
      return deals;
    } catch (e) {
      // Return cached data if available
      final cached = LocalStorage.getDeals();
      if (cached != null) {
        return cached.map((json) => DealModel.fromJson(json)).toList();
      }
      rethrow;
    }
  }
  
  Future<DealModel> getDeal(String id) async {
    final response = await _apiClient.get('/api/crm/deals/$id');
    return DealModel.fromJson(response.data['data']);
  }
  
  Future<DealModel> createDeal(Map<String, dynamic> data) async {
    final response = await _apiClient.post(
      '/api/crm/deals',
      data: data,
    );
    return DealModel.fromJson(response.data['data']);
  }
  
  Future<DealModel> updateDeal(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.patch(
      '/api/crm/deals/$id',
      data: data,
    );
    return DealModel.fromJson(response.data['data']);
  }
  
  Future<void> updateDealStage(String id, String newStage) async {
    await _apiClient.patch(
      '/api/crm/deals/$id',
      data: {'stage': newStage},
    );
  }
}
