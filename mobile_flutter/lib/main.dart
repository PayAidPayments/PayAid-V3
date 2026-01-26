import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'dart:io';
import 'package:payaid_crm/core/router/app_router.dart';
import 'package:payaid_crm/core/theme/app_theme.dart';
import 'package:payaid_crm/core/theme/material3_theme.dart';
import 'package:payaid_crm/core/di/dependency_injection.dart';
import 'package:payaid_crm/core/notifications/push_notification_service.dart';
import 'package:payaid_crm/core/sync/sync_service.dart';
import 'package:payaid_crm/core/ios/ios_features.dart';
import 'package:payaid_crm/data/repositories/contact_repository.dart';
import 'package:payaid_crm/data/repositories/deal_repository.dart';
import 'package:payaid_crm/data/repositories/task_repository.dart';
import 'package:payaid_crm/core/network/api_client.dart';
import 'package:dio/dio.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Initialize dependency injection
  await setupDependencyInjection();
  
  // Initialize push notifications
  final pushService = PushNotificationService();
  await pushService.initialize();
  
  // Initialize sync service
  final apiClient = ApiClient(Dio());
  final syncService = SyncService(
    ContactRepository(apiClient),
    DealRepository(apiClient),
    TaskRepository(apiClient),
  );
  await syncService.startBackgroundSync();
  
  // Initialize iOS-specific features
  if (Platform.isIOS) {
    await IOSFeatures.setupSiriShortcuts();
    await IOSFeatures.setupWidgetKit();
    await IOSFeatures.setupICloudSync();
  }
  
  runApp(
    const ProviderScope(
      child: PayAidCRMApp(),
    ),
  );
}

class PayAidCRMApp extends ConsumerWidget {
  const PayAidCRMApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'PayAid CRM',
      debugShowCheckedModeBanner: false,
      theme: Material3Theme.lightTheme,
      darkTheme: Material3Theme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
