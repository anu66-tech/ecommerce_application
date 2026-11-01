import { Navigate } from 'react-router-dom'
import {
  AdminCategories,
  AdminInventory,
  AdminLayout,
  AdminOrders,
  AdminOverview,
  AdminProducts,
} from '../../pages/Admin/AdminPanel'

const adminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]

export default adminRoutes
