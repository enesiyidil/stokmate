-- Add brand column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(50);

-- Add brand column to order_products table
ALTER TABLE order_products ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
