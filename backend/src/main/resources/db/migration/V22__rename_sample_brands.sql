-- Map legacy customer-specific brand codes to the generic sample catalog.
-- Needed only when enabling Flyway against an existing database.

UPDATE products SET brand = 'OAK' WHERE brand = 'DOGTAS';
UPDATE products SET brand = 'PINE' WHERE brand = 'LOVA';
UPDATE products SET brand = 'MAPLE' WHERE brand = 'KELEBEK';

UPDATE order_products SET brand = 'OAK' WHERE brand = 'DOGTAS';
UPDATE order_products SET brand = 'PINE' WHERE brand = 'LOVA';
UPDATE order_products SET brand = 'MAPLE' WHERE brand = 'KELEBEK';

UPDATE cross_conversions SET source_brand = 'OAK' WHERE source_brand = 'DOGTAS';
UPDATE cross_conversions SET source_brand = 'PINE' WHERE source_brand = 'LOVA';
UPDATE cross_conversions SET source_brand = 'MAPLE' WHERE source_brand = 'KELEBEK';

UPDATE cross_conversions SET target_brand = 'OAK' WHERE target_brand = 'DOGTAS';
UPDATE cross_conversions SET target_brand = 'PINE' WHERE target_brand = 'LOVA';
UPDATE cross_conversions SET target_brand = 'MAPLE' WHERE target_brand = 'KELEBEK';
