-- Migration untuk menambahkan shipped_quantity ke sale_products
-- Dan memperbaiki shipment_items untuk mendukung sale products

-- 1. Tambahkan shipped_quantity ke sale_products
ALTER TABLE sale_products 
ADD COLUMN shipped_quantity DECIMAL(19,2) DEFAULT 0;

-- 2. Update shipment_items untuk mendukung sale products
ALTER TABLE shipment_items 
ADD COLUMN item_type VARCHAR(20) DEFAULT 'ORDER_PRODUCT',
ADD COLUMN sale_product_id UUID;

-- 3. Ubah order_product_id menjadi nullable
ALTER TABLE shipment_items 
ALTER COLUMN order_product_id DROP NOT NULL;

-- 4. Tambahkan foreign key untuk sale products
ALTER TABLE shipment_items 
ADD CONSTRAINT fk_shipment_item_sale_product 
FOREIGN KEY (sale_product_id) REFERENCES sale_products(id);

-- 5. Buat index untuk performa
CREATE INDEX idx_shipment_items_sale_product ON shipment_items(sale_product_id);
CREATE INDEX idx_sale_products_shipped_qty ON sale_products(shipped_quantity);
