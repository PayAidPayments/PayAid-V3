import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:payaid_crm/core/network/api_client.dart';
import 'package:payaid_crm/core/storage/local_storage.dart';

class AuthService {
  final ApiClient _apiClient;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );
  
  AuthService(this._apiClient);
  
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        '/api/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final token = response.data['token'] as String;
      final user = response.data['user'] as Map<String, dynamic>;
      final tenantId = response.data['tenantId'] as String;
      
      // Save token and tenant ID
      await LocalStorage.saveToken(token);
      await LocalStorage.saveTenantId(tenantId);
      
      return {
        'success': true,
        'token': token,
        'user': user,
        'tenantId': tenantId,
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  Future<Map<String, dynamic>> loginWithGoogle() async {
    try {
      // Sign in with Google
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        return {'success': false, 'error': 'Google sign-in cancelled'};
      }
      
      // Get authentication details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      // Send to backend for verification and token generation
      final response = await _apiClient.post(
        '/api/auth/oauth/google',
        data: {
          'idToken': googleAuth.idToken,
          'accessToken': googleAuth.accessToken,
          'email': googleUser.email,
          'name': googleUser.displayName,
          'photoUrl': googleUser.photoUrl,
        },
      );
      
      final token = response.data['token'] as String;
      final user = response.data['user'] as Map<String, dynamic>;
      final tenantId = response.data['tenantId'] as String;
      
      // Save token and tenant ID
      await LocalStorage.saveToken(token);
      await LocalStorage.saveTenantId(tenantId);
      
      return {
        'success': true,
        'token': token,
        'user': user,
        'tenantId': tenantId,
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  Future<Map<String, dynamic>> loginWithApple() async {
    try {
      // Request Apple Sign-In
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      
      // Send to backend for verification and token generation
      final response = await _apiClient.post(
        '/api/auth/oauth/apple',
        data: {
          'identityToken': credential.identityToken,
          'authorizationCode': credential.authorizationCode,
          'email': credential.email,
          'givenName': credential.givenName,
          'familyName': credential.familyName,
        },
      );
      
      final token = response.data['token'] as String;
      final user = response.data['user'] as Map<String, dynamic>;
      final tenantId = response.data['tenantId'] as String;
      
      // Save token and tenant ID
      await LocalStorage.saveToken(token);
      await LocalStorage.saveTenantId(tenantId);
      
      return {
        'success': true,
        'token': token,
        'user': user,
        'tenantId': tenantId,
      };
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  Future<void> logout() async {
    await LocalStorage.clearToken();
  }
  
  Future<bool> isAuthenticated() async {
    final token = await LocalStorage.getToken();
    return token != null;
  }
}
