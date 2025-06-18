from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    productId = Column(String(36), nullable=False, index=True)
    userId = Column(String(36), nullable=False, index=True)
    rating = Column(Float, nullable=False)
    title = Column(String(200))
    content = Column(Text)
    helpfulVotes = Column(Integer, default=0)
    verifiedPurchase = Column(Boolean, default=False)
    sentiment = Column(String(20))  # LIKE, NEUTRAL, DISLIKE
    level = Column(Integer, default=1)
    parentId = Column(String(36), ForeignKey('reviews.id'), nullable=True)
    reviewDate = Column(DateTime, default=datetime.now)
    createdAt = Column(DateTime, default=datetime.now)
    updatedAt = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Self-referential relationship for replies
    replies = relationship("Review", backref="parent", remote_side=[id])