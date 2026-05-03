import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_sound/flutter_sound.dart';
import 'package:permission_handler/permission_handler.dart';

class VoiceService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  FlutterSoundRecorder? _audioRecorder;
  bool _isListening = false;
  bool _isRecording = false;
  
  /// Initialize voice service
  Future<bool> initialize() async {
    // Request microphone permission
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      return false;
    }
    
    // Initialize speech to text
    final available = await _speech.initialize(
      onStatus: (status) {
        print('Speech status: $status');
      },
      onError: (error) {
        print('Speech error: $error');
      },
    );
    
    // Initialize audio recorder
    _audioRecorder = FlutterSoundRecorder();
    await _audioRecorder?.openRecorder();
    
    return available;
  }
  
  /// Start listening for voice commands (Hindi + English)
  Future<void> startListening({
    required Function(String text) onResult,
    Function(String error)? onError,
  }) async {
    if (_isListening) return;
    
    _isListening = true;
    
    await _speech.listen(
      onResult: (result) {
        if (result.finalResult) {
          onResult(result.recognizedWords);
          _isListening = false;
        }
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      localeId: 'hi_IN,en_IN', // Hindi and English (India)
      listenMode: stt.ListenMode.confirmation,
    );
  }
  
  /// Stop listening
  Future<void> stopListening() async {
    if (!_isListening) return;
    
    await _speech.stop();
    _isListening = false;
  }
  
  /// Start recording voice note
  Future<String?> startRecording() async {
    if (_isRecording || _audioRecorder == null) return null;
    
    _isRecording = true;
    final path = '/tmp/voice_note_${DateTime.now().millisecondsSinceEpoch}.aac';
    
    await _audioRecorder?.startRecorder(
      toFile: path,
      codec: Codec.aacADTS,
    );
    
    return path;
  }
  
  /// Stop recording and return file path
  Future<String?> stopRecording() async {
    if (!_isRecording || _audioRecorder == null) return null;
    
    final path = await _audioRecorder?.stopRecorder();
    _isRecording = false;
    
    return path;
  }
  
  /// Process voice command and return action
  Map<String, dynamic>? processCommand(String command) {
    final lowerCommand = command.toLowerCase();
    
    // Deal-related commands
    if (lowerCommand.contains('top') && lowerCommand.contains('deal')) {
      final match = RegExp(r'(\d+)').firstMatch(lowerCommand);
      final count = match != null ? int.parse(match.group(1)!) : 3;
      return {'action': 'show_top_deals', 'count': count};
    }
    
    // Forecast commands
    if (lowerCommand.contains('forecast') || lowerCommand.contains('revenue')) {
      return {'action': 'show_forecast'};
    }
    
    // Log call commands
    if (lowerCommand.contains('log call') || lowerCommand.contains('call with')) {
      final nameMatch = RegExp(r'with\s+(\w+)').firstMatch(lowerCommand);
      final name = nameMatch?.group(1);
      return {'action': 'log_call', 'contact': name};
    }
    
    // Set reminder commands
    if (lowerCommand.contains('reminder') || lowerCommand.contains('remind')) {
      return {'action': 'set_reminder', 'text': command};
    }
    
    return null;
  }
  
  void dispose() {
    _speech.cancel();
    _audioRecorder?.closeRecorder();
  }
}
