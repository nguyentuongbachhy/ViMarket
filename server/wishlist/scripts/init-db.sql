-- scripts/init-db.sql
\c wishlist_db;

CREATE USER wishlist_user WITH PASSWORD 'spring';
GRANT ALL PRIVILEGES ON DATABASE wishlist_db TO wishlist_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE wishlist_db TO wishlist_user;
GRANT ALL ON SCHEMA public TO wishlist_user;