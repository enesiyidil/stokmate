import axiosInstance from './axiosInstance';

export interface CartItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    internetSalesPrice?: number;
}

export interface CartItemResponse {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    totalAmount: number;
    internetSalesPrice?: number;
}

export interface CartResponse {
    id: string;
    creatorId: string;
    creatorName: string;
    items: CartItemResponse[];
    totalAmount: number;
    createdDate: string;
    status: 'ACTIVE' | 'CONVERTED_TO_ORDER' | 'ABANDONED';
}

export const cartApi = {
    getCurrentCart: async (): Promise<CartResponse> => {
        const response = await axiosInstance.get('/cart/current');
        return response.data;
    },

    getCart: async (cartId: string): Promise<CartResponse> => {
        const response = await axiosInstance.get(`/cart/${cartId}`);
        return response.data;
    },

    addToCart: async (cartId: string, item: CartItemRequest): Promise<CartItemResponse> => {
        const response = await axiosInstance.post(`/cart/${cartId}/items`, item);
        return response.data;
    },

    removeFromCart: async (cartId: string, itemId: string): Promise<void> => {
        await axiosInstance.delete(`/cart/${cartId}/items/${itemId}`);
    },

    checkout: async (cartId: string, formData: FormData): Promise<string> => {
        const response = await axiosInstance.post(`/cart/${cartId}/checkout`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
