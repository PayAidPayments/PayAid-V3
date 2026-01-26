import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:payaid_crm/presentation/screens/auth/login_screen.dart';
import 'package:payaid_crm/presentation/screens/dashboard/dashboard_screen.dart';
import 'package:payaid_crm/presentation/screens/contacts/contacts_screen.dart';
import 'package:payaid_crm/presentation/screens/contacts/contact_detail_screen.dart';
import 'package:payaid_crm/presentation/screens/deals/deals_screen.dart';
import 'package:payaid_crm/presentation/screens/deals/deal_detail_screen.dart';
import 'package:payaid_crm/presentation/screens/tasks/tasks_screen.dart';
import 'package:payaid_crm/presentation/screens/settings/settings_screen.dart';
import 'package:payaid_crm/core/auth/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginPage = state.matchedLocation == '/login';
      
      if (!isAuthenticated && !isLoginPage) {
        return '/login';
      }
      
      if (isAuthenticated && isLoginPage) {
        return '/dashboard';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        name: 'dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/contacts',
        name: 'contacts',
        builder: (context, state) => const ContactsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            name: 'contact-detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return ContactDetailScreen(contactId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/deals',
        name: 'deals',
        builder: (context, state) => const DealsScreen(),
        routes: [
          GoRoute(
            path: ':id',
            name: 'deal-detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return DealDetailScreen(dealId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/tasks',
        name: 'tasks',
        builder: (context, state) => const TasksScreen(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});
