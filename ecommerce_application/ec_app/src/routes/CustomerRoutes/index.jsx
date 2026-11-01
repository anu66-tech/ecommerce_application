import CustomerLayout from '../../pages/customer/Storefront'
import {
  CustomerCartRoute,
  CustomerCheckoutRoute,
  CustomerHomeRoute,
  CustomerOrderSuccessRoute,
  CustomerOrdersRoute,
  CustomerProductRoute,
  CustomerProductsRoute,
  CustomerWishlistRoute,
} from '../../pages/customer/CustomerRoutes'

const customerRoutes = [
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerHomeRoute /> },
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
    ],
  },
]

export default customerRoutes
