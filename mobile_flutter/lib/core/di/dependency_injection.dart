import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';
import 'package:payaid_crm/data/repositories/contact_repository.dart';
import 'package:payaid_crm/data/repositories/deal_repository.dart';
import 'package:payaid_crm/data/repositories/task_repository.dart';
import 'package:payaid_crm/data/repositories/dashboard_repository.dart';
import 'package:payaid_crm/core/auth/auth_service.dart';

Future<void> setupDependencyInjection() async {
  // Initialize local storage
  await LocalStorage.initialize();
}

// API Client Provider
final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'https://api.payaid.com', // Replace with actual API URL
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );
  
  return ApiClient(dio);
});

// Auth Service Provider
final authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthService(apiClient);
});

// Repository Providers
final contactRepositoryProvider = Provider<ContactRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ContactRepository(apiClient);
});

final dealRepositoryProvider = Provider<DealRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DealRepository(apiClient);
});

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TaskRepository(apiClient);
});

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardRepository(apiClient);
});
