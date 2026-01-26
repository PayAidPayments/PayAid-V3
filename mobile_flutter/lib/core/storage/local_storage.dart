import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalStorage {
  static const _storage = FlutterSecureStorage();
  static Box? _contactsBox;
  static Box? _dealsBox;
  static Box? _tasksBox;
  static Box? _settingsBox;
  
  static Future<void> initialize() async {
    _contactsBox = await Hive.openBox('contacts');
    _dealsBox = await Hive.openBox('deals');
    _tasksBox = await Hive.openBox('tasks');
    _settingsBox = await Hive.openBox('settings');
  }
  
  // Token Management
  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }
  
  static Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }
  
  static Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }
  
  // Tenant Management
  static Future<void> saveTenantId(String tenantId) async {
    await _settingsBox?.put('tenant_id', tenantId);
  }
  
  static Future<String?> getTenantId() async {
    return _settingsBox?.get('tenant_id');
  }
  
  // Offline Data Storage
  static Future<void> saveContacts(List<Map<String, dynamic>> contacts) async {
    await _contactsBox?.put('all_contacts', contacts);
  }
  
  static List<Map<String, dynamic>>? getContacts() {
    final data = _contactsBox?.get('all_contacts');
    if (data != null) {
      return List<Map<String, dynamic>>.from(data);
    }
    return null;
  }
  
  static Future<void> saveDeals(List<Map<String, dynamic>> deals) async {
    await _dealsBox?.put('all_deals', deals);
  }
  
  static List<Map<String, dynamic>>? getDeals() {
    final data = _dealsBox?.get('all_deals');
    if (data != null) {
      return List<Map<String, dynamic>>.from(data);
    }
    return null;
  }
  
  static Future<void> saveTasks(List<Map<String, dynamic>> tasks) async {
    await _tasksBox?.put('all_tasks', tasks);
  }
  
  static List<Map<String, dynamic>>? getTasks() {
    final data = _tasksBox?.get('all_tasks');
    if (data != null) {
      return List<Map<String, dynamic>>.from(data);
    }
    return null;
  }
  
  // Sync Queue (for offline actions)
  static Future<void> addToSyncQueue(String action, Map<String, dynamic> data) async {
    final queue = _settingsBox?.get('sync_queue', defaultValue: <Map<String, dynamic>>[]) as List;
    queue.add({
      'action': action,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
    await _settingsBox?.put('sync_queue', queue);
  }
  
  static List<Map<String, dynamic>> getSyncQueue() {
    final queue = _settingsBox?.get('sync_queue', defaultValue: <Map<String, dynamic>>[]) as List;
    return List<Map<String, dynamic>>.from(queue);
  }
  
  static Future<void> clearSyncQueue() async {
    await _settingsBox?.put('sync_queue', <Map<String, dynamic>>[]);
  }
}
