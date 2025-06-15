import httpx
from typing import Dict, Any

class WishlistTools:
    base_url = "http://localhost:8084"

    @staticmethod
    async def get_wishlist(token: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get user wishlist"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            params = {"page": page, "limit": limit}
            response = await client.get(f"{WishlistTools.base_url}/api/v1/wishlist", headers=headers, params=params)
            return response.json()

    @staticmethod
    async def add_to_wishlist(token: str, product_id: str) -> Dict[str, Any]:
        """Add product to wishlist"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            data = {"productId": product_id}
            response = await client.post(f"{WishlistTools.base_url}/api/v1/wishlist", headers=headers, json=data)
            return response.json()

    @staticmethod
    async def remove_from_wishlist(token: str, product_id: str) -> Dict[str, Any]:
        """Remove product from wishlist"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.delete(f"{WishlistTools.base_url}/api/v1/wishlist/{product_id}", headers=headers)
            return response.json()