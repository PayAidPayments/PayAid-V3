import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payaid_crm/core/auth/auth_service.dart';

class AuthState {
  final bool isAuthenticated;
  final String? userId;
  final String? tenantId;
  final String? userName;
  
  AuthState({
    required this.isAuthenticated,
    this.userId,
    this.tenantId,
    this.userName,
  });
  
  AuthState copyWith({
    bool? isAuthenticated,
    String? userId,
    String? tenantId,
    String? userName,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      userId: userId ?? this.userId,
      tenantId: tenantId ?? this.tenantId,
      userName: userName ?? this.userName,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  
  AuthNotifier(this._authService) : super(AuthState(isAuthenticated: false)) {
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    final isAuth = await _authService.isAuthenticated();
    state = state.copyWith(isAuthenticated: isAuth);
  }
  
  Future<bool> login(String email, String password) async {
    final result = await _authService.login(email, password);
    
    if (result['success'] == true) {
      state = state.copyWith(
        isAuthenticated: true,
        userId: result['user']?['id'],
        tenantId: result['tenantId'],
        userName: result['user']?['name'],
      );
      return true;
    }
    
    return false;
  }
  
  Future<void> logout() async {
    await _authService.logout();
    state = AuthState(isAuthenticated: false);
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
