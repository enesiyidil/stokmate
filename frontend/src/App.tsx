import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import UsersPage from './pages/UsersPage'
import CustomersPage from './pages/CustomersPage'
import StoresPage from './pages/StoresPage'
import StoreDetailsPage from './pages/StoreDetailsPage'
import ProfileUpdatePage from './pages/ProfileUpdatePage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/orders/OrderDetailsPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductDetailsPage from './pages/products/ProductDetailsPage'
import ProductAcceptancePage from './pages/products/ProductAcceptancePage'
import OrderReceiptsPage from './pages/OrderReceiptsPage'
import SalesPage from './pages/sales/SalesPage'
import RequestsPage from './pages/RequestsPage'
import SettingsPage from './pages/SettingsPage'
import SupportRequestsPage from './pages/SupportRequestsPage'
import AboutPage from './pages/AboutPage'
import ProtectedRoute from './routes/ProtectedRoute'
import SidebarLayout from './components/layout/SidebarLayout'
import ShipmentOperationsPage from './pages/shipment/ShipmentOperationsPage'
import ShipmentDetailsPage from './pages/shipment/ShipmentDetailsPage'

import SaleDetailsPage from './pages/sales/SaleDetailsPage';
import VehiclesPage from './pages/VehiclesPage'
import CrossConversionsPage from './pages/CrossConversionsPage'
import BalanceLedgerPage from './pages/BalanceLedgerPage'
import { EventsPage } from './pages/events/EventsPage'
import { ProtectedRoute as RoleProtectedRoute } from './components/auth/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import AccessDeniedModal from './components/common/AccessDeniedModal'
import SessionExpiredModal from './components/auth/SessionExpiredModal'

import DeliveryConfirmPage from './pages/delivery/DeliveryConfirmPage'
import ReportsPageReal from './pages/reports/ReportsPage'
import NotesPage from './pages/notes/NotesPage'
import FeedbackPage from './pages/FeedbackPage'






const Unauthorized = () => (
  <div className="min-h-screen bg-gradient-to-br from-stone-800 via-amber-900 to-orange-950 flex items-center justify-center p-4">
    <div className="backdrop-blur-md bg-stone-900/90 border border-amber-700/40 rounded-2xl p-8 text-center shadow-2xl">
      <h1 className="text-2xl font-bold text-red-400 mb-2">Yetkisiz Erişim</h1>
      <p className="text-amber-300">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
    </div>
  </div>
)

import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <AccessDeniedModal />
      <BrowserRouter>
        <SessionExpiredModal />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes with sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route path="/delivery-confirm/:token" element={<DeliveryConfirmPage />} />
            <Route element={<SidebarLayout><Outlet /></SidebarLayout>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/update" element={<ProfileUpdatePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailsPage />} />
              <Route path="/order-receipts" element={<OrderReceiptsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/accept-order" element={<ProductAcceptancePage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/:id" element={<SaleDetailsPage />} />
              <Route path="/sales/:id" element={<SaleDetailsPage />} />
              <Route path="/shipment" element={<ShipmentOperationsPage />} />
              <Route path="/shipment/:orderId" element={<ShipmentDetailsPage />} />
              <Route path="/cross-conversions" element={<CrossConversionsPage />} />
              <Route path="/balance-ledger" element={<BalanceLedgerPage />} />
              <Route path="/requests" element={<SupportRequestsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/reports" element={<ReportsPageReal />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/support-requests" element={<SupportRequestsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']} />}>
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/stores/:id" element={<StoreDetailsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR']} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
              </Route>

              {/* Admin/Manager/Warehouse Manager routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DIRECTOR', 'OPERATIONS_MANAGER', 'LOGISTICS_MANAGER']} />}>
                <Route path="/vehicles" element={<VehiclesPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App


