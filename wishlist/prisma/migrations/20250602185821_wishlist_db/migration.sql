-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_name" TEXT,
    "product_price" DECIMAL(10,2),
    "category_id" TEXT,
    "brand_id" TEXT,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlists_product_id_idx" ON "wishlists"("product_id");

-- CreateIndex
CREATE INDEX "wishlists_created_at_idx" ON "wishlists"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_product_id_key" ON "wishlists"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "wishlist_events_user_id_idx" ON "wishlist_events"("user_id");

-- CreateIndex
CREATE INDEX "wishlist_events_action_idx" ON "wishlist_events"("action");

-- CreateIndex
CREATE INDEX "wishlist_events_created_at_idx" ON "wishlist_events"("created_at");
