import { api } from '../api/base.api'

export interface VehicleRequest {
    licensePlate: string
    vehicleType: string
}

export interface VehicleResponse {
    id: string
    licensePlate: string
    vehicleType: string
    createdAt: string
}

export const vehicleApi = api.injectEndpoints({
    endpoints: (builder) => ({
        listVehicles: builder.query<VehicleResponse[], void>({
            query: () => '/vehicles',
            providesTags: ['Vehicles'],
        }),
        getVehicle: builder.query<VehicleResponse, string>({
            query: (id) => `/vehicles/${id}`,
            providesTags: ['Vehicles'],
        }),
        createVehicle: builder.mutation<VehicleResponse, VehicleRequest>({
            query: (vehicle) => ({
                url: '/vehicles',
                method: 'POST',
                body: vehicle,
            }),
            invalidatesTags: ['Vehicles'],
        }),
        updateVehicle: builder.mutation<VehicleResponse, { id: string; data: VehicleRequest }>({
            query: ({ id, data }) => ({
                url: `/vehicles/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Vehicles'],
        }),
        deleteVehicle: builder.mutation<void, string>({
            query: (id) => ({
                url: `/vehicles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Vehicles'],
        }),
    }),
})

export const {
    useListVehiclesQuery,
    useGetVehicleQuery,
    useCreateVehicleMutation,
    useUpdateVehicleMutation,
    useDeleteVehicleMutation,
} = vehicleApi
