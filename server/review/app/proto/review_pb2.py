# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: review.proto
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
    'review.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


import app.proto.common_pb2 as common__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x0creview.proto\x12\x10\x65\x63ommerce.review\x1a\x0c\x63ommon.proto\"X\n\x18GetProductReviewsRequest\x12\x11\n\tproductId\x18\x01 \x01(\t\x12\x0c\n\x04page\x18\x02 \x01(\x05\x12\x0c\n\x04size\x18\x03 \x01(\x05\x12\r\n\x05level\x18\x04 \x01(\x05\"\xaa\x01\n\x19GetProductReviewsResponse\x12(\n\x06status\x18\x01 \x01(\x0b\x32\x18.ecommerce.common.Status\x12-\n\x07reviews\x18\x02 \x03(\x0b\x32\x1c.ecommerce.review.ReviewInfo\x12\x34\n\npagination\x18\x03 \x01(\x0b\x32 .ecommerce.review.PaginationInfo\"*\n\x15GetReviewStatsRequest\x12\x11\n\tproductId\x18\x01 \x01(\t\"p\n\x16GetReviewStatsResponse\x12(\n\x06status\x18\x01 \x01(\x0b\x32\x18.ecommerce.common.Status\x12,\n\x05stats\x18\x02 \x01(\x0b\x32\x1d.ecommerce.review.ReviewStats\"\xa1\x02\n\nReviewInfo\x12\n\n\x02id\x18\x01 \x01(\t\x12\x11\n\tproductId\x18\x02 \x01(\t\x12\x0e\n\x06userId\x18\x03 \x01(\t\x12(\n\x04user\x18\x04 \x01(\x0b\x32\x1a.ecommerce.review.UserInfo\x12\x0e\n\x06rating\x18\x05 \x01(\x01\x12\r\n\x05title\x18\x06 \x01(\t\x12\x0f\n\x07\x63ontent\x18\x07 \x01(\t\x12\x14\n\x0chelpfulVotes\x18\x08 \x01(\x05\x12\x18\n\x10verifiedPurchase\x18\t \x01(\x08\x12\x12\n\nreviewDate\x18\n \x01(\t\x12\x11\n\tsentiment\x18\x0b \x01(\t\x12\r\n\x05level\x18\x0c \x01(\x05\x12\x10\n\x08parentId\x18\r \x01(\t\x12\x12\n\nreplyCount\x18\x0e \x01(\x05\"v\n\x0bReviewStats\x12\x15\n\raverageRating\x18\x01 \x01(\x01\x12\x14\n\x0ctotalReviews\x18\x02 \x01(\x05\x12:\n\x0fratingBreakdown\x18\x03 \x01(\x0b\x32!.ecommerce.review.RatingBreakdown\"j\n\x0fRatingBreakdown\x12\x10\n\x08\x66iveStar\x18\x01 \x01(\x05\x12\x10\n\x08\x66ourStar\x18\x02 \x01(\x05\x12\x11\n\tthreeStar\x18\x03 \x01(\x05\x12\x0f\n\x07twoStar\x18\x04 \x01(\x05\x12\x0f\n\x07oneStar\x18\x05 \x01(\x05\"O\n\x0ePaginationInfo\x12\x0c\n\x04page\x18\x01 \x01(\x05\x12\x0c\n\x04size\x18\x02 \x01(\x05\x12\r\n\x05total\x18\x03 \x01(\x05\x12\x12\n\ntotalPages\x18\x04 \x01(\x05\"J\n\x08UserInfo\x12\n\n\x02id\x18\x01 \x01(\t\x12\x10\n\x08username\x18\x02 \x01(\t\x12\x10\n\x08\x66ullName\x18\x03 \x01(\t\x12\x0e\n\x06\x61vatar\x18\x04 \x01(\t2\xe2\x01\n\rReviewService\x12l\n\x11GetProductReviews\x12*.ecommerce.review.GetProductReviewsRequest\x1a+.ecommerce.review.GetProductReviewsResponse\x12\x63\n\x0eGetReviewStats\x12\'.ecommerce.review.GetReviewStatsRequest\x1a(.ecommerce.review.GetReviewStatsResponseb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'review_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  DESCRIPTOR._loaded_options = None
  _globals['_GETPRODUCTREVIEWSREQUEST']._serialized_start=48
  _globals['_GETPRODUCTREVIEWSREQUEST']._serialized_end=136
  _globals['_GETPRODUCTREVIEWSRESPONSE']._serialized_start=139
  _globals['_GETPRODUCTREVIEWSRESPONSE']._serialized_end=309
  _globals['_GETREVIEWSTATSREQUEST']._serialized_start=311
  _globals['_GETREVIEWSTATSREQUEST']._serialized_end=353
  _globals['_GETREVIEWSTATSRESPONSE']._serialized_start=355
  _globals['_GETREVIEWSTATSRESPONSE']._serialized_end=467
  _globals['_REVIEWINFO']._serialized_start=470
  _globals['_REVIEWINFO']._serialized_end=759
  _globals['_REVIEWSTATS']._serialized_start=761
  _globals['_REVIEWSTATS']._serialized_end=879
  _globals['_RATINGBREAKDOWN']._serialized_start=881
  _globals['_RATINGBREAKDOWN']._serialized_end=987
  _globals['_PAGINATIONINFO']._serialized_start=989
  _globals['_PAGINATIONINFO']._serialized_end=1068
  _globals['_USERINFO']._serialized_start=1070
  _globals['_USERINFO']._serialized_end=1144
  _globals['_REVIEWSERVICE']._serialized_start=1147
  _globals['_REVIEWSERVICE']._serialized_end=1373
# @@protoc_insertion_point(module_scope)
