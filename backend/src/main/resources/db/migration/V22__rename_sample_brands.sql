-- Map legacy customer-specific brand codes to the generic sample catalog.
-- Needed only when enabling Flyway against an existing database.

UPDATE products SET brand = 'OAK' WHERE brand = 'OAK';
UPDATE products SET brand = 'PINE' WHERE brand = 'PINE';
UPDATE products SET brand = 'MAPLE' WHERE brand = 'MAPLE';

UPDATE order_products SET brand = 'OAK' WHERE brand = 'OAK';
UPDATE order_products SET brand = 'PINE' WHERE brand = 'PINE';
UPDATE order_products SET brand = 'MAPLE' WHERE brand = 'MAPLE';

UPDATE cross_conversions SET source_brand = 'OAK' WHERE source_brand = 'OAK';
UPDATE cross_conversions SET source_brand = 'PINE' WHERE source_brand = 'PINE';
UPDATE cross_conversions SET source_brand = 'MAPLE' WHERE source_brand = 'MAPLE';

UPDATE cross_conversions SET target_brand = 'OAK' WHERE target_brand = 'OAK';
UPDATE cross_conversions SET target_brand = 'PINE' WHERE target_brand = 'PINE';
UPDATE cross_conversions SET target_brand = 'MAPLE' WHERE target_brand = 'MAPLE';
