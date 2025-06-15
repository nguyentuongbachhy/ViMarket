from lg.state import ChatState

async def navigate_ui(state: ChatState) -> ChatState:
    """Set UI navigation based on context"""
    
    intent = state.get("last_intent")
    filters = state.get("filters", {})
    selected_product = state.get("selected_product")
    
    if intent == "search_product" and filters.get("query"):
        query = filters["query"]
        state["suggested_url"] = f"/search?q={query}"
    elif intent == "get_product_detail" and selected_product:
        state["suggested_url"] = f"/product/{selected_product['id']}"
    elif intent == "view_cart":
        state["suggested_url"] = "/cart"
        
    elif intent == "view_orders":
        state["suggested_url"] = "/orders"
        
    elif intent == "view_wishlist":
        state["suggested_url"] = "/wishlist"
    
    return state