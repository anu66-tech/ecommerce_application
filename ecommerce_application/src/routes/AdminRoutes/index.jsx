import { Navigate } from 'react-router-dom'
import { useStore } from '../../pages/customer/store'
import LoginPage from '../../pages/customer/LoginPage'
import AdminAccount from '../../pages/Admin/AdminAccount'
import {
  AdminCategories,
  AdminInventory,
  AdminLayout,
  AdminOrders,
  AdminOverview,
  AdminProducts,
} from '../../pages/Admin/AdminPanel'

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
      { index: true, element: <AdminOverview /> },
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
