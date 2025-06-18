from app.proto import review_pb2, review_pb2_grpc, common_pb2
from app.services.reviewService import ReviewService
import logging
from app.database import getDb

class ReviewGrpcService(review_pb2_grpc.ReviewServiceServicer):
    
    async def GetProductReviews(self, request):
        db = getDb()
        try:
            service = ReviewService(db)
            result = await service.getProductReviews(
                productId=request.productId,
                page=request.page if request.page > 0 else 1,
                size=request.size if request.size > 0 else 20,
                level=request.level if request.level > 0 else 1
            )
            
            response = review_pb2.GetProductReviewsResponse()
            response.status.code = common_pb2.Status.OK
            
            # Add reviews
            for reviewData in result["reviews"]:
                reviewInfo = review_pb2.ReviewInfo()
                reviewInfo.id = reviewData.id
                reviewInfo.productId = reviewData.productId
                reviewInfo.userId = reviewData.userId
                reviewInfo.rating = reviewData.rating
                reviewInfo.title = reviewData.title or ""
                reviewInfo.content = reviewData.content or ""
                reviewInfo.helpfulVotes = reviewData.helpfulVotes
                reviewInfo.verifiedPurchase = reviewData.verifiedPurchase
                reviewInfo.reviewDate = reviewData.reviewDate
                reviewInfo.sentiment = reviewData.sentiment or ""
                reviewInfo.level = reviewData.level
                reviewInfo.parentId = reviewData.parentId or ""
                reviewInfo.replyCount = reviewData.replyCount
                
                # Add user info if available
                if reviewData.user:
                    userInfo = review_pb2.UserInfo()
                    userInfo.id = reviewData.user["id"]
                    userInfo.username = reviewData.user["username"]
                    userInfo.fullName = reviewData.user["fullName"]
                    userInfo.avatar = ""
                    reviewInfo.user.CopyFrom(userInfo)
                
                response.reviews.append(reviewInfo)
            
            # Add pagination
            pagination = review_pb2.PaginationInfo()
            pagination.page = result["pagination"]["page"]
            pagination.size = result["pagination"]["size"]
            pagination.total = result["pagination"]["total"]
            pagination.totalPages = result["pagination"]["totalPages"]
            response.pagination.CopyFrom(pagination)
            
            return response
            
        except Exception as e:
            logging.error(f"GetProductReviews error: {e}")
            response = review_pb2.GetProductReviewsResponse()
            response.status.code = common_pb2.Status.ERROR
            response.status.message = str(e)
            return response
        finally:
            db.close()
    
    async def GetReviewStats(self, request):
        db = getDb()
        try:
            service = ReviewService(db)
            stats = service.getReviewStats(request.productId)
            
            response = review_pb2.GetReviewStatsResponse()
            response.status.code = common_pb2.Status.OK
            
            # Create stats
            reviewStats = review_pb2.ReviewStats()
            reviewStats.averageRating = stats.averageRating
            reviewStats.totalReviews = stats.totalReviews
            
            # Rating breakdown
            breakdown = review_pb2.RatingBreakdown()
            breakdown.fiveStar = stats.ratingBreakdown["fiveStar"]
            breakdown.fourStar = stats.ratingBreakdown["fourStar"]
            breakdown.threeStar = stats.ratingBreakdown["threeStar"]
            breakdown.twoStar = stats.ratingBreakdown["twoStar"]
            breakdown.oneStar = stats.ratingBreakdown["oneStar"]
            
            reviewStats.ratingBreakdown.CopyFrom(breakdown)
            response.stats.CopyFrom(reviewStats)
            
            return response
            
        except Exception as e:
            logging.error(f"GetReviewStats error: {e}")
            response = review_pb2.GetReviewStatsResponse()
            response.status.code = common_pb2.Status.ERROR
            response.status.message = str(e)
            return response
        finally:
            db.close()