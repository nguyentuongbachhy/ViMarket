from pydantic import BaseModel
from typing import Any, List, Optional, Generic, TypeVar
from enum import Enum

T = TypeVar('T')

class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"

class PageMeta(BaseModel):
    page: int
    size: int
    totalElements: int
    totalPages: int
    last: bool

def success_response(
    data: Any = None, 
    message: Optional[str] = None,
    meta: Optional[PageMeta] = None
) -> dict:
    response = {
        "status": ResponseStatus.SUCCESS,
        "data": data
    }
    if message:
        response["message"] = message
    if meta:
        response["meta"] = meta.dict()
    return response

def error_response(
    message: str = "Error occurred",
    details: Optional[dict] = None
) -> dict:
    return {
        "status": ResponseStatus.ERROR,
        "message": message,
        "details": details
    }

def create_paged_response(
    content: List[Any],
    page: int,
    size: int,
    total_elements: int,
    message: Optional[str] = None
) -> dict:
    """Create paginated response matching frontend expectations"""
    total_pages = (total_elements + size - 1) // size if size > 0 else 0
    is_last = page >= total_pages - 1 if total_pages > 0 else True
    
    meta = PageMeta(
        page=page,
        size=size,
        totalElements=total_elements,
        totalPages=total_pages,
        last=is_last
    )
    
    return success_response(
        data=content,
        message=message,
        meta=meta
    )