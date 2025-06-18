"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannel = exports.NotificationPriority = exports.NotificationEventType = void 0;
var NotificationEventType;
(function (NotificationEventType) {
    NotificationEventType["WISHLIST_PRODUCT_PRICE_CHANGED"] = "wishlist.product.price.changed";
    NotificationEventType["WISHLIST_PRODUCT_RESTOCKED"] = "wishlist.product.restocked";
    NotificationEventType["CART_ITEM_LOW_STOCK"] = "cart.item.low.stock";
    NotificationEventType["CART_ABANDONED"] = "cart.abandoned";
    NotificationEventType["INVENTORY_LOW_STOCK"] = "inventory.low.stock";
    NotificationEventType["PRODUCT_BACK_IN_STOCK"] = "product.back.in.stock";
})(NotificationEventType || (exports.NotificationEventType = NotificationEventType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["NORMAL"] = "normal";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["URGENT"] = "urgent";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
//# sourceMappingURL=index.js.map