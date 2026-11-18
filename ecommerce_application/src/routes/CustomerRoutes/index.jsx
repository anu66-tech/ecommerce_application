import { Navigate } from 'react-router-dom'
import { useStore } from '../../shared/store/store.js'
import CustomerLayout from '../../customer/layout/CustomerLayout.jsx'
import {
  CustomerCartRoute,
  CustomerCheckoutRoute,
  CustomerHomeRoute,
  CustomerOrderSuccessRoute,
  CustomerOrdersRoute,
  CustomerAccountRoute,
  CustomerProductRoute,
  CustomerProductsRoute,
  CustomerWishlistRoute,
} from '../../customer/routes/CustomerRoutes.jsx'

function RequireCustomer({ children }) {
  const currentUser = useStore('currentUser')
  const currentAdmin = useStore('currentAdmin')

  if (currentUser?.role === 'customer') {
    return children
  }

  if (currentAdmin?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/login?redirect=/account" replace />
}

const customerRoutes = [
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerHomeRoute /> },
      { path: 'home', element: <CustomerHomeRoute /> },
      { path: 'products', element: <CustomerProductsRoute /> },
      { path: 'products/:id', element: <CustomerProductRoute /> },
      { path: 'wishlist', element: <CustomerWishlistRoute /> },
      { path: 'cart', element: <CustomerCartRoute /> },
      { path: 'checkout', element: <CustomerCheckoutRoute /> },
      { path: 'checkout/address', element: <CustomerCheckoutRoute /> },
      { path: 'checkout/delivery', element: <CustomerCheckoutRoute /> },
      { path: 'checkout/payment', element: <CustomerCheckoutRoute /> },
      { path: 'checkout/review', element: <CustomerCheckoutRoute /> },
      { path: 'order-success', element: <CustomerOrderSuccessRoute /> },
      {
        path: 'orders',
        element: (
          <RequireCustomer>
            <CustomerOrdersRoute />
          </RequireCustomer>
        ),
      },
      {
        path: 'account',
        element: (
          <RequireCustomer>
            <CustomerAccountRoute />
          </RequireCustomer>
        ),
      },
    ],
  },
]

export default customerRoutes
