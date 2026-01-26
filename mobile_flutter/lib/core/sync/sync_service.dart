import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';
import 'package:payaid_crm/data/repositories/contact_repository.dart';
import 'package:payaid_crm/data/repositories/deal_repository.dart';
import 'package:payaid_crm/data/repositories/task_repository.dart';

class SyncService {
  final ContactRepository _contactRepository;
  final DealRepository _dealRepository;
  final TaskRepository _taskRepository;
  final Connectivity _connectivity = Connectivity();
  
  SyncService(
    this._contactRepository,
    this._dealRepository,
    this._taskRepository,
  );
  
  /// Check if device is online
  Future<bool> isOnline() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
  
  /// Sync all data when online
  Future<void> syncAll() async {
    if (!await isOnline()) {
      return; // Skip if offline
    }
    
    try {
      // Sync contacts
      await _contactRepository.getContacts();
      
      // Sync deals
      await _dealRepository.getDeals();
      
      // Sync tasks
      await _taskRepository.getTasks();
      
      // Process sync queue (offline actions)
      await _processSyncQueue();
    } catch (e) {
      print('Sync error: $e');
    }
  }
  
  /// Process queued offline actions
  Future<void> _processSyncQueue() async {
    final queue = LocalStorage.getSyncQueue();
    
    for (final action in queue) {
      try {
        switch (action['action']) {
          case 'create_contact':
            await _contactRepository.createContact(action['data']);
            break;
          case 'update_contact':
            await _contactRepository.updateContact(
              action['data']['id'],
              action['data'],
            );
            break;
          case 'create_deal':
            await _dealRepository.createDeal(action['data']);
            break;
          case 'update_deal':
            await _dealRepository.updateDeal(
              action['data']['id'],
              action['data'],
            );
            break;
          case 'create_task':
            await _taskRepository.createTask(action['data']);
            break;
          case 'update_task':
            await _taskRepository.updateTask(
              action['data']['id'],
              action['data'],
            );
            break;
        }
      } catch (e) {
        print('Failed to sync action: ${action['action']}, error: $e');
        // Keep failed actions in queue for retry
      }
    }
    
    // Clear successfully synced actions
    await LocalStorage.clearSyncQueue();
  }
  
  /// Start background sync (call periodically)
  Future<void> startBackgroundSync() async {
    // Listen to connectivity changes
    _connectivity.onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        syncAll(); // Auto-sync when connection restored
      }
    });
  }
}
