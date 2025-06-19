from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings
import logging

security = HTTPBearer()
logger = logging.getLogger(__name__)

def getCurrentUserId(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        logger.info(f"Received token: {credentials.credentials[:20]}...")
        
        payload = jwt.decode(
            credentials.credentials,
            settings.jwtSecretKey,
            algorithms=[settings.jwtAlgorithm],
            issuer=settings.jwtIssuer,
            audience=settings.jwtAudience
        )
        
        # Use sub or nameid for user ID
        userId: str = payload.get("sub") or payload.get("nameid")
            
        if userId is None:
            logger.error("JWT payload missing user ID claim")
            logger.error(f"Available claims: {list(payload.keys())}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        logger.info(f"Authenticated user: {userId}")
        return userId
        
    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    except Exception as e:
        logger.error(f"Unexpected auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def getCurrentUserInfo(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get full user info from JWT token"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwtSecretKey,
            algorithms=[settings.jwtAlgorithm],
            issuer=settings.jwtIssuer,
            audience=settings.jwtAudience
        )
        
        userId = payload.get("sub") or payload.get("nameid")
        username = payload.get("unique_name") or "unknown"
        
        # Handle role as string or array
        roles = []
        roleClaim = payload.get("role")
        if roleClaim:
            if isinstance(roleClaim, list):
                roles = roleClaim
            else:
                roles = [roleClaim]
        
        userInfo = {
            "userId": userId,
            "username": username,
            "roles": roles,
            "issuer": payload.get("iss"),
            "audience": payload.get("aud")
        }
        
        if not userInfo["userId"]:
            logger.error("JWT payload missing user ID claim")
            logger.error(f"Available claims: {list(payload.keys())}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
            
        return userInfo
        
    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def requireRole(requiredRole: str):
    """Dependency to check role"""
    def roleChecker(userInfo: dict = Depends(getCurrentUserInfo)) -> dict:
        if requiredRole not in userInfo.get("roles", []):
            logger.warning(f"Insufficient permissions. Required: {requiredRole}, User roles: {userInfo.get('roles')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return userInfo
    return roleChecker