import 'dart:io';
import 'package:flutter/services.dart';

/// iOS-specific features integration
class IOSFeatures {
  static const MethodChannel _channel = MethodChannel('payaid_crm/ios_features');
  
  /// Check if running on iOS
  static bool get isIOS => Platform.isIOS;
  
  /// Setup Siri Shortcuts
  static Future<void> setupSiriShortcuts() async {
    if (!isIOS) return;
    
    try {
      await _channel.invokeMethod('setupSiriShortcuts', {
        'shortcuts': [
          {
            'identifier': 'show_top_deals',
            'title': 'Show Top Deals',
            'suggestedInvocationPhrase': 'Show my top deals',
          },
          {
            'identifier': 'show_forecast',
            'title': 'Show Revenue Forecast',
            'suggestedInvocationPhrase': 'What\'s my forecast',
          },
          {
            'identifier': 'log_call',
            'title': 'Log Call',
            'suggestedInvocationPhrase': 'Log a call',
          },
        ],
      });
    } catch (e) {
      print('Error setting up Siri shortcuts: $e');
    }
  }
  
  /// Handle Siri shortcut
  static Future<Map<String, dynamic>?> handleSiriShortcut(String identifier) async {
    if (!isIOS) return null;
    
    try {
      final result = await _channel.invokeMethod('handleSiriShortcut', {
        'identifier': identifier,
      });
      return Map<String, dynamic>.from(result);
    } catch (e) {
      print('Error handling Siri shortcut: $e');
      return null;
    }
  }
  
  /// Setup WidgetKit widgets
  static Future<void> setupWidgetKit() async {
    if (!isIOS) return;
    
    try {
      await _channel.invokeMethod('setupWidgetKit', {
        'widgets': [
          {
            'kind': 'DealPipelineWidget',
            'displayName': 'Deal Pipeline',
            'description': 'Shows your active deals by stage',
          },
          {
            'kind': 'TopDealsWidget',
            'displayName': 'Top Deals',
            'description': 'Shows your top 3 deals',
          },
          {
            'kind': 'TasksWidget',
            'displayName': 'Today\'s Tasks',
            'description': 'Shows tasks due today',
          },
        ],
      });
    } catch (e) {
      print('Error setting up WidgetKit: $e');
    }
  }
  
  /// Update WidgetKit data
  static Future<void> updateWidgetData(String kind, Map<String, dynamic> data) async {
    if (!isIOS) return;
    
    try {
      await _channel.invokeMethod('updateWidgetData', {
        'kind': kind,
        'data': data,
      });
    } catch (e) {
      print('Error updating widget data: $e');
    }
  }
  
  /// Setup iCloud sync
  static Future<void> setupICloudSync() async {
    if (!isIOS) return;
    
    try {
      await _channel.invokeMethod('setupICloudSync');
    } catch (e) {
      print('Error setting up iCloud sync: $e');
    }
  }
  
  /// Sync contacts to iCloud
  static Future<void> syncContactsToICloud(List<Map<String, dynamic>> contacts) async {
    if (!isIOS) return;
    
    try {
      await _channel.invokeMethod('syncContactsToICloud', {
        'contacts': contacts,
      });
    } catch (e) {
      print('Error syncing contacts to iCloud: $e');
    }
  }
}
