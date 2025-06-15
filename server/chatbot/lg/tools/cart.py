import httpx
from typing import Dict, Any

class CartTools:
    base_url = "http://localhost:8002"

    @staticmethod
    async def get_cart(token: str) -> Dict[str, Any]:
        """Get user cart"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(f"{CartTools.base_url}/api/v1/cart/", headers=headers)
            return response.json()

    @staticmethod
    async def add_to_cart(token: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """Add product to cart"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            data = {"productId": product_id, "quantity": quantity}
            response = await client.post(f"{CartTools.base_url}/api/v1/cart/items", headers=headers, json=data)
            return response.json()

    @staticmethod
    async def remove_from_cart(token: str, product_id: str) -> Dict[str, Any]:
        """Remove product from cart"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.delete(f"{CartTools.base_url}/api/v1/cart/items/{product_id}", headers=headers)
            return response.json()

    @staticmethod
    async def clear_cart(token: str) -> Dict[str, Any]:
        """Clear cart"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.delete(f"{CartTools.base_url}/api/v1/cart/", headers=headers)
            return response.json()

    @staticmethod
    async def prepare_checkout(token: str) -> Dict[str, Any]:
        """Prepare cart for checkout"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(f"{CartTools.base_url}/api/v1/cart/checkout/prepare", headers=headers)
            return response.json()