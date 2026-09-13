import { api } from '../api/base.api'

export interface ProductRequest {
    name: string
    code: string
    description?: string
    brand?: string
    activeForSale: boolean
    stockQuantity: number
    vatRate: number
    unitPrice: number
    minStockLevel?: number
    keywords?: string[]
}

export interface ProductResponse {
    id: string
    name: string
    code: string
    description?: string
    brand?: string
    imageUrl?: string
    activeForSale: boolean
    stockQuantity: number
    cancelledStockQuantity?: number
    vatRate: number
    unitPrice: number
    internetSalesPrice?: number
    minStockLevel?: number
    keywords?: string[]
    createdAt: string
    updatedAt: string
    createdBy: string
}

export interface ProductListParams {
    search?: string
    brand?: string
    activeForSale?: boolean
    stockFilter?: string
    page?: number
    size?: number
}

import type { PageResponse } from '../types/common';

const productApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query<PageResponse<ProductResponse>, ProductListParams>({
            query: (params) => ({
                url: '/products',
                params: {
                    ...params,
                    page: params.page || 0,
                    size: params.size || 50
                }
            }),
            providesTags: ['Product']
        }),

        getProduct: builder.query<ProductResponse, string>({
            query: (id) => `/products/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Product', id }]
        }),

        searchProducts: builder.query<PageResponse<ProductResponse>, { q: string; page?: number; size?: number }>({
            query: ({ q, page = 0, size = 20 }) => ({
                url: '/products/search',
                params: { q, page, size }
            }),
            providesTags: ['Product']
        }),

        createProduct: builder.mutation<ProductResponse, ProductRequest>({
            query: (data) => ({
                url: '/products',
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Product']
        }),

        updateProduct: builder.mutation<ProductResponse, { id: string; data: ProductRequest }>({
            query: ({ id, data }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product']
        }),

        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Product']
        }),

        createProductsBatch: builder.mutation<ProductResponse[], ProductRequest[]>({
            query: (products) => ({
                url: '/products/batch',
                method: 'POST',
                body: products
            }),
            invalidatesTags: ['Product']
        }),

        uploadProductImage: builder.mutation<ProductResponse, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData()
                formData.append('file', file)
                return {
                    url: `/products/${id}/image`,
                    method: 'POST',
                    body: formData
                }
            },
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product']
        }),

        deleteProductImage: builder.mutation<ProductResponse, string>({
            query: (id) => ({
                url: `/products/${id}/image`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Product']
        }),

        getProductDetails: builder.query<any, string>({
            query: (id) => `/products/${id}/details`,
            providesTags: (_result, _error, id) => [{ type: 'Product', id }]
        }),
    })
})

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useSearchProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useCreateProductsBatchMutation,
    useUploadProductImageMutation,
    useDeleteProductImageMutation,
    useGetProductDetailsQuery
} = productApi
