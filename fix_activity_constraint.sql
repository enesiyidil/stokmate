-- Manual fix for order_activities_activity_type_check constraint
-- Run this SQL script directly in your PostgreSQL database

-- Step 1: Drop the existing constraint
ALTER TABLE order_activities DROP CONSTRAINT IF EXISTS order_activities_activity_type_check;

-- Step 2: Add the updated constraint with all activity types
ALTER TABLE order_activities ADD CONSTRAINT order_activities_activity_type_check 
CHECK (activity_type IN (
    'CREATED',
    'COMPLETED',
    'CANCELLED',
    'INVOICE_UPLOADED',
    'INVOICE_DELETED',
    'PRODUCTS_ACCEPTED',
    'PRODUCT_ACCEPTED',
    'SHIPMENT_CREATED',
    'SHIPMENT_UPDATED',
    'NOTE_ADDED',
    'ORDER_UPDATED',
    'SHIPMENT_APPROVED'
));
