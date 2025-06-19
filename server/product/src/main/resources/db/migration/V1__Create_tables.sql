-- V1__Create_tables.sql with UUID as primary key

CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100),
    country_of_origin VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sellers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    description TEXT,
    rating_average DECIMAL(3,2),
    review_count INT DEFAULT 0,
    inventory_status VARCHAR(50),
    all_time_quantity_sold INT DEFAULT 0,
    quantity_sold INT DEFAULT 0,
    brand_id VARCHAR(36),
    seller_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    parent_id VARCHAR(36),
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_categories (
    product_id VARCHAR(36),
    category_id VARCHAR(36),
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS images (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36),
    url VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS specifications (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36),
    spec_group VARCHAR(100),
    spec_name VARCHAR(100) NOT NULL,
    spec_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    rating DECIMAL(2,1) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    helpful_votes INT DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cải thiện index cho bảng products
CREATE INDEX IF NOT EXISTS idx_product_id ON products(id);
CREATE INDEX IF NOT EXISTS idx_product_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_product_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_rating ON products(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_quantity_sold ON products(all_time_quantity_sold DESC);
CREATE INDEX IF NOT EXISTS idx_product_price ON products(price);

-- Tối ưu index cho bảng images
CREATE INDEX IF NOT EXISTS idx_image_product_id ON images(product_id);
CREATE INDEX IF NOT EXISTS idx_image_product_position ON images(product_id, position);

-- Tối ưu index cho bảng product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Tối ưu index cho bảng brands
CREATE INDEX IF NOT EXISTS idx_brand_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brand_slug ON brands(slug);

-- Tối ưu index cho bảng specifications
CREATE INDEX IF NOT EXISTS idx_specification_product_id ON specifications(product_id);

-- Tối ưu index cho bảng reviews
CREATE INDEX IF NOT EXISTS idx_review_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_review_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_created_at ON reviews(created_at DESC);

-- Thêm index đặc biệt cho tìm kiếm
ALTER TABLE products ADD FULLTEXT INDEX IF NOT EXISTS idx_product_search (name, short_description, description);

-- Phân tích và tối ưu bảng
ANALYZE TABLE products, brands, images, product_categories, specifications, reviews;