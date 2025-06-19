from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc, func
from typing import Optional, Dict, Any, List
import logging
import httpx
import os
from datetime import datetime

from app.models.review import Review
from app.services.userService import userServiceClient
from app.services.sentimentService import sentimentService
from app.schemas.review import ReviewCreate, ReviewUpdate, UserInfo

logger = logging.getLogger(__name__)

class ReviewService:
    def __init__(self, db: Session):
        self.db = db
    
    async def createReview(self, reviewData: ReviewCreate, userId: str) -> Dict[str, Any]:
        """Create a new review"""
        try:
            # Check if user already reviewed this product (if level is 1)
            if reviewData.level == 1:
                existing_review = self.db.query(Review).filter(
                    and_(
                        Review.productId == reviewData.productId,
                        Review.userId == userId,
                        Review.level == 1
                    )
                ).first()
                
                if existing_review:
                    raise ValueError("User has already reviewed this product")
            
            # Validate parent review exists for replies
            if reviewData.parentId:
                parent_review = self.db.query(Review).filter(Review.id == reviewData.parentId).first()
                if not parent_review:
                    raise ValueError("Parent review not found")
            
            # Analyze sentiment
            sentiment = await sentimentService.analyzeSentiment(reviewData.content or "")

            # Create review
            dbReview = Review(
                productId=reviewData.productId,
                userId=userId,
                rating=reviewData.rating,
                title=reviewData.title,
                content=reviewData.content,
                verifiedPurchase=reviewData.verifiedPurchase,
                sentiment=sentiment,
                level=reviewData.level or 1,
                parentId=reviewData.parentId
            )

            self.db.add(dbReview)
            self.db.commit()
            self.db.refresh(dbReview)

            return await self._formatReviewResponse(dbReview)
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    async def updateReview(self, reviewId: str, reviewData: ReviewUpdate, userId: str) -> Dict[str, Any]:
        """Update an existing review"""
        try:
            review = self.db.query(Review).filter(
                and_(Review.id == reviewId, Review.userId == userId)
            ).first()
            
            if not review:
                raise ValueError("Review not found or unauthorized")
            
            # Update fields if provided
            if reviewData.rating is not None:
                review.rating = reviewData.rating
            if reviewData.title is not None:
                review.title = reviewData.title
            if reviewData.content is not None:
                review.content = reviewData.content
                # Re-analyze sentiment if content changed
                review.sentiment = await sentimentService.analyzeSentiment(reviewData.content)
            
            review.updatedAt = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(review)
            
            return await self._formatReviewResponse(review)
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    async def deleteReview(self, reviewId: str, userId: str) -> bool:
        """Delete a review and all its replies"""
        try:
            logger.info(f"Starting delete process for review {reviewId} by user {userId}")
            
            # Find the review
            review = self.db.query(Review).filter(
                and_(Review.id == reviewId, Review.userId == userId)
            ).first()
            
            if not review:
                logger.warning(f"Review {reviewId} not found for user {userId}")
                raise ValueError("Review not found or unauthorized")
            
            logger.info(f"Found review: {review.id}, level: {review.level}")
            
            # If this is a main review (level 1), delete all replies first
            if review.level == 1:
                replies = self.db.query(Review).filter(Review.parentId == reviewId).all()
                logger.info(f"Found {len(replies)} replies to delete")
                
                for reply in replies:
                    logger.info(f"Deleting reply: {reply.id}")
                    self.db.delete(reply)
            
            # Delete the main review
            logger.info(f"Deleting main review: {reviewId}")
            self.db.delete(review)
            
            # Commit the transaction
            self.db.commit()
            logger.info(f"Successfully deleted review {reviewId} and its replies")
            return True
            
        except Exception as e:
            logger.error(f"Error in deleteReview: {str(e)}", exc_info=True)
            self.db.rollback()
            raise e
    
    async def getReviewById(self, reviewId: str) -> Optional[Dict[str, Any]]:
        """Get review by ID"""
        try:
            logger.info(f"Fetching review by ID: {reviewId}")
            review = self.db.query(Review).filter(Review.id == reviewId).first()
            
            if review:
                logger.info(f"Found review: {review.id}, userId: {review.userId}")
                return await self._formatReviewResponse(review)
            else:
                logger.warning(f"No review found with ID: {reviewId}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching review {reviewId}: {str(e)}", exc_info=True)
            raise e
    
    async def checkUserPurchase(self, userId: str, productId: str) -> bool:
        """Check if user has purchased the product via order service"""
        try:
            orderServiceUrl = os.getenv("ORDER_SERVICE_URL", "http://localhost:8004")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{orderServiceUrl}/api/v1/orders/check-purchase/{productId}",
                    headers={"X-User-ID": userId},
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", {}).get("hasPurchased", False)
                else:
                    # If order service is down, allow review creation for now
                    logger.warning(f"Order service returned {response.status_code}, allowing review")
                    return True
                    
        except Exception as e:
            logger.error(f"Error checking user purchase: {e}")
            # If order service is down, allow review creation
            return True
    
    async def getUserReviewForProduct(self, userId: str, productId: str) -> Optional[Review]:
        """Get user's review for a specific product"""
        try:
            review = self.db.query(Review).filter(
                and_(
                    Review.userId == userId,
                    Review.productId == productId,
                    Review.level == 1
                )
            ).first()
            return review
        except Exception as e:
            logger.error(f"Error getting user review: {e}")
            return None
    
    async def getProductReviews(
        self,
        productId: str,
        page: int = 0,
        size: int = 20,
        level: int = 1,
        sortBy: str = "createdAt",
        order: str = "desc"
    ) -> Dict[str, Any]:
        """Get paginated reviews for a product"""
        try:
            offset = page * size

            # Build query
            query = self.db.query(Review).filter(
                and_(
                    Review.productId == productId,
                    Review.level == level
                )
            )

            # Apply sorting
            sortColumn = getattr(Review, sortBy, Review.createdAt)
            if order == "desc":
                query = query.order_by(desc(sortColumn))
            else:
                query = query.order_by(asc(sortColumn))

            # Get total count
            totalElements = query.count()
            
            # Get paginated results
            reviews = query.offset(offset).limit(size).all()

            # Format reviews with user info
            formattedReviews = []
            userIds = [review.userId for review in reviews]
            usersInfo = await userServiceClient.getUsers(userIds) if userIds else {}

            for review in reviews:
                replyCount = self.db.query(Review).filter(Review.parentId == review.id).count()
                userInfo = usersInfo.get(review.userId)
                
                formattedReview = await self._formatReviewResponse(review, userInfo, replyCount)
                formattedReviews.append(formattedReview)

            totalPages = (totalElements + size - 1) // size if size > 0 else 0
            isLast = page >= (totalPages - 1) if totalPages > 0 else True

            return {
                "content": formattedReviews,
                "page": page,
                "size": size,
                "totalElements": totalElements,
                "totalPages": totalPages,
                "last": isLast
            }
            
        except Exception as e:
            logger.error(f"Error getting product reviews: {e}")
            raise e
    
    async def getReviewReplies(
        self,
        parentId: str,
        page: int = 0,
        size: int = 10
    ) -> Dict[str, Any]:
        """Get paginated replies for a review"""
        try:
            offset = page * size

            query = self.db.query(Review).filter(Review.parentId == parentId)
            query = query.order_by(asc(Review.createdAt))
            
            totalElements = query.count()
            replies = query.offset(offset).limit(size).all()

            # Format replies with user info
            formattedReplies = []
            userIds = [reply.userId for reply in replies]
            usersInfo = await userServiceClient.getUsers(userIds) if userIds else {}

            for reply in replies:
                userInfo = usersInfo.get(reply.userId)
                formattedReply = await self._formatReviewResponse(reply, userInfo)
                formattedReplies.append(formattedReply)

            totalPages = (totalElements + size - 1) // size if size > 0 else 0
            isLast = page >= (totalPages - 1) if totalPages > 0 else True

            return {
                "content": formattedReplies,
                "page": page,
                "size": size,
                "totalElements": totalElements,
                "totalPages": totalPages,
                "last": isLast
            }
            
        except Exception as e:
            logger.error(f"Error getting review replies: {e}")
            raise e
    
    def getReviewStats(self, productId: str) -> Dict[str, Any]:
        """Get review statistics for a product"""
        try:
            reviews = self.db.query(Review).filter(
                and_(Review.productId == productId, Review.level == 1)
            ).all()

            if not reviews:
                return {
                    "averageRating": 0.0,
                    "totalReviews": 0,
                    "ratingBreakdown": {
                        "fiveStar": 0,
                        "fourStar": 0,
                        "threeStar": 0,
                        "twoStar": 0,
                        "oneStar": 0
                    }
                }
            
            totalReviews = len(reviews)
            averageRating = sum(review.rating for review in reviews) / totalReviews

            ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for review in reviews:
                ratingKey = int(review.rating)
                if ratingKey in ratingCounts:
                    ratingCounts[ratingKey] += 1

            return {
                "averageRating": round(averageRating, 1),
                "totalReviews": totalReviews,
                "ratingBreakdown": {
                    "oneStar": ratingCounts[1],
                    "twoStar": ratingCounts[2],
                    "threeStar": ratingCounts[3],
                    "fourStar": ratingCounts[4],
                    "fiveStar": ratingCounts[5]
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting review stats: {e}")
            raise e
    
    async def _formatReviewResponse(
        self,
        review: Review,
        userInfo: Optional[Dict] = None,
        replyCount: int = 0
    ) -> Dict[str, Any]:
        """Format review data for API response"""
        try:
            if userInfo is None and review.userId:
                userInfo = await userServiceClient.getUser(review.userId)
            
            return {
                "id": review.id,
                "productId": review.productId,
                "userId": review.userId,
                "user": userInfo,
                "rating": review.rating,
                "title": review.title,
                "content": review.content,
                "helpfulVotes": review.helpfulVotes,
                "verifiedPurchase": review.verifiedPurchase,
                "sentiment": review.sentiment,
                "level": review.level,
                "parentId": review.parentId,
                "replyCount": replyCount,
                "reviewDate": review.reviewDate.isoformat() if review.reviewDate else None,
                "createdAt": review.createdAt.isoformat() if review.createdAt else None,
                "updatedAt": review.updatedAt.isoformat() if review.updatedAt else None
            }
            
        except Exception as e:
            logger.error(f"Error formatting review response: {e}")
            raise e