# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: common.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    29,
    0,
    '',
    'common.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x0c\x63ommon.proto\x12\x10\x65\x63ommerce.common\"\x07\n\x05\x45mpty\"\x86\x01\n\x06Status\x12+\n\x04\x63ode\x18\x01 \x01(\x0e\x32\x1d.ecommerce.common.Status.Code\x12\x0f\n\x07message\x18\x02 \x01(\t\">\n\x04\x43ode\x12\x06\n\x02OK\x10\x00\x12\t\n\x05\x45RROR\x10\x01\x12\r\n\tNOT_FOUND\x10\x02\x12\x14\n\x10INVALID_ARGUMENT\x10\x03\"k\n\x08Metadata\x12\x32\n\x04\x64\x61ta\x18\x01 \x03(\x0b\x32$.ecommerce.common.Metadata.DataEntry\x1a+\n\tDataEntry\x12\x0b\n\x03key\x18\x01 \x01(\t\x12\r\n\x05value\x18\x02 \x01(\t:\x02\x38\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'common_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_METADATA_DATAENTRY']._loaded_options = None
  _globals['_METADATA_DATAENTRY']._serialized_options = b'8\001'
  _globals['_EMPTY']._serialized_start=34
  _globals['_EMPTY']._serialized_end=41
  _globals['_STATUS']._serialized_start=44
  _globals['_STATUS']._serialized_end=178
  _globals['_STATUS_CODE']._serialized_start=116
  _globals['_STATUS_CODE']._serialized_end=178
  _globals['_METADATA']._serialized_start=180
  _globals['_METADATA']._serialized_end=287
  _globals['_METADATA_DATAENTRY']._serialized_start=244
  _globals['_METADATA_DATAENTRY']._serialized_end=287
# @@protoc_insertion_point(module_scope)
