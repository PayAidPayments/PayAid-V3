import 'package:json_annotation/json_annotation.dart';

part 'contact_model.g.dart';

@JsonSerializable()
class ContactModel {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? company;
  final String? title;
  final String stage;
  final String? leadScore;
  final Map<String, dynamic>? customFields;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  ContactModel({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.company,
    this.title,
    required this.stage,
    this.leadScore,
    this.customFields,
    required this.createdAt,
    this.updatedAt,
  });
  
  factory ContactModel.fromJson(Map<String, dynamic> json) => _$ContactModelFromJson(json);
  Map<String, dynamic> toJson() => _$ContactModelToJson(this);
}
