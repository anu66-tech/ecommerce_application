import { Navigate } from 'react-router-dom'
import { useStore } from '../../shared/store/store.js'
import LoginPage from '../../shared/auth/LoginPage.jsx'
import AdminLayout from '../../admin/layout/AdminLayout.jsx'
import Dashboard from '../../admin/pages/dashboard/Dashboard.jsx'
import AdminProducts from '../../admin/pages/products/AdminProducts.jsx'
import AdminCategories from '../../admin/pages/categories/AdminCategories.jsx'
import AdminInventory from '../../admin/pages/inventory/AdminInventory.jsx'
import AdminOrders from '../../admin/pages/orders/AdminOrders.jsx'
import AdminAccount from '../../admin/pages/account/AdminAccount.jsx'

function RequireAdmin({ children }) {
  const currentAdmin = useStore('currentAdmin')
  const currentUser = useStore('currentUser')

  // Only open admin panel when admin credential has been authenticated
  if (currentAdmin?.role === 'admin') {
    return children
  }

  // If customer credential is authenticated, do not open admin panel; redirect to customer storefront
  if (currentUser?.role === 'customer') {
    return <Navigate to="/home" replace />
  }

  // Neither credential provided: redirect to admin login
  return <Navigate to="/admin/login" replace />
}

const adminRoutes = [
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'account', element: <AdminAccount /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]

export default adminRoutes
