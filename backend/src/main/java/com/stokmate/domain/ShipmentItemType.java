package com.stokmate.domain;

/**
 * Enum to distinguish between order products and sale products in shipment
 * items
 */
public enum ShipmentItemType {
    ORDER_PRODUCT, // Shipment item references an OrderProduct
    SALE_PRODUCT // Shipment item references a SaleProduct
}
