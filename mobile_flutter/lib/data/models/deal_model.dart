import 'package:json_annotation/json_annotation.dart';

part 'deal_model.g.dart';

@JsonSerializable()
class DealModel {
  final String id;
  final String name;
  final String stage;
  final double value;
  final String? contactId;
  final String? contactName;
  final DateTime? expectedCloseDate;
  final DateTime? lastActivityAt;
  final Map<String, dynamic>? customFields;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  DealModel({
    required this.id,
    required this.name,
    required this.stage,
    required this.value,
    this.contactId,
    this.contactName,
    this.expectedCloseDate,
    this.lastActivityAt,
    this.customFields,
    required this.createdAt,
    this.updatedAt,
  });
  
  factory DealModel.fromJson(Map<String, dynamic> json) => _$DealModelFromJson(json);
  Map<String, dynamic> toJson() => _$DealModelToJson(this);
}
