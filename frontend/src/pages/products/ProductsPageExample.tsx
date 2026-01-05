// Example: ProductsPage.tsx with role-based button controls

import { usePermissions } from '../../hooks/usePermissions';

export const ProductsPage = () => {
    const { canManageProducts, canDeleteDirect } = usePermissions();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Ürünler</h1>

                {/* Only show "Add Product" button if user can manage products */}
                {canManageProducts && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Yeni Ürün Ekle
                    </button>
                )}
            </div>

            {/* Product list */}
            <div className="bg-white rounded-lg shadow">
                {/* Example product row */}
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold">Ürün Adı</h3>
                        <p className="text-sm text-gray-600">Ürün detayları...</p>
                    </div>

                    <div className="flex gap-2">
                        {/* Edit button - only for users who can manage products */}
                        {canManageProducts && (
                            <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                                Düzenle
                            </button>
                        )}

                        {/* Delete button - only for users who can delete directly (ADMIN, MANAGER) */}
                        {canDeleteDirect && (
                            <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                                Sil
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* 
USAGE IN OTHER PAGES:

1. VehiclesPage:
   const { canManageVehicles, canDeleteDirect } = usePermissions();
   - Show "Add Vehicle" only if canManageVehicles
   - Show "Delete" button only if canDeleteDirect

2. UsersPage:
   const { canManageUsers } = usePermissions();
   - Entire page protected by ProtectedRoute
   - Show "Add User" only if canManageUsers

3. OrdersPage:
   const { canCancelOrders } = usePermissions();
   - Show "Cancel" button only if canCancelOrders (DIRECTOR+)

4. For ANY page:
   import { usePermissions } from '../../hooks/usePermissions';
   
   const {
     canManageProducts,
     canManageUsers,
     canManageVehicles,
     canManageShipments,
     canManageSales,
     canCancelOrders,
     canDeleteDirect,
     canAccessEventsPage
   } = usePermissions();
   
   Then use these flags to conditionally show/hide/disable buttons.
*/
