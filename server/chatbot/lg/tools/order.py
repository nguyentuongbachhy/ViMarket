import httpx
from typing import Dict, Any

class OrderTools:
    base_url = "http://localhost:8004"

    @staticmethod
    async def get_user_orders(token: str, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get user orders"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            params = {"limit": limit, "offset": offset}
            response = await client.get(f"{OrderTools.base_url}/api/v1/orders/user", headers=headers, params=params)
            return response.json()

    @staticmethod
    async def get_order_detail(token: str, order_id: str) -> Dict[str, Any]:
        """Get order detail"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(f"{OrderTools.base_url}/api/v1/orders/{order_id}", headers=headers)
            return response.json()

    @staticmethod
    async def create_order_from_cart(token: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create order from cart"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(f"{OrderTools.base_url}/api/v1/orders/from-cart", headers=headers, json=order_data)
            return response.json()

    @staticmethod
    async def cancel_order(token: str, order_id: str) -> Dict[str, Any]:
        """Cancel order"""
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(f"{OrderTools.base_url}/api/v1/orders/{order_id}/cancel", headers=headers)
            return response.json()