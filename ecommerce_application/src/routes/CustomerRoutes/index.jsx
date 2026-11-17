import { Navigate } from 'react-router-dom'
import { useStore } from '../../pages/customer/store'
import CustomerLayout from '../../pages/customer/Storefront'
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
} from '../../pages/customer/CustomerRoutes'

function RequireCustomer({ children }) {
  const currentUser = useStore('currentUser')
  const currentAdmin = useStore('currentAdmin')

  // Only open storefront when customer credential has been authenticated
  if (currentUser?.role === 'customer') {
    return children
  }

  // If admin credential is authenticated, do not open storefront; redirect to admin panel
  if (currentAdmin?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  // Neither credential provided: redirect to login
  return <Navigate to="/login" replace />
}

const customerRoutes = [
  {
    path: '/',
    element: (
      <RequireCustomer>
        <CustomerLayout />
      </RequireCustomer>
    ),
    children: [
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
      { path: 'orders', element: <CustomerOrdersRoute /> },
      { path: 'account', element: <CustomerAccountRoute /> },
    ],
  },
]

export default customerRoutes
