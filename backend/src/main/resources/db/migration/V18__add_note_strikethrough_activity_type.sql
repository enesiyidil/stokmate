-- Add NOTE_STRIKETHROUGH to order_activities check constraint
ALTER TABLE order_activities DROP CONSTRAINT IF EXISTS order_activities_activity_type_check;

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
    'NOTE_STRIKETHROUGH',
    'ORDER_UPDATED',
    'SHIPMENT_APPROVED'
));
