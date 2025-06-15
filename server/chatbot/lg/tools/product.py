import httpx
from typing import Dict, Any

class ProductTools:
    base_url = "http://localhost:8082"

    @staticmethod
    async def search_products(filters: Dict[str, Any]) -> Dict[str, Any]:
        """Search products with filters"""
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            params = {}
            if filters.get("query"):
                params["q"] = filters["query"]
            if filters.get("minPrice"):
                params["minPrice"] = filters["minPrice"]
            if filters.get("maxPrice"):
                params["maxPrice"] = filters["maxPrice"]
            if filters.get("brandIds"):
                params["brandIds"] = filters["brandIds"]
            if filters.get("categoryIds"):
                params["categoryIds"] = filters["categoryIds"]
            
            response = await client.get(f"{ProductTools.base_url}/api/v1/products", params=params)
            return response.json()

    @staticmethod
    async def get_product_detail(product_id: str) -> Dict[str, Any]:
        """Get product detail by ID"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/products/{product_id}")
            return response.json()

    @staticmethod
    async def get_top_rated() -> Dict[str, Any]:
        """Get top rated products"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/products/top-rated")
            return response.json()

    @staticmethod
    async def get_top_selling() -> Dict[str, Any]:
        """Get top selling products"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/products/top-selling")
            return response.json()

    @staticmethod
    async def get_new_arrivals() -> Dict[str, Any]:
        """Get new arrival products"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/products/new-arrivals")
            return response.json()

    @staticmethod
    async def get_brands() -> Dict[str, Any]:
        """Get all brands"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/brands")
            return response.json()

    @staticmethod
    async def get_categories() -> Dict[str, Any]:
        """Get all categories"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ProductTools.base_url}/api/v1/categories")
            return response.json()