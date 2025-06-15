from lg.state import ChatState
from lg.tools.product import ProductTools

async def search_products(state: ChatState) -> ChatState:
    """Search products based on filters"""
    intent = state.get("last_intent")
    filters = state.get("filters", {}).copy()

    new_state = {**state}
    
    try:
        if intent == "search_product":
            # Process brand filter
            if filters.get("brand"):
                brands_response = await ProductTools.get_brands()
                if brands_response.get("status") == "success":
                    brands = brands_response["data"]
                    brand_id = next((b["id"] for b in brands if b["name"].lower() == filters["brand"].lower()), None)
                    if brand_id:
                        filters["brandIds"] = [brand_id]
                        del filters["brand"]
            
            # Process category filter
            if filters.get("category"):
                categories_response = await ProductTools.get_categories()
                if categories_response.get("status") == "success":
                    categories = categories_response["data"]
                    category_id = next((c["id"] for c in categories if c["name"].lower() == filters["category"].lower()), None)
                    if category_id:
                        filters["categoryIds"] = [category_id]
                        del filters["category"]
            
            
            # Search products
            result = await ProductTools.search_products(filters)
            
            if result.get("status") == "error":
                if "timeout" in result.get("message", "").lower():
                    result["user_message"] = "Hệ thống đang bận, vui lòng thử lại sau vài giây."
                elif "connect" in result.get("message", "").lower():
                    result["user_message"] = "Không thể kết nối đến dịch vụ tìm kiếm. Vui lòng thử lại."
                else:
                    result["user_message"] = "Có lỗi xảy ra khi tìm kiếm. Vui lòng thử từ khóa khác."
            
            new_state["search_results"] = result
            
        elif intent in ["get_top_rated", "top_rated"]:
            result = await ProductTools.get_top_rated()
            new_state["search_results"] = result
            
        elif intent in ["get_top_selling", "top_selling"]:
            result = await ProductTools.get_top_selling()
            new_state["search_results"] = result
            
        elif intent in ["get_new_arrivals", "new_arrivals"]:
            result = await ProductTools.get_new_arrivals()
            new_state["search_results"] = result
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        new_state["search_results"] = {
            "status": "error", 
            "message": str(e),
            "user_message": "Có lỗi hệ thống. Vui lòng thử lại sau."
        }
    
    return new_state