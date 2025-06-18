import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    // Main layout routes
    layout("routes/layout.tsx", [
        index("routes/home.tsx"),
        route("about", "routes/about.tsx"),
        route("contact", "routes/contact.tsx"),
        route("category/:id", "routes/category.tsx"),
        route("product/:id", "routes/product.tsx"),
        route("cart", "routes/cart.tsx"),
        route("wishlist", "routes/wishlist.tsx"),
        route("search", "routes/search.tsx"),
        route("/checkout", "routes/checkout.tsx"),
        route("/order-success/:orderId", "routes/order-success.tsx"),
        route("/order/:orderId", "routes/order.tsx"),
        route("/orders", "routes/orders.tsx"),
    ]),

    // Admin
    ...prefix("admin", [
        layout("routes/admin/layout.tsx", [
            index("routes/admin/adminIndex.tsx"), // => /admin
            route("orders", "routes/admin/adminOrders.tsx") // => /admin/orders
        ])
    ]),

    // Auth layout routes
    layout("routes/auth/layout.tsx", [
        route("login", "routes/auth/login.tsx"),
        route("register", "routes/auth/register.tsx")
    ]),

    // Profile routes
    route("profile", "routes/profile.tsx"),

    // Well-known paths handler (không cần layout)
    route("/.well-known/*", "routes/well-known.tsx"),

    // 404 catch-all route (đặt cuối cùng)
    route("*", "routes/404.tsx"),

] satisfies RouteConfig;
