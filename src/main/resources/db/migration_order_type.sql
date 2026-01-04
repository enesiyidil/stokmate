-- Migration Script for Order Type Column
-- This script safely adds the order_type column and sets default values

-- Step 1: Add column as nullable first (if it doesn't exist)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(255);

-- Step 2: Update all NULL values to 'NORMAL' (default value)
UPDATE orders SET order_type = 'NORMAL' WHERE order_type IS NULL;

-- Step 3: Add NOT NULL constraint (optional, can be done later in Java entity)
-- ALTER TABLE orders ALTER COLUMN order_type SET NOT NULL;

-- Step 4: Add check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('NORMAL', 'OZEL'));

-- Verify the migration
SELECT COUNT(*) as total_orders, order_type FROM orders GROUP BY order_type;
