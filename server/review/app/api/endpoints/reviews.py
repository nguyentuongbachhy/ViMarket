from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import logging

from app.database import getDb
from app.api.dependencies import getCurrentUserId, getCurrentUserInfo
from app.services.reviewService import ReviewService
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from app.schemas.common import success_response, error_response, create_paged_response
from app.models.review import Review

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new review",
    description="Create a new product review"
)
async def createReview(
    reviewData: ReviewCreate,
    currentUserId: str = Depends(getCurrentUserId),
    db: Session = Depends(getDb)
):
    """Create a new review for a product"""
    try:
        reviewService = ReviewService(db)
        
        # Check if user has purchased the product
        hasPurchased = await reviewService.checkUserPurchase(currentUserId, reviewData.productId)
        if not hasPurchased:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must purchase this product before reviewing"
            )
        
        # Check if user has already reviewed this product
        existingReview = await reviewService.getUserReviewForProduct(currentUserId, reviewData.productId)
        if existingReview:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already reviewed this product"
            )
        
        review = await reviewService.createReview(reviewData, currentUserId)
        return success_response(data=review, message="Review created successfully")
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Create review error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{reviewId}", response_model=dict)
async def updateReview(
    reviewId: str,
    reviewData: ReviewUpdate,
    currentUserId: str = Depends(getCurrentUserId),
    db: Session = Depends(getDb)
):
    """Update an existing review"""
    try:
        reviewService = ReviewService(db)
        
        # Check if review exists and belongs to current user
        existingReview = await reviewService.getReviewById(reviewId)
        if not existingReview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        if existingReview["userId"] != currentUserId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own reviews"
            )
        
        # Check if user still has purchase (in case of refund)
        hasPurchased = await reviewService.checkUserPurchase(currentUserId, existingReview["productId"])
        if not hasPurchased:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You no longer have purchase rights for this product"
            )
        
        updatedReview = await reviewService.updateReview(reviewId, reviewData, currentUserId)
        return success_response(data=updatedReview, message="Review updated successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update review error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{reviewId}")
async def deleteReview(
    reviewId: str,
    currentUserId: str = Depends(getCurrentUserId),
    db: Session = Depends(getDb)
):
    """Delete a review"""
    try:
        logger.info(f"Attempting to delete review {reviewId} by user {currentUserId}")
        
        reviewService = ReviewService(db)
        
        # Check if review exists and belongs to current user
        existingReview = await reviewService.getReviewById(reviewId)
        logger.info(f"Found review: {existingReview}")
        
        if not existingReview:
            logger.warning(f"Review {reviewId} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        if existingReview["userId"] != currentUserId:
            logger.warning(f"User {currentUserId} trying to delete review owned by {existingReview['userId']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own reviews"
            )
        
        logger.info(f"Proceeding to delete review {reviewId}")
        result = await reviewService.deleteReview(reviewId, currentUserId)
        logger.info(f"Delete result: {result}")
        
        return success_response(message="Review deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting review {reviewId}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Internal server error: {str(e)}"
        )

@router.get(
    "/debug/jwt",
    response_model=dict,
    summary="Debug JWT claims",
    description="Debug endpoint to check JWT token claims"
)
async def debugJwt(
    currentUserInfo: dict = Depends(getCurrentUserInfo)
):
    """Debug JWT token claims"""
    return success_response(
        data=currentUserInfo,
        message="JWT claims retrieved successfully"
    )

@router.get(
    "/product/{productId}",
    response_model=dict,
    summary="Get product reviews",
    description="Get paginated reviews for a specific product"
)
async def getProductReviews(
    productId: str,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    level: int = Query(1, ge=1, description="Review level (1 for root reviews, 2+ for replies)"),
    sortBy: str = Query("createdAt", description="Sort field"),
    order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(getDb)
):
    """Get reviews for a specific product with pagination"""
    try:
        reviewService = ReviewService(db)
        result = await reviewService.getProductReviews(
            productId, page, size, level, sortBy, order
        )
        
        return create_paged_response(
            content=result["content"],
            page=result["page"],
            size=result["size"], 
            total_elements=result["totalElements"],
            message="Reviews retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Get product reviews error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch reviews"
        )

@router.get(
    "/product/{productId}/stats",
    response_model=dict,
    summary="Get product review statistics",
    description="Get review statistics for a specific product"
)
async def getProductReviewStats(
    productId: str,
    db: Session = Depends(getDb)
):
    """Get review statistics for a product"""
    try:
        reviewService = ReviewService(db)
        stats = reviewService.getReviewStats(productId)
        
        return success_response(
            data=stats,
            message="Review statistics retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Get review stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch review statistics"
        )

@router.get(
    "/{reviewId}/replies",
    response_model=dict,
    summary="Get review replies",
    description="Get paginated replies for a specific review"
)
async def getReviewReplies(
    reviewId: str,
    page: int = Query(0, ge=0, description="Page number (0-based)"),
    size: int = Query(10, ge=1, le=50, description="Page size"),
    db: Session = Depends(getDb)
):
    """Get replies for a specific review"""
    try:
        # Check if parent review exists
        parentReview = db.query(Review).filter(Review.id == reviewId).first()
        if not parentReview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        reviewService = ReviewService(db)
        result = await reviewService.getReviewReplies(reviewId, page, size)
        
        return create_paged_response(
            content=result["content"],
            page=result["page"],
            size=result["size"],
            total_elements=result["totalElements"],
            message="Review replies retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get review replies error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch review replies"
        )

@router.patch(
    "/{reviewId}/helpful",
    response_model=dict,
    summary="Mark review as helpful",
    description="Increment helpful vote count for a review"
)
async def markReviewHelpful(
    reviewId: str,
    currentUserId: str = Depends(getCurrentUserId),
    db: Session = Depends(getDb)
):
    """Mark a review as helpful"""
    try:
        review = db.query(Review).filter(Review.id == reviewId).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        review.helpfulVotes += 1
        db.commit()
        db.refresh(review)
        
        return success_response(
            data={"helpfulVotes": review.helpfulVotes},
            message="Review marked as helpful"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark review helpful error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark review as helpful"
        )