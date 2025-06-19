from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReviewCreate(BaseModel):
    productId: str
    rating: float = Field(..., ge=1, le=5)
    title: Optional[str] = None
    content: Optional[str] = None
    verifiedPurchase: bool = False
    level: Optional[int] = 1
    parentId: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    content: Optional[str] = None

class UserInfo(BaseModel):
    id: str
    username: str
    fullName: str
    email: Optional[str] = None
    role: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    productId: str
    userId: str
    user: Optional[UserInfo] = None
    rating: float
    title: Optional[str]
    content: Optional[str]
    helpfulVotes: int
    verifiedPurchase: bool
    sentiment: Optional[str]
    level: int
    parentId: Optional[str]
    replyCount: int = 0
    reviewDate: datetime
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

class ReviewStats(BaseModel):
    averageRating: float
    totalReviews: int
    ratingBreakdown: Dict[str, int]

class PaginationResponse(BaseModel):
    page: int
    size: int
    total: int
    totalPages: int
    last: bool